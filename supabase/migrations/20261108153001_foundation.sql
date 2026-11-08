-- 001_foundation: profiles, partners, helpers, bible tables, RLS

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  preferred_language text not null default 'en'
    check (preferred_language in ('mm', 'en')),
  prayer_reminder_time time,
  created_at timestamptz not null default now()
);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users (id) on delete cascade,
  user_b uuid not null references auth.users (id) on delete cascade,
  linked_at timestamptz not null default now(),
  constraint partners_distinct_users check (user_a <> user_b),
  constraint partners_ordered_users check (user_a < user_b),
  constraint partners_user_a_unique unique (user_a),
  constraint partners_user_b_unique unique (user_b)
);

-- At most one partners row for this two-user app
create unique index partners_singleton_idx on public.partners ((true));

-- ---------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER to avoid RLS recursion)
-- ---------------------------------------------------------------------------

create or replace function public.get_partner_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when auth.uid() = user_a then user_b
    when auth.uid() = user_b then user_a
    else null
  end
  from public.partners
  where auth.uid() in (user_a, user_b)
  limit 1;
$$;

create or replace function public.is_partner(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select target is not null
    and target = public.get_partner_id();
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Bible tables
-- ---------------------------------------------------------------------------

create table public.bible_books (
  id uuid primary key default gen_random_uuid(),
  name_mm text not null,
  name_en text not null,
  abbreviation text not null,
  testament text not null check (testament in ('OT', 'NT')),
  book_order int not null unique
);

create table public.bible_verses (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.bible_books (id) on delete cascade,
  chapter int not null check (chapter > 0),
  verse int not null check (verse > 0),
  text_mm text not null,
  text_en text not null,
  constraint bible_verses_unique unique (book_id, chapter, verse)
);

create index bible_verses_book_chapter_idx
  on public.bible_verses (book_id, chapter);

create table public.bible_study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.bible_books (id) on delete cascade,
  chapter int not null check (chapter > 0),
  verses_read int not null default 0,
  completed boolean not null default false,
  session_date date not null default (timezone('utc', now()))::date,
  created_at timestamptz not null default now()
);

create index bible_study_sessions_user_date_idx
  on public.bible_study_sessions (user_id, session_date);

create table public.bible_study_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.bible_books (id) on delete cascade,
  chapter int not null check (chapter > 0),
  verse_start int not null check (verse_start > 0),
  verse_end int not null check (verse_end >= verse_start),
  reflection text not null,
  is_shared boolean not null default false,
  created_at timestamptz not null default now()
);

create index bible_study_notes_user_idx
  on public.bible_study_notes (user_id, book_id, chapter);

-- ---------------------------------------------------------------------------
-- Profile auto-create trigger
-- ---------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for existing auth users
insert into public.profiles (id, display_name)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.partners enable row level security;
alter table public.bible_books enable row level security;
alter table public.bible_verses enable row level security;
alter table public.bible_study_sessions enable row level security;
alter table public.bible_study_notes enable row level security;

-- profiles: both linked users can read both; users update own
create policy "profiles_select_self_or_partner"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or public.is_partner(id)
  );

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- partners: both users can read the row that links them
create policy "partners_select_linked"
  on public.partners for select
  to authenticated
  using (auth.uid() in (user_a, user_b));

-- bible_books / bible_verses: authenticated read
create policy "bible_books_select_authenticated"
  on public.bible_books for select
  to authenticated
  using (true);

create policy "bible_verses_select_authenticated"
  on public.bible_verses for select
  to authenticated
  using (true);

-- bible_study_sessions: owner + partner always readable; owner writes
create policy "bible_sessions_select_owner_or_partner"
  on public.bible_study_sessions for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_partner(user_id)
  );

create policy "bible_sessions_insert_own"
  on public.bible_study_sessions for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "bible_sessions_update_own"
  on public.bible_study_sessions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "bible_sessions_delete_own"
  on public.bible_study_sessions for delete
  to authenticated
  using (user_id = auth.uid());

-- bible_study_notes: owner always; partner only if is_shared
create policy "bible_notes_select_owner_or_shared_partner"
  on public.bible_study_notes for select
  to authenticated
  using (
    user_id = auth.uid()
    or (is_shared and public.is_partner(user_id))
  );

create policy "bible_notes_insert_own"
  on public.bible_study_notes for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "bible_notes_update_own"
  on public.bible_study_notes for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "bible_notes_delete_own"
  on public.bible_study_notes for delete
  to authenticated
  using (user_id = auth.uid());
