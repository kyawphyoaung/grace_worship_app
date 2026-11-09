"use client";

import { parseChordLyrics, transposeLyrics } from "@/lib/music/transpose";
import { cn } from "@/lib/utils";

export function ChordLyrics({
  lyrics,
  fromKey,
  toKey,
  className,
  mm = false,
}: {
  lyrics: string;
  fromKey?: string | null;
  toKey?: string | null;
  className?: string;
  mm?: boolean;
}) {
  const source =
    fromKey && toKey && fromKey !== toKey
      ? transposeLyrics(lyrics, fromKey, toKey)
      : lyrics;

  const lines = parseChordLyrics(source);

  return (
    <div
      className={cn(
        "space-y-1 font-mono text-[15px] leading-snug",
        mm && "mm-text font-sans",
        className,
      )}
    >
      {lines.map((segments, lineIdx) => {
        const hasChords = segments.some((s) => s.kind === "chord");
        if (!hasChords) {
          const text = segments.map((s) => (s.kind === "text" ? s.text : s.text)).join("");
          return (
            <p key={lineIdx} className="min-h-[1.25em] whitespace-pre-wrap">
              {text || "\u00A0"}
            </p>
          );
        }

        return (
          <div key={lineIdx} className="flex flex-wrap items-end">
            {segments.map((seg, i) => {
              if (seg.kind === "text") {
                return (
                  <span key={i} className="whitespace-pre-wrap">
                    {seg.text}
                  </span>
                );
              }
              return (
                <span
                  key={i}
                  className="inline-flex flex-col items-start whitespace-pre-wrap"
                >
                  <span className="chord-label mb-0.5 text-[12px] font-bold leading-none text-primary">
                    {seg.chord || "\u00A0"}
                  </span>
                  <span className="leading-tight">{seg.text || "\u00A0"}</span>
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
