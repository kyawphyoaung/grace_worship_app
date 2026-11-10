-- 011_phase_3_3_polish:
-- songs.youtube_url + client partner notifications (presence / bible invite)

alter table public.songs
  add column if not exists youtube_url text;

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
    'event_reflection',
    'presence_opened',
    'bible_study_invite'
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
    'event',
    'presence',
    'bible_study'
  ));

-- Allow a user to notify their partner for presence + bible invite only.
drop policy if exists "notifications_insert_to_partner" on public.notifications;
create policy "notifications_insert_to_partner"
  on public.notifications for insert
  to authenticated
  with check (
    actor_id = auth.uid()
    and user_id = public.get_partner_id()
    and type in ('presence_opened', 'bible_study_invite')
    and entity_type in ('presence', 'bible_study')
  );
