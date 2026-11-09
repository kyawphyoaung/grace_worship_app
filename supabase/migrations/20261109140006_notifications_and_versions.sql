-- 006_notifications_and_versions:
-- KJV column, multi-version prefs, recipient_id, notifications, sharing RLS fix

-- ---------------------------------------------------------------------------
-- Bible versions + profile prefs
-- ---------------------------------------------------------------------------

alter table public.bible_verses
  add column if not exists text_kjv text;

alter table public.profiles
  add column if not exists preferred_bible_languages text[] not null default '{mm,en}';

alter table public.profiles
  drop constraint if exists profiles_preferred_bible_languages_check;

alter table public.profiles
  add constraint profiles_preferred_bible_languages_check
  check (
    preferred_bible_languages <@ array['mm', 'en', 'chin', 'kjv']::text[]
    and cardinality(preferred_bible_languages) >= 1
  );

-- ---------------------------------------------------------------------------
-- Directed prayer / gratitude
-- ---------------------------------------------------------------------------

alter table public.prayers
  add column if not exists recipient_id uuid references auth.users (id) on delete set null;

alter table public.gratitude_entries
  add column if not exists recipient_id uuid references auth.users (id) on delete set null;

create index if not exists prayers_recipient_idx
  on public.prayers (recipient_id)
  where recipient_id is not null;

create index if not exists gratitude_recipient_idx
  on public.gratitude_entries (recipient_id)
  where recipient_id is not null;

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  actor_id uuid not null references auth.users (id) on delete cascade,
  type text not null
    check (type in (
      'prayer_shared',
      'prayer_prayed_for',
      'prayer_encouraged',
      'gratitude_shared',
      'gratitude_received'
    )),
  entity_type text not null
    check (entity_type in ('prayer', 'gratitude', 'prayer_interaction')),
  entity_id uuid not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_actor_not_self check (user_id <> actor_id)
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
  on public.notifications for delete
  to authenticated
  using (user_id = auth.uid());

-- Inserts are created by SECURITY DEFINER triggers only (no client insert policy).

-- ---------------------------------------------------------------------------
-- Fix sharing RLS: owner always; partner when is_shared; recipient always
-- ---------------------------------------------------------------------------

drop policy if exists "prayers_select_owner_or_shared_partner" on public.prayers;
create policy "prayers_select_owner_or_shared_partner"
  on public.prayers for select
  to authenticated
  using (
    user_id = auth.uid()
    or recipient_id = auth.uid()
    or (
      is_shared = true
      and user_id = public.get_partner_id()
    )
  );

drop policy if exists "gratitude_select_owner_or_shared_partner" on public.gratitude_entries;
create policy "gratitude_select_owner_or_shared_partner"
  on public.gratitude_entries for select
  to authenticated
  using (
    user_id = auth.uid()
    or recipient_id = auth.uid()
    or (
      is_shared = true
      and user_id = public.get_partner_id()
    )
  );

-- Keep interaction policies aligned with the same partner check
drop policy if exists "prayer_interactions_select_visible" on public.prayer_interactions;
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
          or p.recipient_id = auth.uid()
          or (
            p.is_shared = true
            and p.user_id = public.get_partner_id()
          )
        )
    )
  );

