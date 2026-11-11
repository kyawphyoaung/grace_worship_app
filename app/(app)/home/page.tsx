import { HomeWorkspace } from "@/components/home/home-workspace";
import {
  ensureProfile,
  getCurrentUser,
  profileLanguage,
} from "@/lib/auth/profile";
import { redirect } from "next/navigation";

export const instant = false;

export default async function HomePage() {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await ensureProfile(supabase, user.id, user.email);
  const language = profileLanguage(profile);

  const { data: myLatest } = await supabase
    .from("bible_study_sessions")
    .select("book_id, chapter, session_date, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let continueSession: {
    book_id: string;
    chapter: number;
    session_date: string;
  } | null = myLatest;

  if (!continueSession) {
    const { data: anyLatest } = await supabase
      .from("bible_study_sessions")
      .select("book_id, chapter, session_date")
      .order("session_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    continueSession = anyLatest;
  }

  let continueBook: {
    id: string;
    name_en: string;
    name_mm: string;
  } | null = null;

  if (continueSession) {
    const { data: book } = await supabase
      .from("bible_books")
      .select("id, name_en, name_mm")
      .eq("id", continueSession.book_id)
      .maybeSingle();
    continueBook = book;
  }

  const { data: genesis } = await supabase
    .from("bible_books")
    .select("id, name_en, name_mm")
    .eq("book_order", 1)
    .maybeSingle();

  return (
    <HomeWorkspace
      language={language}
      continueSession={
        continueSession && continueBook
          ? {
              bookId: continueBook.id,
              chapter: continueSession.chapter,
              nameEn: continueBook.name_en,
              nameMm: continueBook.name_mm,
            }
          : null
      }
      genesis={
        genesis
          ? { bookId: genesis.id, nameEn: genesis.name_en, nameMm: genesis.name_mm }
          : null
      }
    />
  );
}
