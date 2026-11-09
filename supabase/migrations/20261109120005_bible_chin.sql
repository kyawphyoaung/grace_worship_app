-- 005_bible_chin: Chin (Tedim/Zomi) Bible text columns
-- RLS unchanged; columns are nullable until seed:bible:chin is run.

alter table public.bible_verses
  add column if not exists text_chin text;

alter table public.bible_books
  add column if not exists name_chin text;