drop policy if exists "prayer_interactions_insert_on_shared" on public.prayer_interactions;
create policy "prayer_interactions_insert_on_shared"
  on public.prayer_interactions for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.prayers p
      where p.id = prayer_id
        and p.is_shared = true
        and (
          p.user_id = auth.uid()
          or p.user_id = public.get_partner_id()
          or p.recipient_id = auth.uid()
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Notification helpers + triggers
-- ---------------------------------------------------------------------------

create or replace function public.notify_partner(
  p_user_id uuid,
  p_actor_id uuid,
  p_type text,
  p_entity_type text,
  p_entity_id uuid,
  p_message text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user_id is null or p_actor_id is null then
    return;
  end if;
  if p_user_id = p_actor_id then
    return;
  end if;

  insert into public.notifications (
    user_id,
    actor_id,
    type,
    entity_type,
    entity_id,
    message
  ) values (
    p_user_id,
    p_actor_id,
    p_type,
    p_entity_type,
    p_entity_id,
    p_message
  );
end;
$$;

create or replace function public.on_prayer_notify()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  partner uuid;
  actor_name text;
begin
  select case
    when new.user_id = user_a then user_b
    when new.user_id = user_b then user_a
    else null
  end
  into partner
  from public.partners
  where new.user_id in (user_a, user_b)
  limit 1;

  select coalesce(nullif(trim(display_name), ''), 'Partner')
  into actor_name
  from public.profiles
  where id = new.user_id;

  if tg_op = 'INSERT' then
    if new.recipient_id is not null and new.recipient_id <> new.user_id then
      perform public.notify_partner(
        new.recipient_id,
        new.user_id,
        'prayer_shared',
        'prayer',
        new.id,
        actor_name || ' prayed for you'
      );
    elsif new.is_shared and partner is not null then
      perform public.notify_partner(
        partner,
        new.user_id,
        'prayer_shared',
        'prayer',
        new.id,
        actor_name || ' shared a prayer'
      );
    end if;
  elsif tg_op = 'UPDATE' then
    if new.is_shared and not coalesce(old.is_shared, false) and partner is not null then
      perform public.notify_partner(
        partner,
        new.user_id,
        'prayer_shared',
        'prayer',
        new.id,
        actor_name || ' shared a prayer'
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prayers_notify on public.prayers;
create trigger prayers_notify
  after insert or update of is_shared, recipient_id
  on public.prayers
  for each row execute function public.on_prayer_notify();

create or replace function public.on_gratitude_notify()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  partner uuid;
  actor_name text;
begin
  select case
    when new.user_id = user_a then user_b
    when new.user_id = user_b then user_a
    else null
  end
  into partner
  from public.partners
  where new.user_id in (user_a, user_b)
  limit 1;

  select coalesce(nullif(trim(display_name), ''), 'Partner')
  into actor_name
  from public.profiles
  where id = new.user_id;

  if tg_op = 'INSERT' then
    if new.recipient_id is not null and new.recipient_id <> new.user_id then
      perform public.notify_partner(
        new.recipient_id,
        new.user_id,
        'gratitude_received',
        'gratitude',
        new.id,
        actor_name || ' sent you gratitude'
      );
    elsif new.is_shared and partner is not null then
      perform public.notify_partner(
        partner,
        new.user_id,
        'gratitude_shared',
        'gratitude',
        new.id,
        actor_name || ' shared gratitude'
      );
    end if;
  elsif tg_op = 'UPDATE' then
    if new.is_shared and not coalesce(old.is_shared, false) and partner is not null then
      perform public.notify_partner(
        partner,
        new.user_id,
        'gratitude_shared',
        'gratitude',
        new.id,
        actor_name || ' shared gratitude'
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists gratitude_notify on public.gratitude_entries;
create trigger gratitude_notify
  after insert or update of is_shared, recipient_id
  on public.gratitude_entries
  for each row execute function public.on_gratitude_notify();

create or replace function public.on_prayer_interaction_notify()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  prayer_owner uuid;
  actor_name text;
  action_text text;
begin
  select p.user_id into prayer_owner
  from public.prayers p
  where p.id = new.prayer_id;

  if prayer_owner is null or prayer_owner = new.user_id then
    return new;
  end if;

  select coalesce(nullif(trim(display_name), ''), 'Partner')
  into actor_name
  from public.profiles
  where id = new.user_id;

  if new.interaction_type = 'prayed_for' then
    action_text := actor_name || ' prayed for your prayer';
    perform public.notify_partner(
      prayer_owner,
      new.user_id,
      'prayer_prayed_for',
      'prayer_interaction',
      new.id,
      action_text
    );
  elsif new.interaction_type = 'encouraged' then
    action_text := actor_name || ' encouraged your prayer';
    perform public.notify_partner(
      prayer_owner,
      new.user_id,
      'prayer_encouraged',
      'prayer_interaction',
      new.id,
      action_text
    );
  end if;

  return new;
end;
$$;

drop trigger if exists prayer_interactions_notify on public.prayer_interactions;
create trigger prayer_interactions_notify
  after insert
  on public.prayer_interactions
  for each row execute function public.on_prayer_interaction_notify();

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end;
$$;
