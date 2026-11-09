"use client";

import { useMemo, useState } from "react";
import { t, type Language } from "@/lib/i18n";
import { Segmented } from "@/components/ui/segmented";
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

type Tab = "songs" | "events";

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
  const [tab, setTab] = useState<Tab>("songs");
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
          onBack={() => {
            setActiveEventId(null);
            setTab("events");
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {t("worship.title", language)}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("worship.subtitle", language)}
        </p>
      </header>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "songs", label: t("worship.songs", language) },
          { value: "events", label: t("worship.events", language) },
        ]}
      />

      {tab === "songs" ? (
        <SongLibrary
          language={language}
          userId={userId}
          songs={songs}
          sections={sections}
        />
      ) : (
        <EventsPanel
          language={language}
          userId={userId}
          events={events}
          setlistCounts={setlistCounts}
          onOpenEvent={(id) => setActiveEventId(id)}
        />
      )}
    </div>
  );
}
