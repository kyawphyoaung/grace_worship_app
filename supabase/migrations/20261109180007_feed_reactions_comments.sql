-- 007_feed_reactions_comments: love reactions + comments on prayers/gratitude

create table public.feed_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entity_type text not null check (entity_type in ('prayer', 'gratitude')),
  entity_id uuid not null,
  reaction text not null default 'love' check (reaction in ('love')),
  created_at timestamptz not null default now(),
  constraint feed_reactions_unique unique (user_id, entity_type, entity_id, reaction)
);

create index feed_reactions_entity_idx
  on public.feed_reactions (entity_type, entity_id);

create table public.feed_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entity_type text not null check (entity_type in ('prayer', 'gratitude')),
  entity_id uuid not null,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create index feed_comments_entity_idx
  on public.feed_comments (entity_type, entity_id, created_at);

alter table public.feed_reactions enable row level security;
alter table public.feed_comments enable row level security;

-- Helper: can the current user see this prayer/gratitude entity?
create or replace function public.can_view_feed_entity(
  p_entity_type text,
  p_entity_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when p_entity_type = 'prayer' then exists (
      select 1 from public.prayers p
      where p.id = p_entity_id
        and (
          p.user_id = auth.uid()
          or p.recipient_id = auth.uid()
          or (p.is_shared and p.user_id = public.get_partner_id())
        )
    )
    when p_entity_type = 'gratitude' then exists (
      select 1 from public.gratitude_entries g
      where g.id = p_entity_id
        and (
          g.user_id = auth.uid()
          or g.recipient_id = auth.uid()
          or (g.is_shared and g.user_id = public.get_partner_id())
        )
    )
    else false
  end;
$$;

create policy "feed_reactions_select_visible"
  on public.feed_reactions for select
  to authenticated
  using (public.can_view_feed_entity(entity_type, entity_id));

create policy "feed_reactions_insert_partner_only"
  on public.feed_reactions for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.can_view_feed_entity(entity_type, entity_id)
    and (
      (entity_type = 'prayer' and exists (
        select 1 from public.prayers p
        where p.id = entity_id and p.user_id = public.get_partner_id()
      ))
      or
      (entity_type = 'gratitude' and exists (
        select 1 from public.gratitude_entries g
        where g.id = entity_id and g.user_id = public.get_partner_id()
      ))
    )
  );

create policy "feed_reactions_delete_own"
  on public.feed_reactions for delete
  to authenticated
  using (user_id = auth.uid());

create policy "feed_comments_select_visible"
  on public.feed_comments for select
  to authenticated
  using (public.can_view_feed_entity(entity_type, entity_id));

create policy "feed_comments_insert_visible"
  on public.feed_comments for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.can_view_feed_entity(entity_type, entity_id)
  );

create policy "feed_comments_delete_own"
  on public.feed_comments for delete
  to authenticated
  using (user_id = auth.uid());

create policy "feed_comments_update_own"
  on public.feed_comments for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
