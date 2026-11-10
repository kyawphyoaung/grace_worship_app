"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { format, eachDayOfInterval, subDays } from "date-fns";
import { Flame, Heart, Search, UserRound } from "lucide-react";
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
import { BibleLanguagePicker } from "@/components/bible/bible-language-picker";
import {
  BIBLE_VERSION_BADGE,
  type BibleVersion,
} from "@/lib/config";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Book = Database["public"]["Tables"]["bible_books"]["Row"];
type Verse = Database["public"]["Tables"]["bible_verses"]["Row"];
type Note = Database["public"]["Tables"]["bible_study_notes"]["Row"];
type Session = Database["public"]["Tables"]["bible_study_sessions"]["Row"];
type Favorite = Database["public"]["Tables"]["bible_favorites"]["Row"];

export type FavoriteCard = Favorite & {
  book_name_en?: string;
  book_name_mm?: string;
  book_name_chin?: string | null;
  text_mm?: string | null;
  text_en?: string | null;
  text_chin?: string | null;
  text_kjv?: string | null;
};

type Tab = "read" | "search" | "streaks" | "partner" | "favorites";

type SelectionBar = {
  verse: number;
  text: string;
  x: number;
  y: number;
};

type ResolvedVersion = {
  version: BibleVersion;
  text: string;
  fellBack: boolean;
  badge: string;
};

function resolveVersionTexts(
  verse: Pick<Verse, "text_mm" | "text_en" | "text_chin" | "text_kjv">,
  versions: BibleVersion[],
): ResolvedVersion[] {
  return versions.map((version) => {
    if (version === "mm") {
      return {
        version,
        text: verse.text_mm,
        fellBack: false,
        badge: BIBLE_VERSION_BADGE.mm,
      };
    }
    if (version === "en") {
      return {
        version,
        text: verse.text_en,
        fellBack: false,
        badge: BIBLE_VERSION_BADGE.en,
      };
    }
    if (version === "kjv") {
      const kjv = verse.text_kjv?.trim();
      if (kjv) {
        return {
          version,
          text: kjv,
          fellBack: false,
          badge: BIBLE_VERSION_BADGE.kjv,
        };
      }
      return {
        version,
        text: verse.text_en,
        fellBack: true,
        badge: BIBLE_VERSION_BADGE.en,
      };
    }
    const chin = verse.text_chin?.trim();
    if (chin) {
      return {
        version,
        text: chin,
        fellBack: false,
        badge: BIBLE_VERSION_BADGE.chin,
      };
    }
    return {
      version,
      text: verse.text_mm,
      fellBack: true,
      badge: BIBLE_VERSION_BADGE.mm,
    };
  });
}

function bookLabel(
  book: Book | undefined,
  language: Language,
  versions: BibleVersion[],
) {
  if (!book) return "";
  if (versions.includes("chin") && book.name_chin?.trim()) return book.name_chin;
  return language === "mm" ? book.name_mm : book.name_en;
}

