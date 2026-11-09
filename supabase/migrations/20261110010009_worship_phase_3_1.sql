-- 009_worship_phase_3_1: pre_chorus section type + time_signature on songs

alter table public.song_sections
  drop constraint if exists song_sections_section_type_check;

alter table public.song_sections
  add constraint song_sections_section_type_check
  check (
    section_type in (
      'intro',
      'verse',
      'pre_chorus',
      'chorus',
      'bridge',
      'outro'
    )
  );

alter table public.songs
  add column if not exists time_signature text not null default '4/4';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'songs_time_signature_check'
  ) then
    alter table public.songs
      add constraint songs_time_signature_check
      check (time_signature in ('4/4', '3/4', '6/8'));
  end if;
end $$;
