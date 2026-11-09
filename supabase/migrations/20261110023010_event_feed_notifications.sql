-- 010_event_feed_notifications: notify partner on event prayers, feedback, reflections

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'prayer_shared',
    'prayer_prayed_for',
    'prayer_encouraged',
    'gratitude_shared',
    'gratitude_received',
    'feed_loved',
    'feed_commented',
    'event_partner_prayer',
    'event_feedback',
    'event_reflection'
  ));

alter table public.notifications
  drop constraint if exists notifications_entity_type_check;

alter table public.notifications
  add constraint notifications_entity_type_check
  check (entity_type in (
    'prayer',
    'gratitude',
    'prayer_interaction',
    'feed_reaction',
    'feed_comment',
    'event_prayer',
    'event_feedback',
    'ministry_reflection',
    'event'
  ));

-- Partner prayer → notify event owner
create or replace function public.on_event_prayer_notify()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  owner_id uuid;
  actor_name text;
  event_label text;
begin
  select user_id, event_name
  into owner_id, event_label
  from public.events
  where id = new.event_id;

  if owner_id is null or owner_id = new.from_user_id then
    return new;
  end if;

  select coalesce(nullif(trim(display_name), ''), 'Partner')
  into actor_name
  from public.profiles
  where id = new.from_user_id;

  perform public.notify_partner(
    owner_id,
    new.from_user_id,
    'event_partner_prayer',
    'event_prayer',
    new.id,
    actor_name || ' left a prayer for ' || coalesce(event_label, 'your event')
  );

  return new;
end;
$$;

drop trigger if exists event_prayers_notify on public.event_prayers;
create trigger event_prayers_notify
  after insert on public.event_prayers
  for each row execute function public.on_event_prayer_notify();

-- Event feedback → notify recipient (event owner)
create or replace function public.on_event_feedback_notify()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_name text;
  event_label text;
begin
  if new.to_user_id is null or new.to_user_id = new.from_user_id then
    return new;
  end if;

  select event_name into event_label
  from public.events
  where id = new.event_id;

  select coalesce(nullif(trim(display_name), ''), 'Partner')
  into actor_name
  from public.profiles
  where id = new.from_user_id;

  perform public.notify_partner(
    new.to_user_id,
    new.from_user_id,
    'event_feedback',
    'event_feedback',
    new.id,
    actor_name || ' left feedback on ' || coalesce(event_label, 'your event')
  );

  return new;
end;
$$;

drop trigger if exists event_feedback_notify on public.event_feedback;
create trigger event_feedback_notify
  after insert on public.event_feedback
  for each row execute function public.on_event_feedback_notify();

-- Ministry reflection / serving gratitude → notify partner
create or replace function public.on_ministry_reflection_notify()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  partner uuid;
  actor_name text;
  event_label text;
  should_notify boolean := false;
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

  if partner is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    should_notify :=
      nullif(trim(coalesce(new.post_service_reflection, '')), '') is not null
      or nullif(trim(coalesce(new.serving_gratitude, '')), '') is not null;
  elsif tg_op = 'UPDATE' then
    should_notify :=
      (
        coalesce(new.post_service_reflection, '') is distinct from coalesce(old.post_service_reflection, '')
        or coalesce(new.serving_gratitude, '') is distinct from coalesce(old.serving_gratitude, '')
      )
      and (
        nullif(trim(coalesce(new.post_service_reflection, '')), '') is not null
        or nullif(trim(coalesce(new.serving_gratitude, '')), '') is not null
      );
  end if;

  if not should_notify then
    return new;
  end if;

  select event_name into event_label
  from public.events
  where id = new.event_id;

  select coalesce(nullif(trim(display_name), ''), 'Partner')
  into actor_name
  from public.profiles
  where id = new.user_id;

  perform public.notify_partner(
    partner,
    new.user_id,
    'event_reflection',
    'ministry_reflection',
    new.id,
    actor_name || ' shared a post-service note on ' || coalesce(event_label, 'an event')
  );

  return new;
end;
$$;

drop trigger if exists ministry_reflections_notify on public.ministry_reflections;
create trigger ministry_reflections_notify
  after insert or update on public.ministry_reflections
  for each row execute function public.on_ministry_reflection_notify();
