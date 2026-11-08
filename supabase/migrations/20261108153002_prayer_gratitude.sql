-- 002_prayer_gratitude: prayers, interactions, gratitude, RLS

create table public.prayers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  content text not null,
  status text not null default 'pending'
    check (status in ('pending', 'answered')),
  answered_at date,
  testimony text,
  is_shared boolean not null default true,
  created_at timestamptz not null default now()
);

create index prayers_user_status_idx on public.prayers (user_id, status);

create table public.prayer_interactions (
  id uuid primary key default gen_random_uuid(),
  prayer_id uuid not null references public.prayers (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  interaction_type text not null
    check (interaction_type in ('prayed_for', 'encouraged')),
  note text,
  created_at timestamptz not null default now()
);

create index prayer_interactions_prayer_idx
  on public.prayer_interactions (prayer_id);

create table public.gratitude_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  entry_date date not null default (timezone('utc', now()))::date,
  is_shared boolean not null default false,
  created_at timestamptz not null default now()
);

create index gratitude_entries_user_date_idx
  on public.gratitude_entries (user_id, entry_date);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.prayers enable row level security;
alter table public.prayer_interactions enable row level security;
alter table public.gratitude_entries enable row level security;

-- prayers: owner always; partner if shared
create policy "prayers_select_owner_or_shared_partner"
  on public.prayers for select
  to authenticated
  using (
    user_id = auth.uid()
    or (is_shared and public.is_partner(user_id))
  );

create policy "prayers_insert_own"
  on public.prayers for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "prayers_update_own"
  on public.prayers for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "prayers_delete_own"
  on public.prayers for delete
  to authenticated
  using (user_id = auth.uid());

-- prayer_interactions: readable if related prayer is visible;
-- partner can insert for shared prayers
create policy "prayer_interactions_select_visible"
  on public.prayer_interactions for select
  to authenticated
  using (
    exists (
      select 1
      from public.prayers p
      where p.id = prayer_id
        and (
          p.user_id = auth.uid()
          or (p.is_shared and public.is_partner(p.user_id))
        )
    )
  );

create policy "prayer_interactions_insert_on_shared"
  on public.prayer_interactions for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.prayers p
      where p.id = prayer_id
        and p.is_shared
        and (
          p.user_id = auth.uid()
          or public.is_partner(p.user_id)
        )
    )
  );

create policy "prayer_interactions_delete_own"
  on public.prayer_interactions for delete
  to authenticated
  using (user_id = auth.uid());

-- gratitude: owner always; partner if shared
create policy "gratitude_select_owner_or_shared_partner"
  on public.gratitude_entries for select
  to authenticated
  using (
    user_id = auth.uid()
    or (is_shared and public.is_partner(user_id))
  );

create policy "gratitude_insert_own"
  on public.gratitude_entries for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "gratitude_update_own"
  on public.gratitude_entries for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "gratitude_delete_own"
  on public.gratitude_entries for delete
  to authenticated
  using (user_id = auth.uid());
