/**
 * One-off seed: Chin (Tedim / Zomi) → bible_verses.text_chin + bible_books.name_chin.
 *
 * Does NOT clear existing MM/EN data. Updates Chin columns only.
 *
 * Run yourself after confirming a source and applying migration 005:
 *   npm run seed:bible:chin
 *
 * Data source (pick one, then set CHIN_BIBLE_URL or place a local file):
 *   - eBible.org Chin Tedim (ctd) — public domain / open license texts
 *     https://ebible.org / https://ebible.org/Scriptures/fileset.php?id=ctd
 *   - Bible.com / YouVersion Zomi Bible (confirm license before bulk use)
 *   - Local JSON at data/chin-bible.json (see format below)
 *
 * Env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   CHIN_BIBLE_URL   optional remote JSON URL
 *   CHIN_BIBLE_PATH  optional local path (default: data/chin-bible.json)
 *
 * Expected JSON shape:
 * {
 *   "books": [
 *     {
 *       "order": 1,
 *       "name": "Piancilna",
 *       "abbreviation": "GEN",
 *       "chapters": [
 *         { "chapter": 1, "verses": [{ "verse": 1, "text": "..." }] }
 *       ]
 *     }
 *   ]
 * }
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type ChinVerse = { verse: number; text: string };
type ChinChapter = { chapter: number; verses: ChinVerse[] };
type ChinBook = {
  order: number;
  name: string;
  abbreviation?: string;
  chapters: ChinChapter[];
};
type ChinPayload = { books: ChinBook[] };

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

async function loadPayload(): Promise<ChinPayload> {
  const url = process.env.CHIN_BIBLE_URL?.trim();
  if (url) {
    console.log(`Fetching Chin Bible from ${url}…`);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as ChinPayload;
  }

  const localPath = resolve(
    process.cwd(),
    process.env.CHIN_BIBLE_PATH?.trim() || "data/chin-bible.json",
  );
  if (!existsSync(localPath)) {
    throw new Error(
      [
        "No Chin Bible data found.",
        "",
        "Provide one of:",
        `  1) Local file at ${localPath}`,
        "  2) CHIN_BIBLE_URL pointing to a JSON payload",
        "",
        "Candidate sources:",
        "  - eBible.org Chin Tedim (ctd)",
        "  - bible.com Zomi Bible (confirm license)",
        "",
        "See README → Seed Chin Bible data.",
      ].join("\n"),
    );
  }

  console.log(`Reading Chin Bible from ${localPath}…`);
  return JSON.parse(readFileSync(localPath, "utf8")) as ChinPayload;
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  const payload = await loadPayload();
  if (!payload.books?.length) {
    throw new Error("Chin payload has no books[]");
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: books, error: booksError } = await supabase
    .from("bible_books")
    .select("id, book_order, abbreviation, name_en")
    .order("book_order");
  if (booksError) throw booksError;
  if (!books?.length) {
    throw new Error("No bible_books found. Run npm run seed:bible first.");
  }

  const byOrder = new Map(books.map((b) => [b.book_order, b]));
  const byAbbr = new Map(
    books.map((b) => [b.abbreviation.toUpperCase(), b]),
  );

  let updatedNames = 0;
  let updatedVerses = 0;

  for (const chinBook of payload.books) {
    const dbBook =
      byOrder.get(chinBook.order) ??
      (chinBook.abbreviation
        ? byAbbr.get(chinBook.abbreviation.toUpperCase())
        : undefined);

    if (!dbBook) {
      console.warn(
        `Skipping Chin book order=${chinBook.order} name=${chinBook.name} (no match)`,
      );
      continue;
    }

    if (chinBook.name?.trim()) {
      const { error } = await supabase
        .from("bible_books")
        .update({ name_chin: chinBook.name.trim() })
        .eq("id", dbBook.id);
      if (error) throw error;
      updatedNames += 1;
    }

    for (const ch of chinBook.chapters ?? []) {
      for (const v of ch.verses ?? []) {
        const text = v.text?.trim();
        if (!text) continue;
        const { error } = await supabase
          .from("bible_verses")
          .update({ text_chin: text })
          .eq("book_id", dbBook.id)
          .eq("chapter", ch.chapter)
          .eq("verse", v.verse);
        if (error) {
          throw new Error(
            `Update failed ${dbBook.name_en} ${ch.chapter}:${v.verse}: ${error.message}`,
          );
        }
        updatedVerses += 1;
      }
    }

    process.stdout.write(
      `\r  ${dbBook.abbreviation}: names=${updatedNames} verses≈${updatedVerses}…`,
    );
  }

  console.log(
    `\nDone. Updated name_chin on ${updatedNames} books and text_chin on ~${updatedVerses} verses.`,
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
