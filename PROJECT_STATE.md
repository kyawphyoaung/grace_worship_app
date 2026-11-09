# Project State — Grace

## Completed phases
- Phase 1 (f56614b) — Foundation, auth, migrations 001–003
- Phase 2 (c1d6c00) — Bible, Prayer, Gratitude, dark theme
- Phase 2.5 (1d7f3c5) — iOS pickers, Home, Bible favorites, partner UI, migration 004
  → Smoke test found 8 UI issues, NOT YET FIXED. See PHASE_2.5_FIXES.md

## Next up
- Phase 2.5 fixes (see PHASE_2.5_FIXES.md + PHASE_2.5_FIX_PROMPT.txt)
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

## Commands
npm run dev · npm run seed:bible · supabase migration new <n> · supabase db push · supabase gen types typescript

## Tables
profiles, partners, bible_books, bible_verses, bible_study_sessions, bible_study_notes, bible_favorites, prayers, prayer_interactions, gratitude_entries, songs, song_sections, events, setlists, setlist_items, event_prayers, event_feedback, ministry_reflections

## Migrations
001_foundation, 002_prayer_gratitude, 003_worship, 004_bible_favorites (all applied)