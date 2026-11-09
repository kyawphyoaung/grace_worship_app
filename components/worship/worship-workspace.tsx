"use client";

import { useMemo, useState } from "react";
import { Music2, X } from "lucide-react";
import { t, type Language } from "@/lib/i18n";
import { SongLibrary } from "@/components/worship/song-library";
import { EventsPanel } from "@/components/worship/events-panel";
import { EventDetail } from "@/components/worship/event-detail";
import type { SetlistItemView } from "@/components/worship/setlist-planner";
import type { Database } from "@/types/database";

type Song = Database["public"]["Tables"]["songs"]["Row"];
type SongSection = Database["public"]["Tables"]["song_sections"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];
type Setlist = Database["public"]["Tables"]["setlists"]["Row"];
type SetlistItem = Database["public"]["Tables"]["setlist_items"]["Row"];
type EventPrayer = Database["public"]["Tables"]["event_prayers"]["Row"];
type EventFeedback = Database["public"]["Tables"]["event_feedback"]["Row"];
type MinistryReflection =
  Database["public"]["Tables"]["ministry_reflections"]["Row"];

export function WorshipWorkspace({
  language,
  userId,
  songs,
  sections,
  events,
  setlists,
  setlistItems,
  prayers,
  feedback,
  reflections,
}: {
  language: Language;
  userId: string;
  songs: Song[];
  sections: SongSection[];
  events: EventRow[];
  setlists: Setlist[];
  setlistItems: SetlistItem[];
  prayers: EventPrayer[];
  feedback: EventFeedback[];
  reflections: MinistryReflection[];
}) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  const songsById = useMemo(() => {
    const map = new Map<string, Song>();
    for (const s of songs) map.set(s.id, s);
    return map;
  }, [songs]);

  const setlistByEvent = useMemo(() => {
    const map = new Map<string, Setlist>();
    for (const s of setlists) map.set(s.event_id, s);
    return map;
  }, [setlists]);

  const itemsBySetlist = useMemo(() => {
    const map = new Map<string, SetlistItem[]>();
    for (const item of setlistItems) {
      const list = map.get(item.setlist_id) ?? [];
      list.push(item);
      map.set(item.setlist_id, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.position - b.position);
    }
    return map;
  }, [setlistItems]);

  const setlistCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const event of events) {
      const setlist = setlistByEvent.get(event.id);
      counts[event.id] = setlist
        ? (itemsBySetlist.get(setlist.id) ?? []).length
        : 0;
    }
    return counts;
  }, [events, setlistByEvent, itemsBySetlist]);

  const activeEvent = activeEventId
    ? (events.find((e) => e.id === activeEventId) ?? null)
    : null;

  if (activeEvent) {
    const setlist = setlistByEvent.get(activeEvent.id) ?? null;
    const rawItems = setlist ? (itemsBySetlist.get(setlist.id) ?? []) : [];
    const items: SetlistItemView[] = rawItems
      .map((item) => {
        const song = songsById.get(item.song_id);
        if (!song) return null;
        return { ...item, song };
      })
      .filter((x): x is SetlistItemView => x !== null);

    return (
      <div className="mx-auto max-w-2xl">
        <EventDetail
          language={language}
          userId={userId}
          event={activeEvent}
          songs={songs}
          sections={sections}
          setlist={setlist}
          items={items}
          prayers={prayers.filter((p) => p.event_id === activeEvent.id)}
          feedback={feedback.filter((f) => f.event_id === activeEvent.id)}
          reflections={reflections.filter(
            (r) => r.event_id === activeEvent.id,
          )}
          onBack={() => setActiveEventId(null)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {t("worship.events", language)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("worship.subtitle", language)}
          </p>
        </div>
        <button
          type="button"
          aria-label={t("worship.openLibrary", language)}
          onClick={() => setLibraryOpen(true)}
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-gradient-to-br from-card to-primary/15 text-primary shadow-[0_0_24px_-12px_hsl(var(--primary))]"
        >
          <Music2 className="h-5 w-5" />
        </button>
      </header>

      <EventsPanel
        language={language}
        userId={userId}
        events={events}
        setlistCounts={setlistCounts}
        onOpenEvent={(id) => setActiveEventId(id)}
      />

      {libraryOpen ? (
        <div className="fixed inset-0 z-[60] flex flex-col bg-gradient-to-b from-[#140f22] via-[#1a1230] to-[#0f1f24]">
          <div className="flex items-center justify-between gap-3 border-b border-primary/20 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-primary/80">
                {t("worship.songLibrary", language)}
              </p>
              <h2 className="text-lg font-semibold">
                {t("worship.songs", language)}
              </h2>
            </div>
            <button
              type="button"
              aria-label={t("common.close", language)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border bg-card/80"
              onClick={() => setLibraryOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 py-4 pb-28">
            <SongLibrary
              language={language}
              userId={userId}
              songs={songs}
              sections={sections}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
