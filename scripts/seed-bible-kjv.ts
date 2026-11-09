/**
 * One-off seed: public-domain KJV → bible_verses.text_kjv
 *
 * Run yourself (Cursor will not run this):
 *   npm run seed:bible:kjv
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Does NOT wipe MM/EN/Chin. Updates text_kjv only.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

type KjvBook = {
  id: string;
  name: string;
  commonName: string;
  shortName: string;
  order: number;
  chapters: {
    chapter: {
      number: number;
      content: Array<
        | { type: "verse"; number: number; text: string }
        | { type: string }
      >;
    };
  }[];
};

const KJV_URL = "https://bible.helloao.org/api/eng_kjv/complete.simple.json";

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

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

function extractVerses(book: KjvBook): Map<string, string> {
  const map = new Map<string, string>();
  for (const chapterWrap of book.chapters) {
    const chapter = chapterWrap.chapter;
    for (const item of chapter.content) {
      if (item.type !== "verse") continue;
      const verse = item as { type: "verse"; number: number; text: string };
      map.set(`${chapter.number}:${verse.number}`, verse.text);
    }
  }
  return map;
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

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("Downloading King James Version (public domain)…");
  const kjvJson = JSON.parse(await fetchText(KJV_URL)) as {
    books: KjvBook[];
  };
  const kjvBooks = [...kjvJson.books].sort((a, b) => a.order - b.order);
  console.log(`KJV books: ${kjvBooks.length}`);

  const { data: dbBooks, error: booksError } = await supabase
    .from("bible_books")
    .select("id, book_order, abbreviation")
    .order("book_order");
  if (booksError) throw booksError;
  if (!dbBooks?.length) {
    throw new Error("No bible_books found. Run npm run seed:bible first.");
  }

  const bookIdByOrder = new Map(dbBooks.map((b) => [b.book_order, b.id]));
  let updated = 0;
  let missing = 0;
  const batchSize = 200;

  for (const book of kjvBooks) {
    const bookId = bookIdByOrder.get(book.order);
    if (!bookId) {
      console.warn(`No DB book for KJV order ${book.order} (${book.id})`);
      continue;
    }

    const verseMap = extractVerses(book);
    const rows: { chapter: number; verse: number; text_kjv: string }[] = [];
    for (const [key, text] of verseMap) {
      const [chapterStr, verseStr] = key.split(":");
      rows.push({
        chapter: Number(chapterStr),
        verse: Number(verseStr),
        text_kjv: text,
      });
    }

    for (let offset = 0; offset < rows.length; offset += batchSize) {
      const chunk = rows.slice(offset, offset + batchSize);
      await Promise.all(
        chunk.map(async (row) => {
          const { data, error } = await supabase
            .from("bible_verses")
            .update({ text_kjv: row.text_kjv })
            .eq("book_id", bookId)
            .eq("chapter", row.chapter)
            .eq("verse", row.verse)
            .select("id");
          if (error) {
            throw new Error(
              `Update failed ${book.id} ${row.chapter}:${row.verse}: ${error.message}`,
            );
          }
          if (!data?.length) missing += 1;
          else updated += 1;
        }),
      );
      process.stdout.write(`\r  ${book.id}: ${updated} updated…`);
    }
  }

  console.log(
    `\nDone. Updated text_kjv on ${updated} verses (${missing} refs missing in DB).`,
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
