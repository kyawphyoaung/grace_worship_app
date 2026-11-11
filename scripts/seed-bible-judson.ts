/**
 * One-off seed: Judson Burmese Bible → bible_verses.text_mm
 *
 * Run yourself (Cursor will not run this):
 *   npm run seed:bible:judson
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Reads data/judson_bible.json (local). Does NOT wipe EN/Chin/KJV.
 * Updates text_mm only.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

type JudsonVerse = { verse: number; text: string };
type JudsonChapter = { chapter: number; verses: JudsonVerse[] };
type JudsonBook = { name: string; chapters: JudsonChapter[] };
type JudsonBible = {
  translation?: string;
  books: JudsonBook[];
};

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

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  const jsonPath = resolve(process.cwd(), "data/judson_bible.json");
  if (!existsSync(jsonPath)) {
    throw new Error(`Missing Judson data file: ${jsonPath}`);
  }

  console.log("Loading Judson Burmese Bible from data/judson_bible.json…");
  const judson = JSON.parse(readFileSync(jsonPath, "utf8")) as JudsonBible;
  const books = judson.books ?? [];
  if (books.length !== 66) {
    console.warn(
      `Expected 66 books, found ${books.length}. Matching by book_order index (1-based).`,
    );
  }
  console.log(
    `Translation: ${judson.translation ?? "unknown"} · books: ${books.length}`,
  );

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: dbBooks, error: booksError } = await supabase
    .from("bible_books")
    .select("id, book_order, name_en, abbreviation")
    .order("book_order");
  if (booksError) throw booksError;
  if (!dbBooks?.length) {
    throw new Error("No bible_books found. Run npm run seed:bible first.");
  }

  const bookIdByOrder = new Map(dbBooks.map((b) => [b.book_order, b.id]));
  let updated = 0;
  let missing = 0;
  const batchSize = 200;

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    const bookOrder = i + 1;
    const bookId = bookIdByOrder.get(bookOrder);
    if (!bookId) {
      console.warn(
        `No DB book for order ${bookOrder} (${book.name}) — skipping`,
      );
      continue;
    }

    const rows: { chapter: number; verse: number; text_mm: string }[] = [];
    for (const chapter of book.chapters) {
      for (const v of chapter.verses) {
        const text = (v.text ?? "").trim();
        if (!text) continue;
        rows.push({
          chapter: chapter.chapter,
          verse: v.verse,
          text_mm: text,
        });
      }
    }

    console.log(
      `\n[${bookOrder}/66] ${book.name} → book_order ${bookOrder} (${rows.length} verses)`,
    );

    for (let offset = 0; offset < rows.length; offset += batchSize) {
      const chunk = rows.slice(offset, offset + batchSize);
      await Promise.all(
        chunk.map(async (row) => {
          const { data, error } = await supabase
            .from("bible_verses")
            .update({ text_mm: row.text_mm })
            .eq("book_id", bookId)
            .eq("chapter", row.chapter)
            .eq("verse", row.verse)
            .select("id");
          if (error) {
            throw new Error(
              `Update failed ${book.name} ${row.chapter}:${row.verse}: ${error.message}`,
            );
          }
          if (!data?.length) missing += 1;
          else updated += 1;
        }),
      );
      process.stdout.write(
        `\r  ${book.name}: ${Math.min(offset + chunk.length, rows.length)}/${rows.length} · total updated ${updated}`,
      );
    }
  }

  console.log(
    `\n\nDone. Updated text_mm on ${updated} verses (${missing} refs missing in DB).`,
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
