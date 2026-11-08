# Specification: Couple Worship App

## 1. Project Overview
A private, two-user Progressive Web App (PWA) for a Christian couple. The primary user is a worship leader at her church. The app serves four main purposes:
1. Personal and shared Bible study in Myanmar and English
2. Personal and partner-visible prayer and gratitude journaling
3. Worship service planning (events, songs, setlists, arrangements)
4. Shared reflection and encouragement between the two partners

This is NOT a public church management app. It is designed for exactly two authenticated users who are linked as partners.

## 2. Tech Stack (fixed)
- Next.js 15 (App Router), TypeScript (strict mode), Tailwind CSS
- Supabase (PostgreSQL, Auth, Storage) using `@supabase/ssr`
- Supabase CLI for all database migrations (`supabase/migrations`)
- PWA: manifest + service worker
- Deployment target: Vercel
- Required libraries: `@dnd-kit/core`, `@dnd-kit/sortable`, `@react-pdf/renderer`, `date-fns`
- No other libraries should be added without asking the user first

## 3. Users & Authentication
- Exactly two accounts exist, pre-created manually by the owner in Supabase Auth
- Public signup must be disabled in Supabase Auth settings
- Each user has a `profile` row (auto-created on first login if missing)
- The two users are linked via a `partners` table (single row linking user_a and user_b)
- On first login, if the user is not yet linked, they should see a simple "Partner not linked yet" state
- No magic link, no OAuth — email/password only

## 4. Data Model Requirements

Cursor must design and write all migrations. The following tables and their relationships are required. All tables must have RLS enabled.

### Core
- `profiles` — id (uuid, references auth.users), display_name, avatar_url, preferred_language ('mm'|'en'), created_at
- `partners` — id, user_a (uuid), user_b (uuid), linked_at. Exactly one row.

### Bible
- `bible_books` — id, name_mm, name_en, abbreviation, testament ('OT'|'NT'), book_order (int)
- `bible_verses` — id, book_id, chapter, verse, text_mm, text_en. Unique on (book_id, chapter, verse). Indexed on (book_id, chapter).
- `bible_study_sessions` — id, user_id, book_id, chapter, verses_read (int), completed (bool), session_date, created_at
- `bible_study_notes` — id, user_id, book_id, chapter, verse_start, verse_end, reflection, is_shared (bool, default false), created_at

### Prayer & Gratitude
- `prayers` — id, user_id, title, content, status ('pending'|'answered'), answered_at, testimony, is_shared (bool default true), created_at
- `prayer_interactions` — id, prayer_id, user_id, interaction_type ('prayed_for'|'encouraged'), note, created_at
- `gratitude_entries` — id, user_id, content, entry_date, is_shared (bool default false), created_at

### Worship
- `songs` — id, user_id (creator), title_mm, title_en, author, default_key, tempo ('slow'|'medium'|'fast'), bpm (int), tags (text[]), last_sung_date, times_sung (int default 0), created_at, updated_at
- `song_sections` — id, song_id, section_type ('intro'|'verse'|'chorus'|'bridge'|'outro'), section_order (int), label (e.g. "Verse 1"), lyrics_mm, lyrics_en, notes, bpm_override, key_override
- `events` — id, user_id (creator), event_date, event_name, event_type ('sunday'|'saturday'|'wednesday'|'custom'), role ('leader'|'backup'|'participant'), notes, created_at
- `setlists` — id, event_id, user_id, created_at, updated_at
- `setlist_items` — id, setlist_id, song_id, position (int), key_override, transition_note
- `event_prayers` — id, event_id, from_user_id, note, created_at  (partner-written prayers for an event)
- `event_feedback` — id, event_id, from_user_id, to_user_id, note, created_at  (partner feedback after event)
- `ministry_reflections` — id, event_id, user_id, post_service_reflection, serving_gratitude, created_at

### Tracking
- All streak and calendar data must be derived from existing tables (bible_study_sessions, prayers, gratitude_entries, events). No dedicated streak table unless performance requires it.

