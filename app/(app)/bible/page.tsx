import { BibleWorkspace, type FavoriteCard } from "@/components/bible/bible-workspace";
import {
  ensureProfile,
  getCurrentUser,
  getPartnerUserId,
  profileBibleLanguages,
  profileLanguage,
} from "@/lib/auth/profile";
import type { Database } from "@/types/database";
import { redirect } from "next/navigation";

export const instant = false;

type Note = Database["public"]["Tables"]["bible_study_notes"]["Row"];
type Session = Database["public"]["Tables"]["bible_study_sessions"]["Row"];
type Favorite = Database["public"]["Tables"]["bible_favorites"]["Row"];
type Verse = Database["public"]["Tables"]["bible_verses"]["Row"];

async function enrichFavorites(
  supabase: Awaited<ReturnType<typeof getCurrentUser>>["supabase"],
  favorites: Favorite[],
): Promise<FavoriteCard[]> {
  if (favorites.length === 0) return [];

  const bookIds = [...new Set(favorites.map((f) => f.book_id))];
  const { data: books } = await supabase
    .from("bible_books")
    .select("id, name_en, name_mm, name_chin")
    .in("id", bookIds);

  const bookMap = new Map(
    (books ?? []).map((b) => [
      b.id,
      {
        name_en: b.name_en,
        name_mm: b.name_mm,
        name_chin: b.name_chin,
      },
    ]),
  );

  const verseMap = new Map<
    string,
    Pick<Verse, "text_mm" | "text_en" | "text_chin" | "text_kjv">
  >();

  // Batch by book to avoid huge OR filters.
  const byBook = new Map<string, { chapter: number; verse: number }[]>();
  for (const f of favorites) {
    const list = byBook.get(f.book_id) ?? [];
    list.push({ chapter: f.chapter, verse: f.verse });
    byBook.set(f.book_id, list);
  }

  for (const [bookId, refs] of byBook) {
    const chapters = [...new Set(refs.map((r) => r.chapter))];
    const { data: verseRows } = await supabase
      .from("bible_verses")
      .select("book_id, chapter, verse, text_mm, text_en, text_chin, text_kjv")
      .eq("book_id", bookId)
      .in("chapter", chapters);
    for (const row of verseRows ?? []) {
      verseMap.set(`${row.book_id}|${row.chapter}|${row.verse}`, {
        text_mm: row.text_mm,
        text_en: row.text_en,
        text_chin: row.text_chin,
        text_kjv: row.text_kjv,
      });
    }
  }

  return favorites.map((f) => {
    const book = bookMap.get(f.book_id);
    const verse = verseMap.get(`${f.book_id}|${f.chapter}|${f.verse}`);
    return {
      ...f,
      book_name_en: book?.name_en,
      book_name_mm: book?.name_mm,
      book_name_chin: book?.name_chin,
      text_mm: verse?.text_mm ?? null,
      text_en: verse?.text_en ?? null,
      text_chin: verse?.text_chin ?? null,
      text_kjv: verse?.text_kjv ?? null,
    };
  });
}

export default async function BiblePage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string; chapter?: string; verse?: string }>;
}) {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await ensureProfile(supabase, user.id, user.email);
  const language = profileLanguage(profile);
  const preferredVersions = profileBibleLanguages(profile);
  const partnerId = await getPartnerUserId(supabase, user.id);
  const params = await searchParams;

  const { data: books } = await supabase
    .from("bible_books")
    .select("*")
    .order("book_order");

  const bookList = books ?? [];
  const bookId = params.book ?? bookList[0]?.id ?? null;
  const chapter = Math.max(1, Number(params.chapter ?? "1") || 1);
  const initialVerse = params.verse ? Math.max(1, Number(params.verse) || 0) : null;

  let verses: Database["public"]["Tables"]["bible_verses"]["Row"][] = [];
  let chapterCount = 1;
  let myNotes: Note[] = [];

  if (bookId) {
    const [{ data: verseRows }, { data: maxChapterRow }, { data: notes }] =
      await Promise.all([
        supabase
          .from("bible_verses")
          .select("*")
          .eq("book_id", bookId)
          .eq("chapter", chapter)
          .order("verse"),
        supabase
          .from("bible_verses")
          .select("chapter")
          .eq("book_id", bookId)
          .order("chapter", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("bible_study_notes")
          .select("*")
          .eq("user_id", user.id)
          .eq("book_id", bookId)
          .eq("chapter", chapter)
          .order("created_at", { ascending: false }),
      ]);

    verses = verseRows ?? [];
    chapterCount = maxChapterRow?.chapter ?? 1;
    myNotes = notes ?? [];
  }

  const [{ data: mySessions }, { data: myFavoriteRows }] = await Promise.all([
    supabase
      .from("bible_study_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("session_date", { ascending: false }),
    supabase
      .from("bible_favorites")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const myFavorites = await enrichFavorites(supabase, myFavoriteRows ?? []);

  let partnerSessions: Session[] = [];
  let partnerSharedNotes: (Note & {
    book_name_en?: string;
    book_name_mm?: string;
  })[] = [];
  let partnerSharedFavorites: FavoriteCard[] = [];

  if (partnerId) {
    const [{ data: pSessions }, { data: pNotes }, { data: pFavs }] =
      await Promise.all([
        supabase
          .from("bible_study_sessions")
          .select("*")
          .eq("user_id", partnerId)
          .order("session_date", { ascending: false })
          .limit(100),
        supabase
          .from("bible_study_notes")
          .select("*, bible_books(name_en, name_mm)")
          .eq("user_id", partnerId)
          .eq("is_shared", true)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("bible_favorites")
          .select("*")
          .eq("user_id", partnerId)
          .eq("is_shared", true)
          .order("created_at", { ascending: false })
          .limit(30),
      ]);

    partnerSessions = pSessions ?? [];
    type NoteJoin = Note & {
      bible_books: { name_en: string; name_mm: string } | null;
    };
    partnerSharedNotes = ((pNotes ?? []) as unknown as NoteJoin[]).map((n) => ({
      ...n,
      book_name_en: n.bible_books?.name_en,
      book_name_mm: n.bible_books?.name_mm,
    }));
    partnerSharedFavorites = await enrichFavorites(supabase, pFavs ?? []);
  }

  return (
    <BibleWorkspace
      language={language}
      userId={user.id}
      books={bookList}
      initialBookId={bookId}
      initialChapter={chapter}
      initialVerse={initialVerse && initialVerse > 0 ? initialVerse : null}
      initialVersions={preferredVersions}
      verses={verses}
      chapterCount={chapterCount}
      myNotes={myNotes}
      mySessions={mySessions ?? []}
      partnerSessions={partnerSessions}
      partnerSharedNotes={partnerSharedNotes}
      myFavorites={myFavorites}
      partnerSharedFavorites={partnerSharedFavorites}
    />
  );
}