export function BibleWorkspace({
  language,
  userId,
  books,
  initialBookId,
  initialChapter,
  initialVerse,
  initialVersions,
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
  initialVerse: number | null;
  initialVersions: BibleVersion[];
  verses: Verse[];
  chapterCount: number;
  myNotes: Note[];
  mySessions: Session[];
  partnerSessions: Session[];
  partnerSharedNotes: (Note & { book_name_en?: string; book_name_mm?: string })[];
  myFavorites: FavoriteCard[];
  partnerSharedFavorites: FavoriteCard[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { me, partner, partnerName, myName } = useCouple();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>("read");
  const [versions, setVersions] = useState<BibleVersion[]>(
    initialVersions.length > 0 ? initialVersions : ["mm", "en"],
  );
  const [langOpen, setLangOpen] = useState(false);
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
  const [selectionBar, setSelectionBar] = useState<SelectionBar | null>(null);
  const [showStickyMark, setShowStickyMark] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markTopRef = useRef<HTMLButtonElement | null>(null);
  const verseRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    setBookId(initialBookId ?? "");
    setChapter(initialChapter);
  }, [initialBookId, initialChapter]);

  useEffect(() => {
    if (initialVerse == null) return;
    const el = verseRefs.current.get(initialVerse);
    if (!el) return;
    const id = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => window.clearTimeout(id);
  }, [initialVerse, verses, bookId, chapter]);

  useEffect(() => {
    if (tab !== "read") {
      setShowStickyMark(false);
      return;
    }
    const el = markTopRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyMark(!entry.isIntersecting);
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [tab, bookId, chapter]);

  const persistVersions = (next: BibleVersion[]) => {
    if (next.length === 0) return;
    setVersions(next);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ preferred_bible_languages: next })
        .eq("id", userId);
      if (error) showToast(error.message);
    });
  };

  const bookOptions = useMemo(
    () =>
      books.map((b) => ({
        value: b.id,
        label: bookLabel(b, language, versions),
        searchText: `${b.name_mm} ${b.name_en} ${b.name_chin ?? ""} ${b.abbreviation}`,
      })),
    [books, language, versions],
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

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const s of mySessions) {
      const list = map.get(s.session_date) ?? [];
      list.push(s);
      map.set(s.session_date, list);
    }
    return map;
  }, [mySessions]);

  const chaptersByDate = useMemo(() => {
    const map = new Map<string, { bookId: string; chapter: number; label: string }[]>();
    for (const [date, sessions] of sessionsByDate) {
      const seen = new Set<string>();
      const entries: { bookId: string; chapter: number; label: string }[] = [];
      for (const s of sessions) {
        const key = `${s.book_id}:${s.chapter}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const book = books.find((b) => b.id === s.book_id);
        entries.push({
          bookId: s.book_id,
          chapter: s.chapter,
          label: `${bookLabel(book, language, versions)} ${s.chapter}`,
        });
      }
      map.set(date, entries);
    }
    return map;
  }, [sessionsByDate, books, language, versions]);

  const streakChapterGroups = useMemo(() => {
    return [...chaptersByDate.entries()]
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, 40);
  }, [chaptersByDate]);

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

  const navigateChapter = (
    nextBookId: string,
    nextChapter: number,
    verse?: number,
  ) => {
    setBookId(nextBookId);
    setChapter(nextChapter);
    setRangeStart(null);
    setRangeEnd(null);
    setSelectionBar(null);
    const verseQs = verse ? `&verse=${verse}` : "";
    router.push(`/bible?book=${nextBookId}&chapter=${nextChapter}${verseQs}`);
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
        .or(
          `text_en.ilike.%${safe}%,text_mm.ilike.%${safe}%,text_chin.ilike.%${safe}%,text_kjv.ilike.%${safe}%`,
        )
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
          text_chin: row.text_chin,
          text_kjv: row.text_kjv,
          book_name_en: row.bible_books?.name_en ?? "",
          book_name_mm: row.bible_books?.name_mm ?? "",
        })),
      );
      setSearching(false);
    });
  };

  const renderHighlighted = (full: string, highlights: Favorite[]) => {
    if (!highlights.length) return full;
    let nodes: ReactNode[] = [full];
    for (const h of highlights) {
      const needle = h.highlighted_text;
      if (!needle) continue;
      nodes = nodes.flatMap((node, idx) => {
        if (typeof node !== "string") return [node];
        const parts = node.split(needle);
        if (parts.length === 1) return [node];
        const out: ReactNode[] = [];
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

  const favoriteSnippet = (f: FavoriteCard) => {
    if (f.highlighted_text?.trim()) return f.highlighted_text.trim();
    const resolved = resolveVersionTexts(
      {
        text_mm: f.text_mm ?? "",
        text_en: f.text_en ?? "",
        text_chin: f.text_chin ?? null,
        text_kjv: f.text_kjv ?? null,
      },
      versions,
    );
    const text = resolved.map((r) => r.text.trim()).filter(Boolean).join(" / ");
    if (!text) return t("bible.favorite", language);
    return text.length > 160 ? `${text.slice(0, 160)}…` : text;
  };

  const openFavorite = (f: FavoriteCard) => {
    setTab("read");
    navigateChapter(f.book_id, f.chapter, f.verse);
  };

  const partnerSessionDates = useMemo(
    () => new Set(partnerSessions.map((s) => s.session_date)),
    [partnerSessions],
  );

  if (books.length === 0) {
    return <p className="text-muted-foreground">{t("bible.noBooks", language)}</p>;
  }

  const last30 = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });
  const partnerChapterCount = new Set(
    partnerSessions.map((s) => `${s.book_id}:${s.chapter}`),
  ).size;

  const myChapterCount = new Set(
    mySessions.map((s) => `${s.book_id}:${s.chapter}`),
  ).size;

  const partnerChaptersByDate = useMemo(() => {
    const byDate = new Map<string, Session[]>();
    for (const s of partnerSessions) {
      const list = byDate.get(s.session_date) ?? [];
      list.push(s);
      byDate.set(s.session_date, list);
    }
    const map = new Map<
      string,
      { bookId: string; chapter: number; label: string }[]
    >();
    for (const [date, sessions] of byDate) {
      const seen = new Set<string>();
      const entries: { bookId: string; chapter: number; label: string }[] = [];
      for (const s of sessions) {
        const key = `${s.book_id}:${s.chapter}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const book = books.find((b) => b.id === s.book_id);
        entries.push({
          bookId: s.book_id,
          chapter: s.chapter,
          label: `${bookLabel(book, language, versions)} ${s.chapter}`,
        });
      }
      map.set(date, entries);
    }
    return map;
  }, [partnerSessions, books, language, versions]);

  const partnerChapterGroups = useMemo(() => {
    return [...partnerChaptersByDate.entries()]
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, 40);
  }, [partnerChaptersByDate]);

  const tabOptions: { value: Tab; label: ReactNode }[] = [
    {
      value: "read",
      label: t("bible.read", language),
    },
    {
      value: "search",
      label: (
        <span title={t("bible.search", language)} className="inline-flex items-center">
          <Search className="h-4 w-4" aria-hidden />
          <span className="sr-only">{t("bible.search", language)}</span>
        </span>
      ),
    },
    {
      value: "streaks",
      label: (
        <span title={t("bible.streaks", language)} className="inline-flex items-center">
          <Flame className="h-4 w-4" aria-hidden />
          <span className="sr-only">{t("bible.streaks", language)}</span>
        </span>
      ),
    },
    {
      value: "partner",
      label: (
        <span className="inline-flex max-w-[6.5rem] items-center gap-1.5">
          <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{partnerName}</span>
        </span>
      ),
    },
    {
      value: "favorites",
      label: (
        <span title={t("bible.favorites", language)} className="inline-flex items-center">
          <Heart className="h-4 w-4" aria-hidden />
          <span className="sr-only">{t("bible.favorites", language)}</span>
        </span>
      ),
    },
  ];

  const invitePartner = () => {
    if (!partner) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("notifications").insert({
        user_id: partner.id,
        actor_id: me.id,
        type: "bible_study_invite",
        entity_type: "bible_study",
        entity_id: me.id,
        message: tf("notifications.bibleStudyInvite", language, {
          name: myName,
        }),
      });
      if (error) {
        showToast(error.message);
        return;
      }
      showToast(t("bible.inviteSent", language));
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("bible.title", language)}
        </h1>
        {partner ? (
          <Button
            type="button"
            variant="secondary"
            className="min-h-11"
            disabled={pending}
            onClick={invitePartner}
          >
            {tf("bible.invitePartner", language, { name: partnerName })}
          </Button>
        ) : null}
      </div>

      <Segmented value={tab} onChange={setTab} options={tabOptions} />

      {tab === "read" ? (
        <div className="space-y-4 pb-24">
          <div className="grid grid-cols-2 gap-2">
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

          <div className="flex items-center gap-2">
            <BibleLanguagePicker
              language={language}
              value={versions}
              open={langOpen}
              onOpenChange={setLangOpen}
              onChange={persistVersions}
            />
            <Button
              ref={markTopRef}
              variant="secondary"
              className="min-h-11 flex-1 border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
              disabled={pending || !bookId}
              onClick={markChapterRead}
            >
              {t("bible.markRead", language)}
            </Button>
          </div>

          <div className="space-y-2">
            {verses.map((v) => {
              const highlights = highlightsByVerse.get(v.verse) ?? [];
              const isFav = favoriteVerseSet.has(v.verse);
              const resolved = resolveVersionTexts(v, versions);
              const isFocus = initialVerse === v.verse;
              const multi = resolved.length > 1;
              return (
                <div
                  key={v.id}
                  ref={(node) => {
                    if (node) verseRefs.current.set(v.verse, node);
                    else verseRefs.current.delete(v.verse);
                  }}
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
                    isFocus && "ring-1 ring-primary/50",
                    isFav && "border-primary/20",
                  )}
                >
                  {isFav ? (
                    <Heart className="absolute right-3 top-3 h-4 w-4 fill-primary text-primary" />
                  ) : null}
                  <span className="mr-2 text-xs font-medium text-primary">
                    {v.verse}
                  </span>
                  <div
                    className={cn(
                      "mt-1 gap-3",
                      multi ? "grid sm:grid-cols-2" : "space-y-1",
                    )}
                  >
                    {resolved.map((r) => (
                      <div key={`${v.id}-${r.version}`} className="min-w-0">
                        <span className="mb-1 inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {r.badge}
                          {r.fellBack ? (
                            <span className="opacity-70">
                              ·{" "}
                              {r.version === "chin"
                                ? t("bible.mmFallback", language)
                                : t("bible.kjvFallback", language)}
                            </span>
                          ) : null}
                        </span>
                        <p
                          className={cn(
                            "text-[15px] leading-relaxed text-foreground/95",
                            (r.version === "mm" ||
                              (r.fellBack && r.version === "chin")) &&
                              "mm-text",
                          )}
                        >
                          {renderHighlighted(r.text, highlights)}
                        </p>
                      </div>
                    ))}
                  </div>
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

          {showStickyMark ? (
            <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-30 border-t border-border/80 bg-background/95 px-4 py-2 backdrop-blur md:bottom-0">
              <div className="mx-auto max-w-3xl">
                <Button
                  variant="secondary"
                  className="min-h-11 w-full border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                  disabled={pending || !bookId}
                  onClick={markChapterRead}
                >
                  {t("bible.markRead", language)}
                </Button>
              </div>
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
            {searchResults.map((r) => {
              const resolved = resolveVersionTexts(r, versions);
              return (
                <button
                  key={r.id}
                  type="button"
                  className="w-full rounded-xl border border-border bg-card p-3 text-left"
                  onClick={() => {
                    setTab("read");
                    navigateChapter(r.book_id, r.chapter, r.verse);
                  }}
                >
                  <p className="text-xs text-primary">
                    {language === "mm" ? r.book_name_mm : r.book_name_en} {r.chapter}:
                    {r.verse}
                  </p>
                  <div className="mt-1 space-y-1.5">
                    {resolved.map((v) => (
                      <p
                        key={`${r.id}-${v.version}`}
                        className={cn(
                          "text-sm",
                          (v.version === "mm" ||
                            (v.fellBack && v.version === "chin")) &&
                            "mm-text",
                        )}
                      >
                        <span className="mr-1.5 rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                          {v.badge}
                        </span>
                        {v.text}
                      </p>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {tab === "streaks" ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border card-glow p-4">
            <UserAvatar
              userId={userId}
              displayName={myName}
              avatarUrl={me.avatar_url}
              size={56}
            />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-semibold">{myName}</h2>
              <p className="text-sm text-muted-foreground">
                {t("bible.myProgress", language)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border card-glow p-5">
            <p className="text-sm text-muted-foreground">
              {t("bible.streakGift", language)}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("bible.currentStreak", language)}
                </p>
                <p className="mt-1 text-3xl font-semibold text-primary">
                  {streaks.current}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("bible.bestStreak", language)}
                </p>
                <p className="mt-1 text-3xl font-semibold">{streaks.best}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("bible.chaptersRead", language)}
                </p>
                <p className="mt-1 text-3xl font-semibold text-accent">
                  {myChapterCount}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              {t("bible.chaptersByDate", language)}
            </h2>
            {streakChapterGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("common.empty", language)}
              </p>
            ) : (
              streakChapterGroups.map(([date, entries]) => (
                <div
                  key={date}
                  className="rounded-xl border border-border bg-card p-3"
                >
                  <p className="text-xs font-medium text-primary">
                    {format(new Date(`${date}T12:00:00`), "EEE, MMM d")}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {entries.map((e) => (
                      <li key={`${date}-${e.bookId}-${e.chapter}`}>
                        <button
                          type="button"
                          className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs text-primary"
                          onClick={() => {
                            setTab("read");
                            navigateChapter(e.bookId, e.chapter);
                          }}
                        >
                          {e.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {tab === "partner" ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border card-glow p-4">
            {partner ? (
              <UserAvatar
                userId={partner.id}
                displayName={partnerName}
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

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">
                {t("bible.currentStreak", language)}
              </p>
              <p className="mt-1 text-3xl font-semibold text-primary">
                {partnerStreaks.current}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">
                {t("bible.bestStreak", language)}
              </p>
              <p className="mt-1 text-3xl font-semibold">{partnerStreaks.best}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">
                {tf("bible.chaptersReadBy", language, { name: partnerName })}
              </p>
              <p className="mt-1 text-3xl font-semibold text-accent">
                {partnerChapterCount}
              </p>
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

          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              {tf("bible.chaptersReadBy", language, { name: partnerName })}
            </h2>
            {partnerChapterGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {tf("bible.emptyPartner", language, { name: partnerName })}
              </p>
            ) : (
              partnerChapterGroups.map(([date, entries]) => (
                <div
                  key={date}
                  className="rounded-xl border border-border bg-card p-3"
                >
                  <p className="text-xs font-medium text-primary">
                    {format(new Date(`${date}T12:00:00`), "EEE, MMM d")}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {entries.map((e) => (
                      <li key={`p-${date}-${e.bookId}-${e.chapter}`}>
                        <button
                          type="button"
                          className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs text-primary"
                          onClick={() => {
                            setTab("read");
                            navigateChapter(e.bookId, e.chapter);
                          }}
                        >
                          {e.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
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
                        onClick={() => openFavorite(f)}
                      >
                        <p className="text-xs text-primary">
                          {language === "mm" ? f.book_name_mm : f.book_name_en}{" "}
                          {f.chapter}:{f.verse}
                          {f.kind === "favorite" ? " ♥" : ""}
                        </p>
                        <p className="mt-1 line-clamp-3 text-sm">
                          {favoriteSnippet(f)}
                        </p>
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
              const ref = `${bookLabel(book, language, versions)} ${f.chapter}:${f.verse}`;
              return (
                <div
                  key={f.id}
                  className="rounded-2xl border border-border bg-card p-4 shadow-[0_0_24px_-18px_hsl(var(--primary))]"
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => openFavorite(f)}
                  >
                    <p
                      className={cn(
                        "line-clamp-4 text-[15px] leading-relaxed",
                        versions.includes("mm") && "mm-text",
                      )}
                    >
                      {favoriteSnippet(f)}
                    </p>
                    <p className="mt-3 text-xs font-medium text-primary">
                      {ref}
                      {f.kind === "favorite" ? " · ♥" : " · highlight"}
                    </p>
                  </button>
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="ghost"
                      className="min-h-11"
                      onClick={() => removeFavorite(f.id)}
                    >
                      {t("bible.removeFavorite", language)}
                    </Button>
                  </div>
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
