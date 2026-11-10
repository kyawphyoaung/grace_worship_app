/**
 * Seed Chin (Tedim/Zomi) text into bible_verses.text_chin.
 *
 * Source: data/chin/tedim_bible.txt (one verse per line, canonical order).
 * The file has no GEN/1:1 prefixes — lines are mapped onto USFM book codes
 * via known book-start anchors + sequential fill between anchors.
 *
 * Also accepts referenced lines if present:
 *   GEN 1:1 <text>
 *   GEN 01:01 <text>
 *   GEN|1|1|<text>
 *
 * Run:
 *   npm run seed:bible:chin
 *
 * Requires .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type DbBook = {
  id: string;
  abbreviation: string;
  book_order: number;
  name_en: string;
};

type DbVerse = {
  id: string;
  book_id: string;
  chapter: number;
  verse: number;
};

type ParsedRef = {
  abbreviation: string;
  chapter: number;
  verse: number;
  text: string;
};

/** 1-based line starts detected in tedim_bible.txt (Tedim CTD). */
const TEDIM_BOOK_STARTS: Partial<Record<string, number>> = {
  GEN: 1,
  EXO: 1534,
  MAT: 22823,
  MRK: 23891,
  LUK: 24568,
  JHN: 25717,
  ACT: 26589,
  ROM: 27577,
  "1CO": 28007,
  "2CO": 28442,
  GAL: 28699,
  EPH: 28846,
  PHP: 28992,
  COL: 29093,
  "1TH": 29186,
  "2TH": 29274,
  "1TI": 29320,
  "2TI": 29433,
  TIT: 29515,
  PHM: 29558,
  HEB: 29582,
  JAS: 29885,
  "1PE": 29992,
  "2PE": 30097,
  "1JN": 30158,
  "2JN": 30263,
  "3JN": 30276,
  JUD: 30291,
  REV: 30316,
};

/**
 * Books whose verse counts match the Tedim file exactly at known boundaries.
 * These take full DB counts before proportional fill of the remaining soft stretch.
 */
const EXACT_COUNT_BOOKS = new Set(["GEN", "EXO"]);

/** Optional Chin book titles (Tedim). */
const TEDIM_BOOK_NAMES: Partial<Record<string, string>> = {
  GEN: "Piancilna",
  EXO: "Paikhia",
  LEV: "Siampi",
  NUM: "Gamlak",
  DEU: "Thukham Helkik",
  MAT: "Mate",
  MRK: "Marka",
  LUK: "Luka",
  JHN: "Johan",
  ACT: "Sawltakte’ Nasepna",
  ROM: "Rom",
  REV: "Mangmuhna",
};

const DEFAULT_PATH = "data/chin/tedim_bible.txt";
const UPDATE_CONCURRENCY = 80;

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

