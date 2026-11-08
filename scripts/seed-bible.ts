/**
 * One-off seed: Myanmar (HF) + English WEB → bible_books / bible_verses.
 *
 * Run yourself (Cursor will not run this):
 *   npx tsx scripts/seed-bible.ts
 *
 * Requires in .env.local (or environment):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (service role — never expose to the client)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

type WebBook = {
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

type MmRow = {
  book: string;
  chapter: number;
  verse: number;
  verse_text: string;
};

const MM_CSV_URL =
  "https://huggingface.co/datasets/freococo/jw_myanmar_bible_dataset/resolve/main/jw_myanmar_bible_dataset.csv";
const WEB_URL = "https://bible.helloao.org/api/ENGWEBP/complete.simple.json";

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

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    if (ch === "\r") continue;
    field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

function extractWebVerses(book: WebBook): Map<string, string> {
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

  console.log("Downloading Myanmar CSV…");
  const mmCsv = await fetchText(MM_CSV_URL);
  const mmRowsRaw = parseCsv(mmCsv);
  const header = mmRowsRaw[0]?.map((h) => h.trim().toLowerCase()) ?? [];
  const bookIdx = header.indexOf("book");
  const chapterIdx = header.indexOf("chapter");
  const verseIdx = header.indexOf("verse");
  const textIdx = header.findIndex(
    (h) => h === "verse_text" || h === "text" || h === "text_mm",
  );
  if (bookIdx < 0 || chapterIdx < 0 || verseIdx < 0 || textIdx < 0) {
    throw new Error(`Unexpected CSV header: ${header.join(", ")}`);
  }

  const mmRows: MmRow[] = [];
  for (const cols of mmRowsRaw.slice(1)) {
    if (cols.length < 4) continue;
    const book = cols[bookIdx]?.trim();
    const chapter = Number(cols[chapterIdx]);
    const verse = Number(cols[verseIdx]);
    const verse_text = cols[textIdx]?.trim() ?? "";
    if (!book || !Number.isFinite(chapter) || !Number.isFinite(verse)) continue;
    mmRows.push({ book, chapter, verse, verse_text });
  }

  const mmBookNames: string[] = [];
  const seen = new Set<string>();
  for (const row of mmRows) {
    if (!seen.has(row.book)) {
      seen.add(row.book);
      mmBookNames.push(row.book);
    }
  }

  console.log(`Myanmar rows: ${mmRows.length}, books: ${mmBookNames.length}`);

  console.log("Downloading World English Bible (WEB)…");
  const webJson = JSON.parse(await fetchText(WEB_URL)) as {
    books: WebBook[];
  };
  const webBooks = [...webJson.books].sort((a, b) => a.order - b.order);
  if (webBooks.length !== 66) {
    console.warn(`Expected 66 WEB books, got ${webBooks.length}`);
  }
  if (mmBookNames.length !== webBooks.length) {
    console.warn(
      `Book count mismatch MM=${mmBookNames.length} EN=${webBooks.length}. Aligning by index.`,
    );
  }

  const bookCount = Math.min(mmBookNames.length, webBooks.length);

  console.log("Clearing existing bible_verses / bible_books…");
  // Delete verses first (FK), then books. Service role bypasses RLS.
  const { error: delVersesError } = await supabase
    .from("bible_verses")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (delVersesError) throw delVersesError;
  const { error: delBooksError } = await supabase
    .from("bible_books")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (delBooksError) throw delBooksError;

  const bookIdByOrder = new Map<number, string>();

  console.log("Inserting books…");
  for (let i = 0; i < bookCount; i++) {
    const web = webBooks[i];
    const nameMm = mmBookNames[i];
    const testament = web.order <= 39 ? "OT" : "NT";
    const { data, error } = await supabase
      .from("bible_books")
      .insert({
        name_mm: nameMm,
        name_en: web.commonName || web.name,
        abbreviation: web.id,
        testament,
        book_order: web.order,
      })
      .select("id, book_order")
      .single();
    if (error) throw error;
    bookIdByOrder.set(data.book_order, data.id);
  }

  const mmByBook = new Map<string, MmRow[]>();
  for (const row of mmRows) {
    const list = mmByBook.get(row.book) ?? [];
    list.push(row);
    mmByBook.set(row.book, list);
  }

  console.log("Inserting verses (batched)…");
  let inserted = 0;
  const batchSize = 500;

  for (let i = 0; i < bookCount; i++) {
    const web = webBooks[i];
    const nameMm = mmBookNames[i];
    const bookId = bookIdByOrder.get(web.order);
    if (!bookId) continue;

    const enMap = extractWebVerses(web);
    const mmList = mmByBook.get(nameMm) ?? [];
    const keySet = new Set<string>();

    const versePayload: {
      book_id: string;
      chapter: number;
      verse: number;
      text_mm: string;
      text_en: string;
    }[] = [];

    for (const row of mmList) {
      const key = `${row.chapter}:${row.verse}`;
      keySet.add(key);
      versePayload.push({
        book_id: bookId,
        chapter: row.chapter,
        verse: row.verse,
        text_mm: row.verse_text || "",
        text_en: enMap.get(key) ?? "",
      });
    }

    for (const [key, textEn] of enMap) {
      if (keySet.has(key)) continue;
      const [chapterStr, verseStr] = key.split(":");
      versePayload.push({
        book_id: bookId,
        chapter: Number(chapterStr),
        verse: Number(verseStr),
        text_mm: "",
        text_en: textEn,
      });
    }

    for (let offset = 0; offset < versePayload.length; offset += batchSize) {
      const chunk = versePayload.slice(offset, offset + batchSize);
      const { error } = await supabase.from("bible_verses").insert(chunk);
      if (error) {
        throw new Error(
          `Insert failed for ${web.id} offset ${offset}: ${error.message}`,
        );
      }
      inserted += chunk.length;
      process.stdout.write(`\r  ${web.id}: ${inserted} verses…`);
    }
  }

  console.log(`\nDone. Inserted ${bookCount} books and ${inserted} verses.`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
