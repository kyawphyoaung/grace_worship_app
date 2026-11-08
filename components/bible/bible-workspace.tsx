"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { t, type Language } from "@/lib/i18n";
import { computeStreaks } from "@/lib/streaks";
import { bookMatchesQuery, parseBibleReference } from "@/lib/bible/reference";
import { Segmented } from "@/components/ui/segmented";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Book = Database["public"]["Tables"]["bible_books"]["Row"];
type Verse = Database["public"]["Tables"]["bible_verses"]["Row"];
type Note = Database["public"]["Tables"]["bible_study_notes"]["Row"];
type Session = Database["public"]["Tables"]["bible_study_sessions"]["Row"];

type ViewMode = "both" | "mm" | "en";
type Tab = "read" | "search" | "streaks" | "calendar" | "partner";

export function BibleWorkspace({
  language,
  userId,
  partnerId,
  books,
  initialBookId,
  initialChapter,
  verses,
  chapterCount,
  myNotes,
  mySessions,
  partnerSessions,
  partnerSharedNotes,
}: {
  language: Language;
  userId: string;
  partnerId: string | null;
  books: Book[];
  initialBookId: string | null;
  initialChapter: number;
  verses: Verse[];
  chapterCount: number;
  myNotes: Note[];
  mySessions: Session[];
  partnerSessions: Session[];
  partnerSharedNotes: (Note & { book_name_en?: string; book_name_mm?: string })[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>("read");
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [bookId, setBookId] = useState(initialBookId ?? "");
  const [chapter, setChapter] = useState(initialChapter);
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [reflection, setReflection] = useState("");
  const [shareNote, setShareNote] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    (Verse & { book_name_en: string; book_name_mm: string })[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const chapters = useMemo(
    () => Array.from({ length: Math.max(chapterCount, 1) }, (_, i) => i + 1),
    [chapterCount],
  );

  const streaks = useMemo(() => {
    const dates = mySessions.map((s) => s.session_date);
    return computeStreaks(dates);
  }, [mySessions]);

  const sessionDates = useMemo(
    () => new Set(mySessions.map((s) => s.session_date)),
    [mySessions],
  );

  const navigateChapter = (nextBookId: string, nextChapter: number) => {
    setBookId(nextBookId);
    setChapter(nextChapter);
    setRangeStart(null);
    setRangeEnd(null);
    router.push(`/bible?book=${nextBookId}&chapter=${nextChapter}`);
  };

  const onVerseTap = (verseNum: number) => {
    if (rangeStart === null) {
      setRangeStart(verseNum);
      setRangeEnd(verseNum);
      return;
    }
    if (rangeEnd === null || rangeStart === rangeEnd) {
      const start = Math.min(rangeStart, verseNum);
      const end = Math.max(rangeStart, verseNum);
      setRangeStart(start);
      setRangeEnd(end);
      return;
    }
    setRangeStart(verseNum);
    setRangeEnd(verseNum);
  };

  const inRange = (verseNum: number) => {
    if (rangeStart === null || rangeEnd === null) return false;
    return verseNum >= rangeStart && verseNum <= rangeEnd;
  };

  const markChapterRead = () => {
    if (!bookId) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("bible_study_sessions").insert({
        user_id: userId,
        book_id: bookId,
        chapter,
        verses_read: verses.length,
        completed: true,
        session_date: format(new Date(), "yyyy-MM-dd"),
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage(t("bible.markedRead", language));
      router.refresh();
    });
  };

  const saveNote = () => {
    if (!bookId || rangeStart === null || rangeEnd === null || !reflection.trim()) {
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("bible_study_notes").insert({
        user_id: userId,
        book_id: bookId,
        chapter,
        verse_start: rangeStart,
        verse_end: rangeEnd,
        reflection: reflection.trim(),
        is_shared: shareNote,
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setNoteOpen(false);
      setReflection("");
      setShareNote(false);
      setRangeStart(null);
      setRangeEnd(null);
      router.refresh();
    });
  };

  const runSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    startTransition(async () => {
      const supabase = createClient();
      const parsed = parseBibleReference(q);

      if (parsed) {
        const matchedBook = books.find((b) => bookMatchesQuery(b, parsed.bookQuery));
        if (matchedBook) {
          let query = supabase
            .from("bible_verses")
            .select("*")
            .eq("book_id", matchedBook.id)
            .eq("chapter", parsed.chapter)
            .order("verse");
          if (parsed.verse) {
            query = query.eq("verse", parsed.verse);
          }
          const { data } = await query;
          setSearchResults(
            (data ?? []).map((v) => ({
              ...v,
              book_name_en: matchedBook.name_en,
              book_name_mm: matchedBook.name_mm,
            })),
          );
          setSearching(false);
          return;
        }
      }

      const safe = q.replace(/[%_,]/g, " ").trim();
      const { data } = await supabase
        .from("bible_verses")
        .select("*, bible_books(name_en, name_mm)")
        .or(`text_en.ilike.%${safe}%,text_mm.ilike.%${safe}%`)
        .limit(40);

      type Row = Verse & {
        bible_books: { name_en: string; name_mm: string } | null;
      };
      setSearchResults(
        ((data ?? []) as unknown as Row[]).map((row) => ({
          id: row.id,
          book_id: row.book_id,
          chapter: row.chapter,
          verse: row.verse,
          text_en: row.text_en,
          text_mm: row.text_mm,
          book_name_en: row.bible_books?.name_en ?? "",
          book_name_mm: row.bible_books?.name_mm ?? "",
        })),
      );
      setSearching(false);
    });
  };

  if (books.length === 0) {
    return (
      <p className="text-muted-foreground">{t("bible.noBooks", language)}</p>
    );
  }

  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("bible.title", language)}
        </h1>
      </div>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "read", label: t("bible.read", language) },
          { value: "search", label: t("bible.search", language) },
          { value: "streaks", label: t("bible.streaks", language) },
          { value: "calendar", label: t("bible.calendar", language) },
          { value: "partner", label: t("bible.partner", language) },
        ]}
      />

      {message ? (
        <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
          {message}
        </p>
      ) : null}

      {tab === "read" ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">{t("bible.book", language)}</span>
              <select
                className="min-h-11 w-full rounded-md border border-input bg-card px-3 text-foreground"
                value={bookId}
                onChange={(e) => navigateChapter(e.target.value, 1)}
              >
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {language === "mm" ? b.name_mm : b.name_en}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">
                {t("bible.chapter", language)}
              </span>
              <select
                className="min-h-11 w-full rounded-md border border-input bg-card px-3 text-foreground"
                value={chapter}
                onChange={(e) => navigateChapter(bookId, Number(e.target.value))}
              >
                {chapters.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <Segmented
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: "both", label: t("bible.viewBoth", language) },
              { value: "mm", label: t("bible.viewMm", language) },
              { value: "en", label: t("bible.viewEn", language) },
            ]}
          />

          <div className="space-y-2">
            {verses.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onVerseTap(v.verse)}
                className={cn(
                  "w-full rounded-xl border px-3 py-3 text-left transition-colors",
                  inRange(v.verse)
                    ? "border-primary/50 bg-primary/10"
                    : "border-transparent bg-card/60 hover:bg-card",
                )}
              >
                <span className="mr-2 text-xs font-medium text-primary">
                  {v.verse}
                </span>
                {viewMode !== "en" ? (
                  <p className="mm-text text-[15px] text-foreground/95">{v.text_mm}</p>
                ) : null}
                {viewMode !== "mm" ? (
                  <p
                    className={cn(
                      "text-[15px] leading-relaxed text-foreground/90",
                      viewMode === "both" && "mt-1 text-muted-foreground",
                    )}
                  >
                    {v.text_en}
                  </p>
                ) : null}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              className="min-h-11"
              disabled={pending || !bookId}
              onClick={markChapterRead}
            >
              {t("bible.markRead", language)}
            </Button>
            <Button
              variant="secondary"
              className="min-h-11"
              disabled={rangeStart === null}
              onClick={() => setNoteOpen(true)}
            >
              {t("bible.saveNote", language)}
              {rangeStart !== null && rangeEnd !== null
                ? ` (${rangeStart}–${rangeEnd})`
                : ""}
            </Button>
          </div>

          {myNotes.length > 0 ? (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                {t("bible.yourNotes", language)}
              </h2>
              {myNotes.map((n) => (
                <div key={n.id} className="rounded-xl border border-border bg-card p-3">
                  <p className="text-xs text-primary">
                    {n.verse_start}–{n.verse_end}
                    {n.is_shared ? ` · ${t("common.shared", language)}` : ""}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">{n.reflection}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "search" ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              className="min-h-11 bg-card"
              placeholder={t("bible.searchPlaceholder", language)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runSearch();
              }}
            />
            <Button className="min-h-11" onClick={runSearch} disabled={searching}>
              {t("common.search", language)}
            </Button>
          </div>
          <div className="space-y-2">
            {searchResults.map((r) => (
              <button
                key={r.id}
                type="button"
                className="w-full rounded-xl border border-border bg-card p-3 text-left"
                onClick={() => {
                  setTab("read");
                  navigateChapter(r.book_id, r.chapter);
                }}
              >
                <p className="text-xs text-primary">
                  {language === "mm" ? r.book_name_mm : r.book_name_en} {r.chapter}:
                  {r.verse}
                </p>
                <p className="mm-text mt-1 text-sm">{r.text_mm}</p>
                <p className="mt-1 text-sm text-muted-foreground">{r.text_en}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "streaks" ? (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            {t("bible.streakGift", language)}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("bible.currentStreak", language)}
              </p>
              <p className="mt-1 text-3xl font-semibold text-primary">
                {streaks.current}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  {t("bible.days", language)}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("bible.bestStreak", language)}
              </p>
              <p className="mt-1 text-3xl font-semibold text-foreground">
                {streaks.best}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  {t("bible.days", language)}
                </span>
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "calendar" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() =>
                setCalendarMonth(
                  new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1),
                )
              }
            >
              ‹
            </Button>
            <p className="font-medium">{format(calendarMonth, "MMMM yyyy")}</p>
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() =>
                setCalendarMonth(
                  new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1),
                )
              }
            >
              ›
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={`${d}-${i}`} className="py-1">
                {d}
              </div>
            ))}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const active = sessionDates.has(key);
              return (
                <div
                  key={key}
                  className={cn(
                    "flex min-h-11 items-center justify-center rounded-lg text-sm",
                    active && "bg-primary/20 text-primary",
                    isSameDay(day, new Date()) && "ring-1 ring-primary/40",
                  )}
                >
                  {format(day, "d")}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {tab === "partner" ? (
        <div className="space-y-5">
          {!partnerId ? (
            <p className="text-muted-foreground">{t("common.empty", language)}</p>
          ) : (
            <>
              <div>
                <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                  {t("bible.partnerProgress", language)}
                </h2>
                <ul className="space-y-2">
                  {partnerSessions.length === 0 ? (
                    <li className="text-sm text-muted-foreground">
                      {t("common.empty", language)}
                    </li>
                  ) : (
                    partnerSessions.slice(0, 30).map((s) => {
                      const book = books.find((b) => b.id === s.book_id);
                      return (
                        <li
                          key={s.id}
                          className="rounded-xl border border-border bg-card px-3 py-2 text-sm"
                        >
                          {language === "mm" ? book?.name_mm : book?.name_en}{" "}
                          {s.chapter} · {s.session_date}
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
              <div>
                <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                  {t("bible.partnerNotes", language)}
                </h2>
                <ul className="space-y-2">
                  {partnerSharedNotes.length === 0 ? (
                    <li className="text-sm text-muted-foreground">
                      {t("common.empty", language)}
                    </li>
                  ) : (
                    partnerSharedNotes.map((n) => (
                      <li
                        key={n.id}
                        className="rounded-xl border border-border bg-card p-3"
                      >
                        <p className="text-xs text-primary">
                          {language === "mm" ? n.book_name_mm : n.book_name_en}{" "}
                          {n.chapter}:{n.verse_start}–{n.verse_end}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed">{n.reflection}</p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
      ) : null}

      <Modal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title={t("bible.saveNote", language)}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("bible.selectedVerses", language)}: {rangeStart}–{rangeEnd}
          </p>
          <textarea
            className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder={t("bible.notePlaceholder", language)}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
          />
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <Checkbox
              checked={shareNote}
              onCheckedChange={(v) => setShareNote(v === true)}
            />
            {t("common.shareWithPartner", language)}
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" className="min-h-11" onClick={() => setNoteOpen(false)}>
              {t("common.cancel", language)}
            </Button>
            <Button className="min-h-11" disabled={pending} onClick={saveNote}>
              {t("common.save", language)}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
