# Project State — Grace

## Completed phases
- Phase 1 (f56614b) — Foundation, auth, migrations 001–003
- Phase 2 (c1d6c00) — Bible, Prayer, Gratitude, dark theme
- Phase 2.5 (1d7f3c5) — iOS pickers, Home, Bible favorites, partner UI, migration 004
- Phase 2.5 fixes (986cd8c) — smoke test issues 1–9; migration 005 applied

## Next up
- Optionally run `npm run seed:bible:chin` once Chin source is confirmed
- Phase 3 — Worship (songs, events, setlists, PDF, post-service)
- Phase 4 — Tracking, PWA, notifications, deploy

## Locked decisions
- App name: Grace · Dark theme default (charcoal #0f1115–#15181d, teal/sage)
- Font: Noto Sans Myanmar · Anniversary: 2026-10-14 in lib/config.ts
- Partners: Harry (a029c171-657d-4260-8d3f-5842e02ac67a), Ruth Hoih (0007f7ae-ec50-4c17-a035-59e8f219ca93)
- Always use display_name; never hardcode "Partner"/"အဖော်"
- Login-only auth; signup disabled
- Migrations: supabase migration new + db push only
- Packages allowed: @dnd-kit/core, @dnd-kit/sortable, @react-pdf/renderer, date-fns
- TypeScript strict, no `any`
- Single toast, 2.5s auto-dismiss
- Bible reader languages: MM / EN / Chin (no Both). Chin falls back to MM until seeded.

## Commands
npm run dev · npm run seed:bible · npm run seed:bible:chin · supabase migration new <n> · supabase db push · supabase gen types typescript

## Tables
profiles, partners, bible_books (+name_chin), bible_verses (+text_chin), bible_study_sessions, bible_study_notes, bible_favorites, prayers, prayer_interactions, gratitude_entries, songs, song_sections, events, setlists, setlist_items, event_prayers, event_feedback, ministry_reflections

## Migrations
001_foundation, 002_prayer_gratitude, 003_worship, 004_bible_favorites, 005_bible_chin (all applied)
