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

## Seed Chin Bible data

Chin (Tedim / Zomi) is optional and separate from the MM/EN seed. Apply migration `005_bible_chin` first (`supabase db push`), then run:

```bash
npm run seed:bible:chin
```

This updates `bible_books.name_chin` and `bible_verses.text_chin` only — it does **not** wipe MM/EN.

### Candidate sources (confirm license before use)

1. **eBible.org — Chin Tedim (ctd)** — recommended starting point for open texts  
   https://ebible.org (search “Chin Tedim” / fileset `ctd`)
2. **bible.com / YouVersion — Zomi Bible** — confirm redistribution rights before bulk download

### How to supply data

- Place a JSON file at `data/chin-bible.json`, **or**
- Set `CHIN_BIBLE_URL` to a JSON endpoint, **or**
- Set `CHIN_BIBLE_PATH` to another local path

Expected JSON shape:

```json
{
  "books": [
    {
      "order": 1,
      "name": "Piancilna",
      "abbreviation": "GEN",
      "chapters": [
        { "chapter": 1, "verses": [{ "verse": 1, "text": "…" }] }
      ]
    }
  ]
}
```

Books match existing rows by `order` (preferred) or `abbreviation`. Until Chin text is seeded, the reader falls back to Myanmar with a small “MM” badge.

## App notes

- Dark theme is the default.
- UI language toggle (EN / MM) is stored on `profiles.preferred_language`.
- Prayer reminder time is stored on `profiles.prayer_reminder_time`; push notifications come in a later phase.
