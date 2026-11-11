"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { deleteSong } from "@/lib/actions/worship";
import { t, type Language } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { SongForm } from "@/components/worship/song-form";
import { ChordLyrics } from "@/components/worship/chord-lyrics";
import { songTimeSignature, songTitle } from "@/lib/worship/constants";
import { youtubeEmbedUrl } from "@/lib/youtube";
import type { Database } from "@/types/database";

type Song = Database["public"]["Tables"]["songs"]["Row"];
type SongSection = Database["public"]["Tables"]["song_sections"]["Row"];

export function SongPreview({
  language,
  userId,
  song,
  sections,
  backHref = "/worship?library=1",
}: {
  language: Language;
  userId: string;
  song: Song;
  sections: SongSection[];
  backHref?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  const title = songTitle(song, language === "mm" ? "mm" : "en");
  const secondary =
    language === "mm" ? song.title_en : song.title_mm;
  const embedUrl = youtubeEmbedUrl(song.youtube_url);
  const orderedSections = [...sections].sort(
    (a, b) => a.section_order - b.section_order,
  );

  const remove = () => {
    if (!window.confirm(t("worship.deleteSongConfirm", language))) return;
    startTransition(async () => {
      const { error } = await deleteSong(song.id);
      if (error) {
        showToast(error);
        return;
      }
      showToast(t("worship.songDeleted", language));
      setEditing(false);
      router.replace(backHref);
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="sticky top-0 z-20 -mx-4 border-b border-border/70 bg-background/90 px-4 pb-3 pt-1 backdrop-blur-md md:-mx-8 md:px-8">
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11 shrink-0"
          >
            <Link href={backHref} aria-label={t("common.back", language)}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-foreground">
              {title}
            </p>
            {secondary && secondary !== title ? (
              <p className="truncate text-sm text-muted-foreground mm-text">
                {secondary}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            className="min-h-11 shrink-0"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-4 w-4" />
            {t("common.edit", language)}
          </Button>
        </div>
      </div>

      {embedUrl ? (
        <div className="sticky top-[4.25rem] z-10 overflow-hidden rounded-xl border border-border/70 bg-black shadow-[0_0_32px_-16px_hsl(var(--primary)/0.5)]">
          <div className="aspect-video w-full">
            <iframe
              src={embedUrl}
              title={title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-1">
        {song.author ? (
          <p className="text-sm text-muted-foreground">{song.author}</p>
        ) : null}
        <div className="flex flex-wrap gap-2 text-xs">
          {song.default_key ? (
            <Badge variant="secondary" className="font-normal">
              {t("worship.key", language)} {song.default_key}
            </Badge>
          ) : null}
          <Badge variant="outline" className="font-normal">
            {songTimeSignature(song)}
          </Badge>
          {song.bpm != null ? (
            <Badge variant="outline" className="font-normal">
              {song.bpm} {t("worship.bpm", language)}
            </Badge>
          ) : null}
        </div>
        {(song.tags ?? []).length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {(song.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary/80 px-2 py-0.5 text-[11px] text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {orderedSections.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
          {t("worship.noSectionsYet", language)}
        </p>
      ) : (
        <div className="space-y-4">
          {orderedSections.map((section) => (
            <div
              key={section.id}
              className="space-y-2 rounded-2xl border border-primary/15 bg-card/70 p-4"
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                [{section.label || section.section_type}]
              </p>
              <div className="grid w-full gap-4 sm:grid-cols-2">
                {section.lyrics_mm ? (
                  <div className="w-full min-w-0">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-teal-400">
                      MM
                    </p>
                    <ChordLyrics
                      lyrics={section.lyrics_mm}
                      mm
                      className="w-full"
                    />
                  </div>
                ) : null}
                {section.lyrics_en ? (
                  <div className="w-full min-w-0">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-400">
                      EN
                    </p>
                    <ChordLyrics
                      lyrics={section.lyrics_en}
                      className="w-full"
                    />
                  </div>
                ) : null}
              </div>
              {section.notes ? (
                <p className="text-sm italic text-muted-foreground">
                  {section.notes}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title={t("worship.editSong", language)}
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
        blur
      >
        <SongForm
          language={language}
          userId={userId}
          song={song}
          sections={orderedSections}
          onClose={() => setEditing(false)}
          onDelete={remove}
          deleting={pending}
        />
      </Modal>
    </div>
  );
}
