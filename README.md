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

## App notes

- Dark theme is the default.
- UI language toggle (EN / MM) is stored on `profiles.preferred_language`.
- Prayer reminder time is stored on `profiles.prayer_reminder_time`; push notifications come in a later phase.
