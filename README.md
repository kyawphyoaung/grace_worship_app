# Grace

Private two-user PWA for shared Bible study, prayer, gratitude, and worship planning.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Auth, Postgres, RLS)
- Deploy target: Vercel

## Local setup

1. Copy env vars into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-or-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` is only for one-off scripts (never ship it to the client).

2. Install and run:

```bash
npm install
npm run dev
```

3. Ensure both users exist in Supabase Auth (email/password; public signup disabled) and that a single `partners` row links them (`user_a` < `user_b`).

## Seed Bible data

Do **not** expect Cursor to run this. Run it yourself once after migrations are applied.

```bash
npx tsx scripts/seed-bible.ts
```

What it does:

- Downloads Myanmar verses from Hugging Face [`freococo/jw_myanmar_bible_dataset`](https://huggingface.co/datasets/freococo/jw_myanmar_bible_dataset) (`jw_myanmar_bible_dataset.csv`)
- Downloads English World English Bible (public domain) from [`bible.helloao.org`](https://bible.helloao.org) (`ENGWEBP/complete.simple.json`)
- Clears and re-inserts `bible_books` and `bible_verses`, aligning the 66 books by canonical order

Requirements:

- Network access
- `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` available (from `.env.local` or the shell)

Re-running the script replaces existing Bible rows. Notes and study sessions that reference books will break if book IDs change — seed before heavy use, or accept a reset.

## Seed KJV Bible data

KJV is optional and separate from the MM/EN seed. Migration `006_notifications_and_versions` must be applied first.

```bash
npm run seed:bible:kjv
```

Downloads the public-domain King James Version from [`bible.helloao.org`](https://bible.helloao.org) (`eng_kjv`) and updates `bible_verses.text_kjv` only (does not wipe MM/EN/Chin).

## Seed Chin Bible data

Chin (Tedim / Zomi) is optional and separate from the MM/EN seed. Migration `005_bible_chin` must be applied first.

1. Place the complete Tedim Bible at `data/chin/tedim_bible.txt` (one verse per line, OT→NT canonical order).
2. Run:

```bash
npm run seed:bible:chin
```

This updates `bible_verses.text_chin` (and a few `bible_books.name_chin` labels). It does **not** wipe MM/EN.

Override path with `CHIN_BIBLE_PATH` if needed. Requires `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.

**Note:** The Tedim file has ~30,715 verses vs ~31,105 in the DB (no `GEN 1:1` prefixes — plain verse-per-line). The script maps via USFM book codes using known book-start anchors (GEN, EXO, MAT, MRK, …). GEN/EXO match exactly; soft stretches share remaining lines proportionally. Unmapped DB verses stay null and fall back to MM in the reader.

If your file uses explicit refs instead (`GEN 1:1 …` or `GEN|1|1|…`), the script detects that format automatically.

## App notes

- Warm peaceful dark theme is the default.
- UI language toggle (EN / MM) is stored on `profiles.preferred_language`.
- Bible versions (MM / EN / Chin / KJV, multi-select) are stored on `profiles.preferred_bible_languages`.
- Prayer reminder time is stored on `profiles.prayer_reminder_time`; in-app notifications are live (bell in the top bar).