### RLS Rules (mandatory)
- `profiles`, `partners`: both users can read both rows
- `bible_*`: both users can read books and verses (public read); notes/sessions are readable by the owner, and by partner only if `is_shared = true`
- `prayers`, `gratitude_entries`: readable by owner; partner can read only if `is_shared = true`. Partner can insert into `prayer_interactions` for any shared prayer.
- `songs`, `song_sections`: both users can read and write (shared library)
- `events`, `setlists`, `setlist_items`: both users can read and write (both users are allowed to create and edit each other's setlists)
- `event_prayers`, `event_feedback`: both users can read; the `from_user_id` can write
- `ministry_reflections`: readable by owner only, unless explicitly shared (default owner-only)

## 5. Feature Requirements

### 5.1 Bible Study
- Bilingual reader: Myanmar and English side-by-side (toggle: side-by-side, MM-only, EN-only)
- Book/chapter navigation with dropdowns
- Verse-level tap to select range, then "Save Note"
- Search: by reference (e.g. "John 3") and by free text (search in both text_mm and text_en)
- "Mark chapter as read" creates a `bible_study_sessions` row
- Streak view (gentle: shows current streak and best streak, no penalties for missed days)
- Calendar view of reading sessions
- Partner progress visible (which chapters partner has read)
- Partner notes visible only if `is_shared = true`

### 5.2 Prayer
- List view with filters: all / pending / answered / shared / private
- Add prayer: title, content, shared toggle
- Mark as answered: opens modal to add answered_at date and testimony
- Partner can press "I prayed for this" on any shared prayer (creates `prayer_interactions` row); partner can also add an encouragement note
- Private prayer journal: separate view showing only owner's private prayers, with the same features
- PWA notification: daily reminder time configurable per user
- When partner prays for you, you receive a notification

### 5.3 Gratitude
- Daily entry (multiple per day allowed)
- Private by default, with optional share toggle
- List + calendar + search
- Monthly summary view (auto-aggregated)

### 5.4 Worship / Music
- **Events**: create/edit/delete. Fields: date, name, type (sunday/saturday/wednesday/custom), role (leader/backup/participant). List + calendar views.
- **Song Library**: searchable list with filters (language, key, tags, last sung). Add/edit/delete songs. Manual entry form for all fields including per-section lyrics and notes.
- **Setlist Planner** (main feature): per event, drag-and-drop ordered list of songs. Each item can have a `key_override` and `transition_note`. Add songs via searchable modal from library. Preview mode shows continuous lyrics (with per-section notes) for all songs in order for rehearsal.
- **Music arrangement**: on each setlist item, user can adjust key, per-section bpm, and notes. Continuous scroll view for practice.
- **Post-service**: after an event, owner can write `ministry_reflections` (post-service reflection, ministry gratitude). Partner can add `event_feedback`.
- **Partner event prayer**: partner can write `event_prayers` on any event; owner sees these on the event page.
- **PDF Export**: per event, produce a professional PDF with event info (date, name, role), each song in order with key, per-section lyrics (MM and EN), per-section notes, and transition notes. Uses `@react-pdf/renderer`. This PDF must be handed to the band — it must look polished.
- **Attribution**: every setlist item and event shows who last edited it and when.
- **History**: all events and setlists are retained and searchable, filterable by date, type, song, or role.

### 5.5 Tracking
- Streaks for bible reading, prayer, gratitude (all gentle, no negative messaging)
- Dashboard showing: current streaks, answered prayers count, gratitude count, upcoming events
- Partner dashboard view: partner's streak, partner's recent notes (if shared)
- Global search across notes, prayers, gratitude, songs, events
- Calendar view that aggregates all activity

## 6. UI/UX Requirements
- **Mobile-first**: optimized for iPhone 13 (390×844). Laptop layout should be functional but not over-engineered.
- **Bottom navigation** on mobile: Home, Bible, Prayer, Worship
- **Sidebar navigation** on desktop
- **Language toggle** for entire UI (Myanmar / English). All UI strings must go through an i18n helper. Store preference in `profiles.preferred_language`.
- **Font**: Noto Sans Myanmar for Myanmar text. Ensure it is loaded.
- **Design tone**: calm, peaceful, minimal. No aggressive notification language. No "You missed a day!" messaging. Streaks should feel like a gift, not a chore.
- **Color**: soft neutrals, one accent color. Support dark mode as a stretch goal (not required for v1).
- **Accessibility**: text sizes readable on small screens, tap targets ≥ 44px.

## 7. Non-Functional Requirements
- **PWA**: installable on iOS and Android. Custom manifest with app name "Grace" (or the owner will decide later). Service worker caches the app shell and the last-read bible chapter.
- **Offline**: reading a chapter caches it. Notes, prayers, gratitude, songs, and setlists are viewable offline; writes queue and sync when online (use Supabase realtime subscription to reconcile).
- **Notifications**: PWA notifications for prayer reminders, partner prayers, partner feedback. Permission requested only after user configures reminder.
- **Performance**: Bible chapter load < 500ms on 4G. Dashboard load < 1s.
- **Security**: RLS on every table. No service-role key in the client. No plaintext sensitive data.
- **Data seeding**: Write `scripts/seed-bible.ts` (Node script) that:
  - Loads Myanmar bible data from the Hugging Face dataset `freococo/jw_myanmar_bible_dataset` (JSON or CSV)
  - Loads English bible data (recommend World English Bible, public domain, from `bible.helloao.org` or similar)
  - Inserts into `bible_books` and `bible_verses`
  - Provides clear instructions in README on how to run it
  - This script is run once by the owner, not by Cursor

## 8. File Structure
- `/app` — pages (App Router)
- `/components` — reusable UI
- `/lib/supabase` — client, server, middleware helpers
- `/lib/i18n` — language strings and helper
- `/lib/pdf` — PDF templates
- `/types` — TypeScript types
- `/supabase/migrations` — SQL migrations (managed by Supabase CLI)
- `/scripts` — one-off scripts (seed, export)
- `/public` — manifest, icons, fonts

## 9. Development Workflow Constraints
- All database changes MUST be via `supabase migration new <name>` and `supabase db push`. Never run raw SQL against the remote database directly.
- Every migration must be reviewed by the owner before `db push` is run (print the migration contents and ask for confirmation).
- TypeScript strict mode on. No `any` without a comment explaining why.
- No packages beyond the list in section 2 without owner approval.
- Commits after each completed feature with a clear message.

## 10. Acceptance Criteria (v1)
- Both users can log in with email/password; signup is disabled
- Bible reader shows MM and EN side-by-side; search works
- Notes, prayers, gratitude save and respect RLS (private vs shared)
- Partner can mark "I prayed for this" and leave an encouragement note
- Answered prayers can have date + testimony
- Song library CRUD works with per-section lyrics and notes
- Events can be created with role; setlists can be built with drag-drop
- Setlist preview shows continuous lyrics
- PDF export produces a professional, band-ready PDF
- Partner can add event prayers and feedback
- Streaks and calendar views show activity
- UI language toggle works for both MM and EN
- App is installable as PWA and reads bible chapters offline
- Deployed on Vercel with working Supabase connection

## 11. Out of Scope
- Public signup, social features, third-party sharing
- Church-wide management, multi-team features
- Payment, subscriptions
- Native iOS/Android apps
- Song audio playback or metronome