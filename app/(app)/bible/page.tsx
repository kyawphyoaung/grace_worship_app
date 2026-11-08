import { BibleWorkspace } from "@/components/bible/bible-workspace";
import {
  ensureProfile,
  getCurrentUser,
  getPartnerUserId,
  profileLanguage,
} from "@/lib/auth/profile";
import type { Database } from "@/types/database";
import { redirect } from "next/navigation";

export const instant = false;

type Note = Database["public"]["Tables"]["bible_study_notes"]["Row"];
type Session = Database["public"]["Tables"]["bible_study_sessions"]["Row"];
type Favorite = Database["public"]["Tables"]["bible_favorites"]["Row"];

export default async function BiblePage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string; chapter?: string }>;
}) {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await ensureProfile(supabase, user.id, user.email);
  const language = profileLanguage(profile);
  const partnerId = await getPartnerUserId(supabase, user.id);
  const params = await searchParams;

  const { data: books } = await supabase
    .from("bible_books")
    .select("*")
    .order("book_order");

  const bookList = books ?? [];
  const bookId = params.book ?? bookList[0]?.id ?? null;
  const chapter = Math.max(1, Number(params.chapter ?? "1") || 1);

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

  const [{ data: mySessions }, { data: myFavorites }] = await Promise.all([
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

  let partnerSessions: Session[] = [];
  let partnerSharedNotes: (Note & {
    book_name_en?: string;
    book_name_mm?: string;
  })[] = [];
  let partnerSharedFavorites: (Favorite & {
    book_name_en?: string;
    book_name_mm?: string;
  })[] = [];

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
          .select("*, bible_books(name_en, name_mm)")
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
    type FavJoin = Favorite & {
      bible_books: { name_en: string; name_mm: string } | null;
    };
    partnerSharedFavorites = ((pFavs ?? []) as unknown as FavJoin[]).map(
      (f) => ({
        ...f,
        book_name_en: f.bible_books?.name_en,
        book_name_mm: f.bible_books?.name_mm,
      }),
    );
  }

  return (
    <BibleWorkspace
      language={language}
      userId={user.id}
      books={bookList}
      initialBookId={bookId}
      initialChapter={chapter}
      verses={verses}
      chapterCount={chapterCount}
      myNotes={myNotes}
      mySessions={mySessions ?? []}
      partnerSessions={partnerSessions}
      partnerSharedNotes={partnerSharedNotes}
      myFavorites={myFavorites ?? []}
      partnerSharedFavorites={partnerSharedFavorites}
    />
  );
}