function normalizeAbbr(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/** Parse a single line that already carries book/chapter/verse. */
function parseReferencedLine(line: string): ParsedRef | null {
  const pipe = line.match(
    /^([1-3]?[A-Za-z]{2,4})\|(\d+)\|(\d+)\|(.+)$/,
  );
  if (pipe) {
    return {
      abbreviation: normalizeAbbr(pipe[1]),
      chapter: Number(pipe[2]),
      verse: Number(pipe[3]),
      text: pipe[4].trim(),
    };
  }

  const spaced = line.match(
    /^([1-3]?[A-Za-z]{2,4})\s+(\d{1,3}):(\d{1,3})\s+(.+)$/,
  );
  if (spaced) {
    return {
      abbreviation: normalizeAbbr(spaced[1]),
      chapter: Number(spaced[2]),
      verse: Number(spaced[3]),
      text: spaced[4].trim(),
    };
  }

  return null;
}

function readChinLines(filePath: string): string[] {
  const raw = readFileSync(filePath, "utf8");
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

async function fetchAllVerses(
  supabase: SupabaseClient,
  bookIds: string[],
): Promise<DbVerse[]> {
  const out: DbVerse[] = [];
  for (const bookId of bookIds) {
    let from = 0;
    const page = 1000;
    for (;;) {
      const { data, error } = await supabase
        .from("bible_verses")
        .select("id, book_id, chapter, verse")
        .eq("book_id", bookId)
        .order("chapter")
        .order("verse")
        .range(from, from + page - 1);
      if (error) throw error;
      const rows = (data ?? []) as DbVerse[];
      out.push(...rows);
      if (rows.length < page) break;
      from += page;
    }
  }
  return out;
}

async function runUpdates(
  supabase: SupabaseClient,
  updates: { id: string; text: string }[],
) {
  let done = 0;
  for (let i = 0; i < updates.length; i += UPDATE_CONCURRENCY) {
    const chunk = updates.slice(i, i + UPDATE_CONCURRENCY);
    const results = await Promise.all(
      chunk.map((u) =>
        supabase
          .from("bible_verses")
          .update({ text_chin: u.text })
          .eq("id", u.id),
      ),
    );
    for (const r of results) {
      if (r.error) throw r.error;
    }
    done += chunk.length;
    process.stdout.write(`\r  Updated ${done}/${updates.length} verses…`);
  }
  process.stdout.write("\n");
}

/**
 * Map plain sequential lines onto DB verses using known book-start anchors.
 *
 * Between two anchors, lines are distributed across intervening books in
 * proportion to each book's DB verse count (so a short Tedim Psalms does not
 * steal Zechariah/Malachi). Within a book, verses are filled in order and any
 * leftover DB verses stay without Chin (reader falls back to MM).
 */
function mapSequentialLines(
  lines: string[],
  books: DbBook[],
  versesByBook: Map<string, DbVerse[]>,
): { id: string; text: string; ref: string }[] {
  const updates: { id: string; text: string; ref: string }[] = [];
  const warnings: string[] = [];

  // Split books into segments ending at each known anchor (inclusive start).
  type Segment = { startBookIdx: number; endBookIdx: number; lineStart: number; lineEnd: number };
  const segments: Segment[] = [];

  let segStartBook = 0;
  let segLineStart = 0;
  for (let bi = 0; bi < books.length; bi++) {
    const abbr = normalizeAbbr(books[bi].abbreviation);
    const anchored = TEDIM_BOOK_STARTS[abbr];
    if (anchored != null && bi > 0) {
      segments.push({
        startBookIdx: segStartBook,
        endBookIdx: bi - 1,
        lineStart: segLineStart,
        lineEnd: anchored - 2, // inclusive end before next book's first line
      });
      segStartBook = bi;
      segLineStart = anchored - 1;
    }
  }
  segments.push({
    startBookIdx: segStartBook,
    endBookIdx: books.length - 1,
    lineStart: segLineStart,
    lineEnd: lines.length - 1,
  });

  for (const seg of segments) {
    const segBooks = books.slice(seg.startBookIdx, seg.endBookIdx + 1);
    const available = Math.max(0, seg.lineEnd - seg.lineStart + 1);
    const dbCounts = segBooks.map((b) => (versesByBook.get(b.id) ?? []).length);
    const dbTotal = dbCounts.reduce((a, b) => a + b, 0);
    if (dbTotal === 0 || available === 0) continue;

    const alloc = new Array<number>(segBooks.length).fill(0);
    let remaining = available;
    let softFrom = 0;

    // Exact-count books (GEN/EXO) and single-book segments (next anchor is adjacent).
    for (let i = 0; i < segBooks.length; i++) {
      const abbr = normalizeAbbr(segBooks[i].abbreviation);
      const alone = segBooks.length === 1;
      const exact = alone || EXACT_COUNT_BOOKS.has(abbr);
      if (!exact) break;
      const take = Math.min(dbCounts[i], remaining);
      alloc[i] = take;
      remaining -= take;
      softFrom = i + 1;
      if (!EXACT_COUNT_BOOKS.has(abbr) && !alone) break;
    }

    // Soft stretch: proportional among remaining books in this segment.
    if (softFrom < segBooks.length && remaining > 0) {
      const softCounts = dbCounts.slice(softFrom);
      const softTotal = softCounts.reduce((a, b) => a + b, 0);
      if (softTotal > 0) {
        for (let i = 0; i < softCounts.length; i++) {
          alloc[softFrom + i] = Math.floor((remaining * softCounts[i]) / softTotal);
        }
        let leftover =
          remaining - softCounts.reduce((sum, c, i) => sum + alloc[softFrom + i]!, 0);
        for (let i = 0; i < softCounts.length && leftover > 0; i++) {
          const room = softCounts[i] - alloc[softFrom + i]!;
          if (room <= 0) continue;
          const add = Math.min(room, leftover);
          alloc[softFrom + i]! += add;
          leftover -= add;
        }
        if (leftover > 0) {
          warnings.push(
            `Segment ${normalizeAbbr(segBooks[0].abbreviation)}…${normalizeAbbr(segBooks[segBooks.length - 1].abbreviation)}: ${leftover} extra file lines unused`,
          );
        }
      }
    }

    let cursor = seg.lineStart;
    for (let i = 0; i < segBooks.length; i++) {
      const book = segBooks[i];
      const abbr = normalizeAbbr(book.abbreviation);
      const verses = versesByBook.get(book.id) ?? [];
      const take = Math.min(
        alloc[i]!,
        verses.length,
        Math.max(0, lines.length - cursor),
      );

      if (take < verses.length) {
        warnings.push(
          `${abbr}: mapped ${take}/${verses.length} verses (Tedim shorter than DB)`,
        );
      }

      for (let vi = 0; vi < take; vi++) {
        const v = verses[vi];
        updates.push({
          id: v.id,
          text: lines[cursor + vi],
          ref: `${abbr} ${v.chapter}:${v.verse}`,
        });
      }
      cursor += take;
    }
  }

  for (const w of warnings) console.warn(`  ! ${w}`);
  return updates;
}

function mapReferencedLines(
  refs: ParsedRef[],
  books: DbBook[],
  versesByBook: Map<string, DbVerse[]>,
): { id: string; text: string; ref: string }[] {
  const bookByAbbr = new Map(
    books.map((b) => [normalizeAbbr(b.abbreviation), b]),
  );
  const verseIndex = new Map<string, DbVerse>();
  for (const book of books) {
    const abbr = normalizeAbbr(book.abbreviation);
    for (const v of versesByBook.get(book.id) ?? []) {
      verseIndex.set(`${abbr}|${v.chapter}|${v.verse}`, v);
    }
  }

  const updates: { id: string; text: string; ref: string }[] = [];
  let skipped = 0;
  for (const r of refs) {
    const book = bookByAbbr.get(r.abbreviation);
    if (!book) {
      skipped += 1;
      continue;
    }
    const key = `${r.abbreviation}|${r.chapter}|${r.verse}`;
    const v = verseIndex.get(key);
    if (!v) {
      skipped += 1;
      continue;
    }
    updates.push({
      id: v.id,
      text: r.text,
      ref: `${r.abbreviation} ${r.chapter}:${r.verse}`,
    });
  }
  if (skipped) console.warn(`  ! Skipped ${skipped} unmatched referenced lines`);
  return updates;
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

  const filePath = resolve(
    process.cwd(),
    process.env.CHIN_BIBLE_PATH?.trim() || DEFAULT_PATH,
  );
  if (!existsSync(filePath)) {
    throw new Error(
      `Chin Bible file not found: ${filePath}\nPlace tedim_bible.txt at data/chin/tedim_bible.txt`,
    );
  }

  console.log(`Reading ${filePath}…`);
  const lines = readChinLines(filePath);
  console.log(`  ${lines.length} non-empty lines`);

  const referenced = lines
    .map(parseReferencedLine)
    .filter((r): r is ParsedRef => r != null);
  const useRefs = referenced.length > lines.length * 0.8;
  console.log(
    useRefs
      ? `  Detected referenced format (${referenced.length} lines)`
      : `  Using sequential Tedim mapping (plain verse-per-line; ${referenced.length} lines looked referenced)`,
  );

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: booksRaw, error: booksError } = await supabase
    .from("bible_books")
    .select("id, abbreviation, book_order, name_en")
    .order("book_order");
  if (booksError) throw booksError;
  const books = (booksRaw ?? []) as DbBook[];
  if (books.length === 0) {
    throw new Error("No bible_books found. Run npm run seed:bible first.");
  }

  console.log("Loading verse index from Supabase…");
  const allVerses = await fetchAllVerses(
    supabase,
    books.map((b) => b.id),
  );
  const versesByBook = new Map<string, DbVerse[]>();
  for (const v of allVerses) {
    const list = versesByBook.get(v.book_id) ?? [];
    list.push(v);
    versesByBook.set(v.book_id, list);
  }
  console.log(`  ${allVerses.length} DB verses across ${books.length} books`);

  // Optional Chin book names
  let namesUpdated = 0;
  for (const book of books) {
    const abbr = normalizeAbbr(book.abbreviation);
    const name = TEDIM_BOOK_NAMES[abbr];
    if (!name) continue;
    const { error } = await supabase
      .from("bible_books")
      .update({ name_chin: name })
      .eq("id", book.id);
    if (error) throw error;
    namesUpdated += 1;
  }
  if (namesUpdated) {
    console.log(`  Updated name_chin on ${namesUpdated} books`);
  }

  const updates = useRefs
    ? mapReferencedLines(referenced, books, versesByBook)
    : mapSequentialLines(lines, books, versesByBook);

  console.log(`Writing text_chin for ${updates.length} verses…`);
  if (updates.length === 0) {
    throw new Error("No verse updates produced — check file format / anchors");
  }

  // Sanity sample
  console.log(
    `  First: ${updates[0].ref} → ${updates[0].text.slice(0, 60)}…`,
  );
  console.log(
    `  Last:  ${updates[updates.length - 1].ref} → ${updates[updates.length - 1].text.slice(0, 60)}…`,
  );

  // Clear previous Chin text so remaps don't leave stale tails on unmapped verses.
  console.log("Clearing existing text_chin…");
  const { error: clearError } = await supabase
    .from("bible_verses")
    .update({ text_chin: null })
    .not("id", "is", null);
  if (clearError) throw clearError;

  await runUpdates(
    supabase,
    updates.map(({ id, text }) => ({ id, text })),
  );

  console.log(
    `Done. Set text_chin on ${updates.length} verses (DB total ${allVerses.length}).`,
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
