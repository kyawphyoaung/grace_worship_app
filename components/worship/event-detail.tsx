"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Download, Play } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { t, type Language } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  SetlistPlanner,
  type SetlistItemView,
} from "@/components/worship/setlist-planner";
import { RehearsalMode } from "@/components/worship/rehearsal-mode";
import { EventFeed } from "@/components/worship/event-feed";
import {
  EventChartDocument,
  ensurePdfFonts,
  type PdfSongItem,
} from "@/lib/pdf/event-chart";
import { songTimeSignature } from "@/lib/worship/constants";
import { transposeLyrics } from "@/lib/music/transpose";
import type { Database } from "@/types/database";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type Song = Database["public"]["Tables"]["songs"]["Row"];
type SongSection = Database["public"]["Tables"]["song_sections"]["Row"];
type Setlist = Database["public"]["Tables"]["setlists"]["Row"];
type EventPrayer = Database["public"]["Tables"]["event_prayers"]["Row"];
type EventFeedback = Database["public"]["Tables"]["event_feedback"]["Row"];
type MinistryReflection =
  Database["public"]["Tables"]["ministry_reflections"]["Row"];

export function EventDetail({
  language,
  userId,
  event,
  songs,
  sections,
  setlist,
  items,
  prayers,
  feedback,
  reflections,
  onBack,
}: {
  language: Language;
  userId: string;
  event: EventRow;
  songs: Song[];
  sections: SongSection[];
  setlist: Setlist | null;
  items: SetlistItemView[];
  prayers: EventPrayer[];
  feedback: EventFeedback[];
  reflections: MinistryReflection[];
  onBack: () => void;
}) {
  const { showToast } = useToast();
  const [rehearsal, setRehearsal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const sectionsBySong = useMemo(() => {
    const map = new Map<string, SongSection[]>();
    for (const s of sections) {
      const list = map.get(s.song_id) ?? [];
      list.push(s);
      map.set(s.song_id, list);
    }
    return map;
  }, [sections]);

  const roleLabel = (role: string) => {
    if (role === "leader") return t("worship.roleLeader", language);
    if (role === "backup") return t("worship.roleBackup", language);
    return t("worship.roleParticipant", language);
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "sunday":
        return t("worship.typeSunday", language);
      case "saturday":
        return t("worship.typeSaturday", language);
      case "wednesday":
        return t("worship.typeWednesday", language);
      default:
        return t("worship.typeCustom", language);
    }
  };

  const exportPdf = async () => {
    setExporting(true);
    try {
      ensurePdfFonts();
      const pdfItems: PdfSongItem[] = items.map((item) => {
        const fromKey = item.song.default_key || "C";
        const toKey = item.key_override || fromKey;
        return {
          position: item.position,
          key: toKey,
          time_signature: songTimeSignature(item.song),
          transition_note: item.transition_note,
          song: {
            title_en: item.song.title_en,
            title_mm: item.song.title_mm,
            author: item.song.author,
            default_key: item.song.default_key,
            bpm: item.song.bpm,
          },
          sections: [...(sectionsBySong.get(item.song_id) ?? [])]
            .sort((a, b) => a.section_order - b.section_order)
            .map((s) => ({
              label: s.label,
              section_type: s.section_type,
              lyrics_mm: s.lyrics_mm
                ? transposeLyrics(s.lyrics_mm, fromKey, toKey)
                : null,
              lyrics_en: s.lyrics_en
                ? transposeLyrics(s.lyrics_en, fromKey, toKey)
                : null,
            })),
        };
      });

      const blob = await pdf(
        <EventChartDocument
          event={{
            event_name: event.event_name,
            event_date: event.event_date,
          }}
          items={pdfItems}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${event.event_name.replace(/\s+/g, "-").toLowerCase()}-chart.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(t("worship.pdfReady", language));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "PDF failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common.back", language)}
      </button>

      <header className="overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-card via-secondary/40 to-primary/10 p-5 shadow-[0_0_40px_-18px_hsl(var(--primary))]">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">
          {typeLabel(event.event_type)} · {roleLabel(event.role)}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          {event.event_name}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {format(parseISO(event.event_date), "EEEE, MMM d, yyyy")}
        </p>
        {event.notes ? (
          <p className="mt-3 text-sm text-foreground/90">{event.notes}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            className="min-h-11"
            disabled={items.length === 0}
            onClick={() => setRehearsal(true)}
          >
            <Play className="h-4 w-4" />
            {t("worship.startRehearsal", language)}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-11"
            disabled={items.length === 0 || exporting}
            onClick={() => void exportPdf()}
          >
            <Download className="h-4 w-4" />
            {exporting
              ? t("worship.exporting", language)
              : t("worship.exportPdf", language)}
          </Button>
        </div>
      </header>

      <SetlistPlanner
        language={language}
        userId={userId}
        eventId={event.id}
        setlist={setlist}
        items={items}
        songs={songs}
      />

      <EventFeed
        language={language}
        userId={userId}
        event={event}
        prayers={prayers}
        feedback={feedback}
        reflections={reflections}
      />

      <RehearsalMode
        language={language}
        open={rehearsal}
        onClose={() => setRehearsal(false)}
        items={items}
        sectionsBySong={sectionsBySong}
        eventName={event.event_name}
      />
    </div>
  );
}
