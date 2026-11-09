"use client";

import { useEffect } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Printer, X } from "lucide-react";
import { t, type Language } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ChordLyrics } from "@/components/worship/chord-lyrics";
import { songTimeSignature, songTitle } from "@/lib/worship/constants";
import type { Database } from "@/types/database";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type Song = Database["public"]["Tables"]["songs"]["Row"];
type SongSection = Database["public"]["Tables"]["song_sections"]["Row"];
type SetlistItem = Database["public"]["Tables"]["setlist_items"]["Row"];

type PrintItem = SetlistItem & { song: Song };

export function PrintChart({
  language,
  event,
  items,
  sectionsBySong,
  mode,
}: {
  language: Language;
  event: EventRow;
  items: PrintItem[];
  sectionsBySong: Map<string, SongSection[]>;
  mode: "original" | "override";
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.print();
    }, 350);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="print-toolbar sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{event.event_name}</p>
          <p className="text-xs text-muted-foreground">
            {mode === "override"
              ? t("worship.exportOverrideKey", language)
              : t("worship.exportOriginalKey", language)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            className="min-h-11"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            {t("worship.print", language)}
          </Button>
          <Button asChild type="button" variant="outline" className="min-h-11">
            <Link href="/worship">
              <X className="h-4 w-4" />
              {t("common.close", language)}
            </Link>
          </Button>
        </div>
      </div>

      <article className="print-chart mx-auto max-w-3xl px-5 py-8 text-foreground print:max-w-none print:px-0 print:py-0 print:text-black">
        <header className="mb-8 border-b-2 border-primary pb-4 print:border-black">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary print:text-black">
            Grace · Worship Chart
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {event.event_name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground print:text-neutral-700">
            {format(parseISO(event.event_date), "EEEE, MMM d, yyyy")}
            {" · "}
            {mode === "override"
              ? t("worship.overrideKeysLabel", language)
              : t("worship.originalKeysLabel", language)}
            {" · "}
            {items.length} {t("worship.songs", language).toLowerCase()}
          </p>
        </header>

        <div className="space-y-10">
          {items.map((item) => {
            const sections = [
              ...(sectionsBySong.get(item.song_id) ?? []),
            ].sort((a, b) => a.section_order - b.section_order);
            const title = songTitle(
              item.song,
              language === "mm" ? "mm" : "en",
            );
            const secondary =
              language === "mm" ? item.song.title_en : item.song.title_mm;
            const fromKey = item.song.default_key || "C";
            const toKey =
              mode === "override" && item.key_override
                ? item.key_override
                : fromKey;
            const timeSig = songTimeSignature(item.song);

            return (
              <section
                key={item.id}
                className="break-inside-avoid space-y-4 border-b border-border/70 pb-8 print:border-neutral-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold">
                      <span className="mr-2 text-primary print:text-black">
                        {item.position}.
                      </span>
                      {title}
                    </h2>
                    {secondary && secondary !== title ? (
                      <p className="mt-0.5 text-sm text-muted-foreground mm-text print:text-neutral-700">
                        {secondary}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right text-sm font-medium text-muted-foreground print:text-neutral-800">
                    <p>
                      {t("worship.key", language)} {toKey}
                    </p>
                    <p>{timeSig}</p>
                  </div>
                </div>

                {sections.map((section) => (
                  <div key={section.id} className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary print:text-black">
                      [{section.label || section.section_type}]
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
                      {section.lyrics_mm ? (
                        <div>
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-teal-600 print:text-neutral-600">
                            MM
                          </p>
                          <ChordLyrics
                            lyrics={section.lyrics_mm}
                            fromKey={fromKey}
                            toKey={toKey}
                            mm
                            className="print-chords text-[15px] leading-relaxed text-foreground print:font-sans print:text-black"
                          />
                        </div>
                      ) : null}
                      {section.lyrics_en ? (
                        <div>
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-600 print:text-neutral-600">
                            EN
                          </p>
                          <ChordLyrics
                            lyrics={section.lyrics_en}
                            fromKey={fromKey}
                            toKey={toKey}
                            className="print-chords text-[15px] leading-relaxed text-foreground print:text-black"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}

                {item.transition_note ? (
                  <p className="text-sm italic text-primary print:text-neutral-700">
                    → {item.transition_note}
                  </p>
                ) : null}
              </section>
            );
          })}
        </div>
      </article>
    </>
  );
}
