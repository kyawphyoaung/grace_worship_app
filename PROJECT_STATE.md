# Project State — Grace

## Completed phases
- Phase 1 (f56614b) — Foundation, auth, migrations 001–003
- Phase 2 (c1d6c00) — Bible, Prayer, Gratitude, dark theme
- Phase 2.5 (1d7f3c5) — iOS pickers, Home, Bible favorites, partner UI, migration 004
- Phase 2.5 fixes (986cd8c) — smoke test issues 1–9; migration 005 applied
- Phase 2.6 (d84de75) — KJV versions, sharing RLS fix, notifications, warm UI (migration 006)
- Phase 2.7 (8e108c2) — Facebook-style feed, settings page, colorful UI, bible layout (migration 007)
- Phase 2.8 — Feed filters, mobile notification popup, love/comment rules, bible tab split (migration 008)
- Phase 3 — Worship library, events, setlists, rehearsal preview, PDF export
- Phase 3.1 — Chord transpose, PDF Myanmar font, worship UI overhaul (migration 009)
- Phase 3.2 — HTML print export, event feed notifications, home upcoming events, feed deletions (migration 010)
- Phase 3.3 — PDF print polish, song preview + YouTube, avatars, monthsary fix, notifications settings/presence/invite (migration 011)
- Phase 4 — PWA (manifest, service worker, offline fallback, install prompt)
- Phase 4.1 — Server Actions (DNS bypass), safe-area/dvh, loading skeletons, song preview page, Judson MM seed

## Next up
- Apply migrations 008–011 (`supabase db push`) after owner review if not yet applied
- Replace placeholder `public/icons/icon-*.png` with final brand icons
- Run `npm run seed:bible:judson` after migrations (updates `bible_verses.text_mm`)
- Deploy

## PWA / network notes
- Browser Supabase client disabled — all auth/data via `lib/actions/*` + `@supabase/ssr` server cookies (avoids ISP `*.supabase.co` DNS block)
- Notifications poll every 20s (no realtime channel to supabase.co)

## Locked decisions
- App name: Grace · Vibrant peaceful dark (deep indigo/plum, teal primary, coral accent)
- Font: Noto Sans Myanmar · Anniversary: 2026-10-14 in lib/config.ts
- Partners: Harry + Ruth Hoih — always use `profiles.display_name` (no UUID→name map)
- Top bar: notification bell + avatar menu (Settings / Log out). No couple pill / language toggle in header.
- Settings page (`/settings`): UI language + display name + prayer reminder
- Prayer tab: unified social feed (prayer + gratitude) with love + comments
- Worship: Events are the main view; Song Library opens from music-note header button
- Worship charts: browser print route `/worship/[eventId]/print` (not @react-pdf/renderer)
- Partner Prayer on events: only the non-owner partner can create
- Login-only auth; signup disabled
- Migrations: supabase migration new + db push only
- Packages allowed: @dnd-kit/core, @dnd-kit/sortable, @react-pdf/renderer, date-fns
- TypeScript strict, no `any`
- Single toast, 2.5s auto-dismiss
- Bible reader versions: multi-select MM / EN / Chin / KJV via `profiles.preferred_bible_languages`

## Commands
npm run dev · npm run seed:bible · npm run seed:bible:chin · npm run seed:bible:kjv · supabase migration new \<n\> · supabase db push · supabase gen types typescript

## Tables
profiles (+preferred_bible_languages), partners, bible_books (+name_chin), bible_verses (+text_chin, +text_kjv), bible_study_sessions, bible_study_notes, bible_favorites, prayers (+recipient_id), prayer_interactions, gratitude_entries (+recipient_id), notifications, feed_reactions, feed_comments, songs (+time_signature, +youtube_url), song_sections (+pre_chorus), events, setlists, setlist_items, event_prayers, event_feedback, ministry_reflections

## Migrations
001–007 applied · 008–011 pending push after review
(008 feed interactions · 009 worship pre_chorus/time_signature · 010 event feed notifications · 011 youtube_url + presence/bible invite notifications)
