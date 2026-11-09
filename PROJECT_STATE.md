# Project State — Grace

## Completed phases
- Phase 1 (f56614b) — Foundation, auth, migrations 001–003
- Phase 2 (c1d6c00) — Bible, Prayer, Gratitude, dark theme
- Phase 2.5 (1d7f3c5) — iOS pickers, Home, Bible favorites, partner UI, migration 004
- Phase 2.5 fixes (986cd8c) — smoke test issues 1–9; migration 005 applied
- Phase 2.6 — KJV versions, sharing RLS fix, notifications, warm UI (migration 006)

## Next up
- Apply migration 006 (`supabase db push`) after owner review
- Run `npm run seed:bible:kjv` once (optional Chin already seeded)
- Phase 3 — Worship (songs, events, setlists, PDF, post-service)
- Phase 4 — Tracking, PWA, deploy

## Locked decisions
- App name: Grace · Warm peaceful dark (BG #1a1815–#201d19, surface #252220, cream #e8e2d8, sage #8ba888, amber #d4a574)
- Font: Noto Sans Myanmar · Anniversary: 2026-10-14 in lib/config.ts
- Partners: Harry + Ruth Hoih — always use `profiles.display_name` (no UUID→name map)
- Login-only auth; signup disabled
- Migrations: supabase migration new + db push only
- Packages allowed: @dnd-kit/core, @dnd-kit/sortable, @react-pdf/renderer, date-fns
- TypeScript strict, no `any`
- Single toast, 2.5s auto-dismiss
- Bible reader versions: multi-select MM / EN / Chin / KJV via `profiles.preferred_bible_languages` (default `{mm,en}`)

## Commands
npm run dev · npm run seed:bible · npm run seed:bible:chin · npm run seed:bible:kjv · supabase migration new \<n\> · supabase db push · supabase gen types typescript

## Tables
profiles (+preferred_bible_languages), partners, bible_books (+name_chin), bible_verses (+text_chin, +text_kjv), bible_study_sessions, bible_study_notes, bible_favorites, prayers (+recipient_id), prayer_interactions, gratitude_entries (+recipient_id), notifications, songs, song_sections, events, setlists, setlist_items, event_prayers, event_feedback, ministry_reflections

## Migrations
001_foundation, 002_prayer_gratitude, 003_worship, 004_bible_favorites, 005_bible_chin (applied), 006_notifications_and_versions (pending push)
