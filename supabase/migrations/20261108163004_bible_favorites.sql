-- 004_bible_favorites: verse highlights and favorites

create table public.bible_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.bible_books (id) on delete cascade,
  chapter int not null check (chapter > 0),
  verse int not null check (verse > 0),
  verse_end int check (verse_end is null or verse_end >= verse),
  highlighted_text text,
  kind text not null check (kind in ('highlight', 'favorite')),
  is_shared boolean not null default false,
  created_at timestamptz not null default now()
);

create index bible_favorites_user_idx
  on public.bible_favorites (user_id, book_id, chapter);

create index bible_favorites_shared_idx
  on public.bible_favorites (user_id, is_shared)
  where is_shared = true;

alter table public.bible_favorites enable row level security;

create policy "bible_favorites_select_owner_or_shared"
  on public.bible_favorites for select
  to authenticated
  using (
    user_id = auth.uid()
    or (is_shared and public.is_partner(user_id))
  );

create policy "bible_favorites_insert_own"
  on public.bible_favorites for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "bible_favorites_update_own"
  on public.bible_favorites for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "bible_favorites_delete_own"
  on public.bible_favorites for delete
  to authenticated
  using (user_id = auth.uid());
