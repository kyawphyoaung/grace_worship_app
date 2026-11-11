"use server";

import { createClient } from "@/lib/supabase/server";
import { bookMatchesQuery, parseBibleReference } from "@/lib/bible/reference";
import type { BibleVersion } from "@/lib/config";
import type { Database } from "@/types/database";

type Verse = Database["public"]["Tables"]["bible_verses"]["Row"];

export type ActionResult = { error: string | null };

export type VerseSearchHit = Verse & {
  book_name_en: string;
  book_name_mm: string;
};

export type SearchVersesResult = {
  error: string | null;
  results: VerseSearchHit[];
};

export async function updateBibleLanguages(
  userId: string,
  versions: BibleVersion[],
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ preferred_bible_languages: versions })
    .eq("id", userId);
  return { error: error?.message ?? null };
}

export async function markChapterRead(input: {
  userId: string;
  bookId: string;
  chapter: number;
  versesRead: number;
  sessionDate: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("bible_study_sessions").insert({
    user_id: input.userId,
    book_id: input.bookId,
    chapter: input.chapter,
    verses_read: input.versesRead,
    completed: true,
    session_date: input.sessionDate,
  });
  return { error: error?.message ?? null };
}

export async function saveNote(input: {
  userId: string;
  bookId: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  reflection: string;
  isShared: boolean;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("bible_study_notes").insert({
    user_id: input.userId,
    book_id: input.bookId,
    chapter: input.chapter,
    verse_start: input.verseStart,
    verse_end: input.verseEnd,
    reflection: input.reflection,
    is_shared: input.isShared,
  });
  return { error: error?.message ?? null };
}

export async function addFavorite(input: {
  userId: string;
  bookId: string;
  chapter: number;
  verse: number;
  kind: "favorite" | "highlight";
  highlightedText?: string | null;
  isShared?: boolean;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("bible_favorites").insert({
    user_id: input.userId,
    book_id: input.bookId,
    chapter: input.chapter,
    verse: input.verse,
    kind: input.kind,
    highlighted_text: input.highlightedText ?? null,
    is_shared: input.isShared ?? false,
  });
  return { error: error?.message ?? null };
}

export async function removeFavorite(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("bible_favorites").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function searchVerses(query: string): Promise<SearchVersesResult> {
  const supabase = await createClient();
  const q = query.trim();
  if (!q) return { error: null, results: [] };

  const { data: books, error: booksError } = await supabase
    .from("bible_books")
    .select("id, name_en, name_mm, name_chin, abbreviation");
  if (booksError) {
    return { error: booksError.message, results: [] };
  }

  const parsed = parseBibleReference(q);
  if (parsed) {
    const matchedBook = (books ?? []).find((b) =>
      bookMatchesQuery(b, parsed.bookQuery),
    );
    if (matchedBook) {
      let verseQuery = supabase
        .from("bible_verses")
        .select("*")
        .eq("book_id", matchedBook.id)
        .eq("chapter", parsed.chapter)
        .order("verse");
      if (parsed.verse) verseQuery = verseQuery.eq("verse", parsed.verse);
      const { data, error } = await verseQuery;
      if (error) return { error: error.message, results: [] };
      return {
        error: null,
        results: (data ?? []).map((v) => ({
          ...v,
          book_name_en: matchedBook.name_en,
          book_name_mm: matchedBook.name_mm,
        })),
      };
    }
  }

  const safe = q.replace(/[%_,]/g, " ").trim();
  const { data, error } = await supabase
    .from("bible_verses")
    .select("*, bible_books(name_en, name_mm)")
    .or(
      `text_en.ilike.%${safe}%,text_mm.ilike.%${safe}%,text_chin.ilike.%${safe}%,text_kjv.ilike.%${safe}%`,
    )
    .limit(40);

  if (error) return { error: error.message, results: [] };

  type Row = Verse & {
    bible_books: { name_en: string; name_mm: string } | null;
  };

  return {
    error: null,
    results: ((data ?? []) as unknown as Row[]).map((row) => ({
      id: row.id,
      book_id: row.book_id,
      chapter: row.chapter,
      verse: row.verse,
      text_en: row.text_en,
      text_mm: row.text_mm,
      text_chin: row.text_chin,
      text_kjv: row.text_kjv,
      book_name_en: row.bible_books?.name_en ?? "",
      book_name_mm: row.bible_books?.name_mm ?? "",
    })),
  };
}

export async function invitePartner(input: {
  partnerId: string;
  actorId: string;
  message: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: input.partnerId,
    actor_id: input.actorId,
    type: "bible_study_invite",
    entity_type: "bible_study",
    entity_id: input.actorId,
    message: input.message,
  });
  return { error: error?.message ?? null };
}
