"use client";

import { X } from "lucide-react";
import { t, type Language } from "@/lib/i18n";
import { songTimeSignature, songTitle } from "@/lib/worship/constants";
import { ChordLyrics } from "@/components/worship/chord-lyrics";
import type { Database } from "@/types/database";
import type { SetlistItemView } from "@/components/worship/setlist-planner";

type SongSection = Database["public"]["Tables"]["song_sections"]["Row"];

export function RehearsalMode({
  language,
  open,
  onClose,
  items,
  sectionsBySong,
  eventName,
}: {
  language: Language;
  open: boolean;
  onClose: () => void;
  items: SetlistItemView[];
  sectionsBySong: Map<string, SongSection[]>;
  eventName: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-gradient-to-b from-[#140f22] via-[#1a1230] to-[#0f1f24]">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-primary/20 bg-[#140f22]/90 px-4 py-3 backdrop-blur-md">
        <div className="min-w-0">
          <p className="truncate text-xs uppercase tracking-[0.18em] text-primary/80">
            {t("worship.startRehearsal", language)}
          </p>
          <p className="truncate text-sm font-semibold text-foreground">
            {eventName}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border bg-card/80 text-foreground"
          aria-label={t("worship.exitRehearsal", language)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-auto max-w-2xl space-y-10 px-4 py-8 pb-24">
        {items.map((item) => {
          const sections = [...(sectionsBySong.get(item.song_id) ?? [])].sort(
            (a, b) => a.section_order - b.section_order,
          );
          const title = songTitle(item.song, language === "mm" ? "mm" : "en");
          const fromKey = item.song.default_key || "C";
          const toKey = item.key_override || fromKey;
          const timeSig = songTimeSignature(item.song);

          return (
            <article key={item.id} className="space-y-5">
              <header className="border-b border-primary/25 pb-3">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
                  {item.position}
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                  {title}
                </h2>
                <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {item.song.author ? <span>{item.song.author}</span> : null}
                  <span>
                    {t("worship.key", language)} {toKey}
                  </span>
                  <span>{timeSig}</span>
                  {item.song.bpm != null ? (
                    <span>
                      {item.song.bpm} {t("worship.bpm", language)}
                    </span>
                  ) : null}
                </div>
              </header>

              {sections.map((section) => (
                <section key={section.id} className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                    [{section.label || section.section_type}]
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {section.lyrics_mm ? (
                      <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-teal-300/90">
                          MM
                        </p>
                        <ChordLyrics
                          lyrics={section.lyrics_mm}
                          fromKey={fromKey}
                          toKey={toKey}
                          mm
                        />
                      </div>
                    ) : null}
                    {section.lyrics_en ? (
                      <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-fuchsia-300/90">
                          EN
                        </p>
                        <ChordLyrics
                          lyrics={section.lyrics_en}
                          fromKey={fromKey}
                          toKey={toKey}
                        />
                      </div>
                    ) : null}
                  </div>
                  {section.notes ? (
                    <p className="rounded-xl border border-accent/25 bg-accent/10 px-3 py-2 text-sm text-accent">
                      {section.notes}
                    </p>
                  ) : null}
                </section>
              ))}

              {item.transition_note ? (
                <p className="rounded-xl border border-dashed border-primary/35 bg-primary/10 px-3 py-2 text-sm text-primary">
                  → {item.transition_note}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
