"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  subDays,
} from "date-fns";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { t, tf, type Language } from "@/lib/i18n";
import { computeStreaks } from "@/lib/streaks";
import { bookMatchesQuery, parseBibleReference } from "@/lib/bible/reference";
import { Segmented } from "@/components/ui/segmented";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PickerSheet } from "@/components/ui/picker-sheet";
import { useToast } from "@/components/ui/toast";
import { useCouple } from "@/components/couple-provider";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Book = Database["public"]["Tables"]["bible_books"]["Row"];
type Verse = Database["public"]["Tables"]["bible_verses"]["Row"];
type Note = Database["public"]["Tables"]["bible_study_notes"]["Row"];
type Session = Database["public"]["Tables"]["bible_study_sessions"]["Row"];
type Favorite = Database["public"]["Tables"]["bible_favorites"]["Row"];

type ViewMode = "both" | "mm" | "en";
type Tab = "read" | "search" | "streaks" | "calendar" | "partner" | "favorites";

type SelectionBar = {
  verse: number;
  text: string;
  x: number;
  y: number;
};

export function BibleWorkspace({
  language,
  userId,
  books,
  initialBookId,
  initialChapter,
  verses,
  chapterCount,
  myNotes,
  mySessions,
  partnerSessions,
  partnerSharedNotes,
  myFavorites,
  partnerSharedFavorites,
}: {
  language: Language;
  userId: string;
  books: Book[];
  initialBookId: string | null;
  initialChapter: number;
  verses: Verse[];
  chapterCount: number;
  myNotes: Note[];
  mySessions: Session[];
  partnerSessions: Session[];
  partnerSharedNotes: (Note & { book_name_en?: string; book_name_mm?: string })[];
  myFavorites: Favorite[];
  partnerSharedFavorites: (Favorite & {
    book_name_en?: string;
    book_name_mm?: string;
  })[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { partner, partnerName } = useCouple();
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    (Verse & { book_name_en: string; book_name_mm: string })[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectionBar, setSelectionBar] = useState<SelectionBar | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setBookId(initialBookId ?? "");
    setChapter(initialChapter);
  }, [initialBookId, initialChapter]);

  const bookOptions = useMemo(
    () =>
      books.map((b) => ({
        value: b.id,
        label: language === "mm" ? b.name_mm : b.name_en,
        searchText: `${b.name_mm} ${b.name_en} ${b.abbreviation}`,
      })),
    [books, language],
  );

  const chapterOptions = useMemo(
    () =>
      Array.from({ length: Math.max(chapterCount, 1) }, (_, i) => ({
        value: String(i + 1),
        label: String(i + 1),
      })),
    [chapterCount],
  );

  const streaks = useMemo(
    () => computeStreaks(mySessions.map((s) => s.session_date)),
    [mySessions],
  );
  const partnerStreaks = useMemo(
    () => computeStreaks(partnerSessions.map((s) => s.session_date)),
    [partnerSessions],
  );
  const sessionDates = useMemo(
    () => new Set(mySessions.map((s) => s.session_date)),
    [mySessions],
  );
  const partnerSessionDates = useMemo(
    () => new Set(partnerSessions.map((s) => s.session_date)),
    [partnerSessions],
  );

  const favoriteVerseSet = useMemo(() => {
    const set = new Set<number>();
    for (const f of myFavorites) {
      if (
        f.kind === "favorite" &&
        f.book_id === bookId &&
        f.chapter === chapter
      ) {
        set.add(f.verse);
      }
    }
    return set;
  }, [myFavorites, bookId, chapter]);

  const highlightsByVerse = useMemo(() => {
    const map = new Map<number, Favorite[]>();
    for (const f of myFavorites) {
      if (
        f.kind === "highlight" &&
        f.book_id === bookId &&
        f.chapter === chapter
      ) {
        const list = map.get(f.verse) ?? [];
        list.push(f);
        map.set(f.verse, list);
      }
    }
    return map;
  }, [myFavorites, bookId, chapter]);

  const navigateChapter = (nextBookId: string, nextChapter: number) => {
    setBookId(nextBookId);
    setChapter(nextChapter);
    setRangeStart(null);
    setRangeEnd(null);
    setSelectionBar(null);
    router.push(`/bible?book=${nextBookId}&chapter=${nextChapter}`);
  };

  const advanceAfterRead = () => {
    const currentBook = books.find((b) => b.id === bookId);
    if (!currentBook) return;
    if (chapter < chapterCount) {
      navigateChapter(bookId, chapter + 1);
      return;
    }
    const sorted = [...books].sort((a, b) => a.book_order - b.book_order);
    const idx = sorted.findIndex((b) => b.id === bookId);
    if (idx >= 0 && idx < sorted.length - 1) {
      navigateChapter(sorted[idx + 1].id, 1);
    }
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
        showToast(error.message);
        return;
      }
      showToast(t("bible.markedRead", language));
      advanceAfterRead();
      router.refresh();
    });
  };

  const onVerseTap = (verseNum: number) => {
    if (rangeStart === null) {
      setRangeStart(verseNum);
      setRangeEnd(verseNum);
      return;
    }
    if (rangeEnd === null || rangeStart === rangeEnd) {
      setRangeStart(Math.min(rangeStart, verseNum));
      setRangeEnd(Math.max(rangeStart, verseNum));
      return;
    }
    setRangeStart(verseNum);
    setRangeEnd(verseNum);
  };

  const inRange = (verseNum: number) => {
    if (rangeStart === null || rangeEnd === null) return false;
    return verseNum >= rangeStart && verseNum <= rangeEnd;
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
        showToast(error.message);
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

  const toggleFavorite = (verseNum: number) => {
    if (!bookId) return;
    const existing = myFavorites.find(
      (f) =>
        f.kind === "favorite" &&
        f.book_id === bookId &&
        f.chapter === chapter &&
        f.verse === verseNum,
    );
    startTransition(async () => {
      const supabase = createClient();
      if (existing) {
        const { error } = await supabase
          .from("bible_favorites")
          .delete()
          .eq("id", existing.id);
        if (error) showToast(error.message);
      } else {
        const { error } = await supabase.from("bible_favorites").insert({
          user_id: userId,
          book_id: bookId,
          chapter,
          verse: verseNum,
          kind: "favorite",
          highlighted_text: null,
          is_shared: false,
        });
        if (error) showToast(error.message);
      }
      router.refresh();
    });
  };

  const saveHighlight = (verseNum: number, text: string, share: boolean) => {
    if (!bookId || !text.trim()) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("bible_favorites").insert({
        user_id: userId,
        book_id: bookId,
        chapter,
        verse: verseNum,
        kind: "highlight",
        highlighted_text: text.trim(),
        is_shared: share,
      });
      if (error) showToast(error.message);
      setSelectionBar(null);
      window.getSelection()?.removeAllRanges();
      router.refresh();
    });
  };

  const removeFavorite = (id: string) => {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("bible_favorites").delete().eq("id", id);
      if (error) showToast(error.message);
      router.refresh();
    });
  };

  const onTextSelect = (verseNum: number, e: React.MouseEvent | React.TouchEvent) => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? "";
    if (!text || text.length < 2) {
      setSelectionBar(null);
      return;
    }
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setSelectionBar({
      verse: verseNum,
      text,
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY - 8,
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
        const matchedBook = books.find((b) =>
          bookMatchesQuery(b, parsed.bookQuery),
        );
        if (matchedBook) {
          let query = supabase
            .from("bible_verses")
            .select("*")
            .eq("book_id", matchedBook.id)
            .eq("chapter", parsed.chapter)
            .order("verse");
          if (parsed.verse) query = query.eq("verse", parsed.verse);
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

  const renderHighlighted = (full: string, highlights: Favorite[]) => {
    if (!highlights.length) return full;
    let nodes: React.ReactNode[] = [full];
    for (const h of highlights) {
      const needle = h.highlighted_text;
      if (!needle) continue;
      nodes = nodes.flatMap((node, idx) => {
        if (typeof node !== "string") return [node];
        const parts = node.split(needle);
        if (parts.length === 1) return [node];
        const out: React.ReactNode[] = [];
        parts.forEach((part, i) => {
          out.push(part);
          if (i < parts.length - 1) {
            out.push(
              <mark
                key={`${h.id}-${idx}-${i}`}
                className="rounded bg-primary/25 px-0.5 text-inherit"
              >
                {needle}
              </mark>,
            );
          }
        });
        return out;
      });
    }
    return nodes;
  };

  if (books.length === 0) {
    return <p className="text-muted-foreground">{t("bible.noBooks", language)}</p>;
  }

  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const last30 = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });
  const partnerChapterCount = new Set(
    partnerSessions.map((s) => `${s.book_id}:${s.chapter}`),
  ).size;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-3xl font-semibold tracking-tight">
        {t("bible.title", language)}
      </h1>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "read", label: t("bible.read", language) },
          { value: "search", label: t("bible.search", language) },
          { value: "streaks", label: t("bible.streaks", language) },
          { value: "calendar", label: t("bible.calendar", language) },
          {
            value: "partner",
            label: tf("bible.partnerTab", language, { name: partnerName }),
          },
          { value: "favorites", label: t("bible.favorites", language) },
        ]}
      />

      {tab === "read" ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <PickerSheet
              label={t("bible.book", language)}
              value={bookId}
              options={bookOptions}
              searchable
              searchPlaceholder={t("bible.searchBooks", language)}
              doneLabel={t("common.done", language)}
              onChange={(id) => navigateChapter(id, 1)}
            />
            <PickerSheet
              label={t("bible.chapter", language)}
              value={String(chapter)}
              options={chapterOptions}
              mode="grid"
              doneLabel={t("common.done", language)}
              onChange={(c) => navigateChapter(bookId, Number(c))}
            />
          </div>

          <Button
            variant="secondary"
            className="min-h-11 w-full border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
            disabled={pending || !bookId}
            onClick={markChapterRead}
          >
            {t("bible.markRead", language)}
          </Button>

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
            {verses.map((v) => {
              const highlights = highlightsByVerse.get(v.verse) ?? [];
              const isFav = favoriteVerseSet.has(v.verse);
              return (
                <div
                  key={v.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onVerseTap(v.verse)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onVerseTap(v.verse);
                  }}
                  onMouseUp={(e) => onTextSelect(v.verse, e)}
                  onTouchEnd={(e) => onTextSelect(v.verse, e)}
                  onPointerDown={() => {
                    longPressTimer.current = setTimeout(() => {
                      toggleFavorite(v.verse);
                    }, 500);
                  }}
                  onPointerUp={() => {
                    if (longPressTimer.current) clearTimeout(longPressTimer.current);
                  }}
                  onPointerLeave={() => {
                    if (longPressTimer.current) clearTimeout(longPressTimer.current);
                  }}
                  className={cn(
                    "relative w-full select-text rounded-xl border px-3 py-3 text-left transition-colors",
                    inRange(v.verse)
                      ? "border-primary/50 bg-primary/10"
                      : "border-transparent bg-card/60 hover:bg-card",
                  )}
                >
                  {isFav ? (
                    <Heart className="absolute right-3 top-3 h-4 w-4 fill-primary text-primary" />
                  ) : null}
                  <span className="mr-2 text-xs font-medium text-primary">
                    {v.verse}
                  </span>
                  {viewMode !== "en" ? (
                    <p className="mm-text text-[15px] text-foreground/95">
                      {renderHighlighted(v.text_mm, highlights)}
                    </p>
                  ) : null}
                  {viewMode !== "mm" ? (
                    <p
                      className={cn(
                        "text-[15px] leading-relaxed text-foreground/90",
                        viewMode === "both" && "mt-1 text-muted-foreground",
                      )}
                    >
                      {renderHighlighted(v.text_en, highlights)}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

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
              <p className="mt-1 text-3xl font-semibold">
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
              return (
                <div
                  key={key}
                  className={cn(
                    "flex min-h-11 items-center justify-center rounded-lg text-sm",
                    sessionDates.has(key) && "bg-primary/20 text-primary",
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
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4">
            {partner ? (
              <UserAvatar
                userId={partner.id}
                displayName={partner.display_name}
                avatarUrl={partner.avatar_url}
                size={56}
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-semibold">{partnerName}</h2>
              <span className="mt-1 inline-flex rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
                {partnerStreaks.current} {t("bible.days", language)}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">
                {t("bible.chaptersRead", language)}
              </p>
              <p className="mt-1 text-3xl font-semibold text-primary">
                {partnerChapterCount}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">
                {t("bible.currentStreak", language)}
              </p>
              <p className="mt-1 text-3xl font-semibold">{partnerStreaks.current}</p>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              {t("bible.last30Days", language)}
            </h3>
            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: "repeat(10, minmax(0, 1fr))" }}
            >
              {last30.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                return (
                  <div
                    key={key}
                    title={key}
                    className={cn(
                      "aspect-square rounded-md",
                      partnerSessionDates.has(key)
                        ? "bg-primary/70"
                        : "bg-muted/60",
                    )}
                  />
                );
              })}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                {tf("bible.sharedNotesBy", language, { name: partnerName })}
              </h3>
              {partnerSharedNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {tf("bible.emptyPartner", language, { name: partnerName })}
                </p>
              ) : (
                <ul className="space-y-2">
                  {partnerSharedNotes.map((n) => (
                    <li
                      key={n.id}
                      className="rounded-xl border border-border bg-card p-3"
                    >
                      <p className="text-xs text-primary">
                        {language === "mm" ? n.book_name_mm : n.book_name_en}{" "}
                        {n.chapter}:{n.verse_start}–{n.verse_end}
                      </p>
                      <p className="mt-1 line-clamp-3 text-sm">{n.reflection}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {format(new Date(n.created_at), "MMM d, yyyy")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                {tf("bible.sharedFavoritesBy", language, { name: partnerName })}
              </h3>
              {partnerSharedFavorites.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("common.empty", language)}
                </p>
              ) : (
                <ul className="space-y-2">
                  {partnerSharedFavorites.map((f) => (
                    <li key={f.id}>
                      <button
                        type="button"
                        className="w-full rounded-xl border border-border bg-card p-3 text-left"
                        onClick={() => {
                          setTab("read");
                          navigateChapter(f.book_id, f.chapter);
                        }}
                      >
                        <p className="text-xs text-primary">
                          {language === "mm" ? f.book_name_mm : f.book_name_en}{" "}
                          {f.chapter}:{f.verse}
                          {f.kind === "favorite" ? " ♥" : ""}
                        </p>
                        {f.highlighted_text ? (
                          <p className="mt-1 text-sm">{f.highlighted_text}</p>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "favorites" ? (
        <div className="space-y-3">
          {myFavorites.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("bible.emptyFavorites", language)}
            </p>
          ) : (
            myFavorites.map((f) => {
              const book = books.find((b) => b.id === f.book_id);
              return (
                <div
                  key={f.id}
                  className="flex items-start gap-2 rounded-xl border border-border bg-card p-3"
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      setTab("read");
                      navigateChapter(f.book_id, f.chapter);
                    }}
                  >
                    <p className="text-xs text-primary">
                      {language === "mm" ? book?.name_mm : book?.name_en} {f.chapter}:
                      {f.verse}
                      {f.kind === "favorite" ? " · ♥" : " · highlight"}
                    </p>
                    <p className="mt-1 text-sm">
                      {f.highlighted_text ?? t("bible.favorite", language)}
                    </p>
                  </button>
                  <Button
                    variant="ghost"
                    className="min-h-11 shrink-0"
                    onClick={() => removeFavorite(f.id)}
                  >
                    {t("bible.removeFavorite", language)}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      ) : null}

      {selectionBar ? (
        <div
          className="fixed z-50 flex -translate-x-1/2 gap-1 rounded-full border border-border bg-card p-1 shadow-xl"
          style={{ left: selectionBar.x, top: selectionBar.y }}
        >
          <Button
            size="sm"
            className="min-h-11 rounded-full"
            onClick={() =>
              saveHighlight(selectionBar.verse, selectionBar.text, false)
            }
          >
            {t("bible.highlight", language)}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="min-h-11 rounded-full"
            onClick={() =>
              saveHighlight(selectionBar.verse, selectionBar.text, true)
            }
          >
            {tf("common.shareWithName", language, { name: partnerName })}
          </Button>
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
            {tf("common.shareWithName", language, { name: partnerName })}
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
