-- 008_feed_interaction_notifications: notify authors on love/comment

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
    'feed_commented'
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
    'feed_comment'
  ));

create or replace function public.feed_entity_owner(
  p_entity_type text,
  p_entity_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when p_entity_type = 'prayer' then (
      select user_id from public.prayers where id = p_entity_id
    )
    when p_entity_type = 'gratitude' then (
      select user_id from public.gratitude_entries where id = p_entity_id
    )
    else null
  end;
$$;

create or replace function public.on_feed_reaction_notify()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  owner_id uuid;
  actor_name text;
begin
  owner_id := public.feed_entity_owner(new.entity_type, new.entity_id);
  if owner_id is null or owner_id = new.user_id then
    return new;
  end if;

  select coalesce(nullif(trim(display_name), ''), 'Partner')
  into actor_name
  from public.profiles
  where id = new.user_id;

  perform public.notify_partner(
    owner_id,
    new.user_id,
    'feed_loved',
    'feed_reaction',
    new.id,
    actor_name || ' loved your post'
  );

  return new;
end;
$$;

drop trigger if exists feed_reactions_notify on public.feed_reactions;
create trigger feed_reactions_notify
  after insert on public.feed_reactions
  for each row execute function public.on_feed_reaction_notify();

create or replace function public.on_feed_comment_notify()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  owner_id uuid;
  actor_name text;
begin
  owner_id := public.feed_entity_owner(new.entity_type, new.entity_id);
  if owner_id is null or owner_id = new.user_id then
    return new;
  end if;

  select coalesce(nullif(trim(display_name), ''), 'Partner')
  into actor_name
  from public.profiles
  where id = new.user_id;

  perform public.notify_partner(
    owner_id,
    new.user_id,
    'feed_commented',
    'feed_comment',
    new.id,
    actor_name || ' commented on your post'
  );

  return new;
end;
$$;

drop trigger if exists feed_comments_notify on public.feed_comments;
create trigger feed_comments_notify
  after insert on public.feed_comments
  for each row execute function public.on_feed_comment_notify();
