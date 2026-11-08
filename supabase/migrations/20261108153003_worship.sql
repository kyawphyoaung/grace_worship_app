-- 003_worship: songs, events, setlists, partner features, touch triggers, RLS

create table public.songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title_mm text,
  title_en text,
  author text,
  default_key text,
  tempo text check (tempo is null or tempo in ('slow', 'medium', 'fast')),
  bpm int,
  tags text[] not null default '{}',
  last_sung_date date,
  times_sung int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint songs_has_title check (
    coalesce(nullif(title_mm, ''), nullif(title_en, '')) is not null
  )
);

create index songs_tags_idx on public.songs using gin (tags);

create table public.song_sections (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs (id) on delete cascade,
  section_type text not null
    check (section_type in ('intro', 'verse', 'chorus', 'bridge', 'outro')),
  section_order int not null,
  label text,
  lyrics_mm text,
  lyrics_en text,
  notes text,
  bpm_override int,
  key_override text,
  constraint song_sections_order_unique unique (song_id, section_order)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_date date not null,
  event_name text not null,
  event_type text not null
    check (event_type in ('sunday', 'saturday', 'wednesday', 'custom')),
  role text not null
    check (role in ('leader', 'backup', 'participant')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create index events_date_idx on public.events (event_date);

create table public.setlists (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint setlists_event_unique unique (event_id)
);

create table public.setlist_items (
  id uuid primary key default gen_random_uuid(),
  setlist_id uuid not null references public.setlists (id) on delete cascade,
  song_id uuid not null references public.songs (id) on delete cascade,
  position int not null,
  key_override text,
  transition_note text,
  item_notes text,
  item_bpm int,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint setlist_items_position_unique unique (setlist_id, position)
);

create table public.event_prayers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  from_user_id uuid not null references auth.users (id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create table public.event_feedback (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  from_user_id uuid not null references auth.users (id) on delete cascade,
  to_user_id uuid not null references auth.users (id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create table public.ministry_reflections (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  post_service_reflection text,
  serving_gratitude text,
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  constraint ministry_reflections_event_user_unique unique (event_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Touch triggers: auto-set updated_at / updated_by
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_attribution()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

create trigger events_set_attribution
  before insert or update on public.events
  for each row execute function public.set_updated_attribution();

create trigger setlists_set_attribution
  before insert or update on public.setlists
  for each row execute function public.set_updated_attribution();

create trigger setlist_items_set_attribution
  before insert or update on public.setlist_items
  for each row execute function public.set_updated_attribution();

create or replace function public.set_songs_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger songs_set_updated_at
  before update on public.songs
  for each row execute function public.set_songs_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.songs enable row level security;
alter table public.song_sections enable row level security;
alter table public.events enable row level security;
alter table public.setlists enable row level security;
alter table public.setlist_items enable row level security;
alter table public.event_prayers enable row level security;
alter table public.event_feedback enable row level security;
alter table public.ministry_reflections enable row level security;

-- songs + song_sections: both users read/write (shared library)
create policy "songs_select_authenticated"
  on public.songs for select
  to authenticated
  using (true);

create policy "songs_insert_authenticated"
  on public.songs for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "songs_update_authenticated"
  on public.songs for update
  to authenticated
  using (true)
  with check (true);

create policy "songs_delete_authenticated"
  on public.songs for delete
  to authenticated
  using (true);

create policy "song_sections_select_authenticated"
  on public.song_sections for select
  to authenticated
  using (true);

create policy "song_sections_insert_authenticated"
  on public.song_sections for insert
  to authenticated
  with check (true);

create policy "song_sections_update_authenticated"
  on public.song_sections for update
  to authenticated
  using (true)
  with check (true);

create policy "song_sections_delete_authenticated"
  on public.song_sections for delete
  to authenticated
  using (true);

-- events / setlists / setlist_items: both users read and write
create policy "events_select_authenticated"
  on public.events for select
  to authenticated
  using (true);

create policy "events_insert_authenticated"
  on public.events for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "events_update_authenticated"
  on public.events for update
  to authenticated
  using (true)
  with check (true);

create policy "events_delete_authenticated"
  on public.events for delete
  to authenticated
  using (true);

create policy "setlists_select_authenticated"
  on public.setlists for select
  to authenticated
  using (true);

create policy "setlists_insert_authenticated"
  on public.setlists for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "setlists_update_authenticated"
  on public.setlists for update
  to authenticated
  using (true)
  with check (true);

create policy "setlists_delete_authenticated"
  on public.setlists for delete
  to authenticated
  using (true);

create policy "setlist_items_select_authenticated"
  on public.setlist_items for select
  to authenticated
  using (true);

create policy "setlist_items_insert_authenticated"
  on public.setlist_items for insert
  to authenticated
  with check (true);

create policy "setlist_items_update_authenticated"
  on public.setlist_items for update
  to authenticated
  using (true)
  with check (true);

create policy "setlist_items_delete_authenticated"
  on public.setlist_items for delete
  to authenticated
  using (true);

-- event_prayers: both read; from_user_id writes
create policy "event_prayers_select_authenticated"
  on public.event_prayers for select
  to authenticated
  using (true);

create policy "event_prayers_insert_own"
  on public.event_prayers for insert
  to authenticated
  with check (from_user_id = auth.uid());

create policy "event_prayers_update_own"
  on public.event_prayers for update
  to authenticated
  using (from_user_id = auth.uid())
  with check (from_user_id = auth.uid());

create policy "event_prayers_delete_own"
  on public.event_prayers for delete
  to authenticated
  using (from_user_id = auth.uid());

-- event_feedback: both read; from_user_id writes
create policy "event_feedback_select_authenticated"
  on public.event_feedback for select
  to authenticated
  using (true);

create policy "event_feedback_insert_own"
  on public.event_feedback for insert
  to authenticated
  with check (from_user_id = auth.uid());

create policy "event_feedback_update_own"
  on public.event_feedback for update
  to authenticated
  using (from_user_id = auth.uid())
  with check (from_user_id = auth.uid());

create policy "event_feedback_delete_own"
  on public.event_feedback for delete
  to authenticated
  using (from_user_id = auth.uid());

-- ministry_reflections: owner only unless is_shared
create policy "ministry_reflections_select_owner_or_shared"
  on public.ministry_reflections for select
  to authenticated
  using (
    user_id = auth.uid()
    or (is_shared and public.is_partner(user_id))
  );

create policy "ministry_reflections_insert_own"
  on public.ministry_reflections for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "ministry_reflections_update_own"
  on public.ministry_reflections for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "ministry_reflections_delete_own"
  on public.ministry_reflections for delete
  to authenticated
  using (user_id = auth.uid());
