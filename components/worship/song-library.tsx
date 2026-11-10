"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Music2, Pencil, Plus, Search, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { t, type Language } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { SongForm } from "@/components/worship/song-form";
import { ChordLyrics } from "@/components/worship/chord-lyrics";
import { songTimeSignature, songTitle } from "@/lib/worship/constants";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Song = Database["public"]["Tables"]["songs"]["Row"];
type SongSection = Database["public"]["Tables"]["song_sections"]["Row"];

export function SongLibrary({
  language,
  userId,
  songs,
  sections,
}: {
  language: Language;
  userId: string;
  songs: Song[];
  sections: SongSection[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<Song | null>(null);
  const [editing, setEditing] = useState<Song | null | "new">(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const song of songs) {
      for (const tag of song.tags ?? []) set.add(tag);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [songs]);

  const sectionsBySong = useMemo(() => {
    const map = new Map<string, SongSection[]>();
    for (const s of sections) {
      const list = map.get(s.song_id) ?? [];
      list.push(s);
      map.set(s.song_id, list);
    }
    return map;
  }, [sections]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return songs.filter((song) => {
      if (tagFilter && !(song.tags ?? []).includes(tagFilter)) return false;
      if (!q) return true;
      const hay = [
        song.title_en ?? "",
        song.title_mm ?? "",
        song.author ?? "",
        ...(song.tags ?? []),
        song.default_key ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [songs, query, tagFilter]);

  const remove = (song: Song) => {
    if (!window.confirm(t("worship.deleteSongConfirm", language))) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("songs").delete().eq("id", song.id);
      if (error) {
        showToast(error.message);
        return;
      }
      showToast(t("worship.songDeleted", language));
      setEditing(null);
      setPreviewing(null);
      router.refresh();
    });
  };

  const previewSections = previewing
    ? [...(sectionsBySong.get(previewing.id) ?? [])].sort(
        (a, b) => a.section_order - b.section_order,
      )
    : [];
  const embedUrl = previewing
    ? youtubeEmbedUrl(previewing.youtube_url)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("worship.searchSongs", language)}
            className="min-h-11 pl-9"
          />
        </div>
        <Button
          className="min-h-11 shrink-0"
          onClick={() => setEditing("new")}
        >
          <Plus className="h-4 w-4" />
          {t("worship.addSong", language)}
        </Button>
      </div>

      {allTags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTagFilter(null)}
            className={cn(
              "inline-flex min-h-9 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors",
              tagFilter === null
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <Tag className="h-3 w-3" />
            {t("worship.allTags", language)}
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setTagFilter((cur) => (cur === tag ? null : tag))}
              className={cn(
                "inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-medium transition-colors",
                tagFilter === tag
                  ? "border-accent/50 bg-accent/15 text-accent"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-primary/25 bg-card/60 px-5 py-12 text-center">
          <Music2 className="mx-auto mb-3 h-8 w-8 text-primary/70" />
          <p className="text-sm text-muted-foreground">
            {t("worship.noSongs", language)}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((song) => {
            const title = songTitle(
              song,
              language === "mm" ? "mm" : "en",
            );
            const secondary =
              language === "mm"
                ? song.title_en
                : song.title_mm;
            return (
              <li key={song.id}>
                <button
                  type="button"
                  onClick={() => setPreviewing(song)}
                  className="card-glow w-full rounded-2xl border border-primary/15 p-4 text-left transition hover:border-primary/35"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-foreground">
                        {title}
                      </p>
                      {secondary && secondary !== title ? (
                        <p className="mt-0.5 truncate text-sm text-muted-foreground mm-text">
                          {secondary}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {song.author ? <span>{song.author}</span> : null}
                        {song.default_key ? (
                          <Badge variant="secondary" className="font-normal">
                            {t("worship.key", language)} {song.default_key}
                          </Badge>
                        ) : null}
                        {song.bpm != null ? (
                          <Badge variant="outline" className="font-normal">
                            {song.bpm} {t("worship.bpm", language)}
                          </Badge>
                        ) : null}
                        <Badge variant="outline" className="font-normal">
                          {songTimeSignature(song)}
                        </Badge>
                      </div>
                      {(song.tags ?? []).length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {song.tags.map((tag) => (
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
                    <span className="shrink-0 text-xs text-primary">
                      {(sectionsBySong.get(song.id) ?? []).length}{" "}
                      {t("worship.sections", language).toLowerCase()}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={previewing !== null}
        onClose={() => setPreviewing(null)}
        title={
          previewing
            ? songTitle(previewing, language === "mm" ? "mm" : "en")
            : t("worship.preview", language)
        }
        className="max-h-[90vh] max-w-2xl overflow-hidden"
        bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
        blur
      >
        {previewing ? (
          <>
            {embedUrl ? (
              <div className="sticky top-0 z-10 shrink-0 border-b border-border/60 bg-card/95 pb-3 backdrop-blur">
                <div className="aspect-video w-full overflow-hidden rounded-xl border border-border/70 bg-black">
                  <iframe
                    src={embedUrl}
                    title={songTitle(
                      previewing,
                      language === "mm" ? "mm" : "en",
                    )}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              </div>
            ) : null}

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pt-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  {previewing.author ? (
                    <p className="text-sm text-muted-foreground">
                      {previewing.author}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {previewing.default_key ? (
                      <Badge variant="secondary" className="font-normal">
                        {t("worship.key", language)} {previewing.default_key}
                      </Badge>
                    ) : null}
                    <Badge variant="outline" className="font-normal">
                      {songTimeSignature(previewing)}
                    </Badge>
                    {previewing.bpm != null ? (
                      <Badge variant="outline" className="font-normal">
                        {previewing.bpm} {t("worship.bpm", language)}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <Button
                  type="button"
                  className="min-h-11 shrink-0"
                  onClick={() => {
                    const song = previewing;
                    setPreviewing(null);
                    setEditing(song);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  {t("common.edit", language)}
                </Button>
              </div>

              {previewSections.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                  {t("worship.noSectionsYet", language)}
                </p>
              ) : (
                previewSections.map((section) => (
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
                ))
              )}
            </div>
          </>
        ) : null}
      </Modal>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={
          editing && editing !== "new"
            ? t("worship.editSong", language)
            : t("worship.addSong", language)
        }
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
        blur
      >
        <SongForm
          language={language}
          userId={userId}
          song={editing && editing !== "new" ? editing : null}
          sections={
            editing && editing !== "new"
              ? (sectionsBySong.get(editing.id) ?? [])
              : []
          }
          onClose={() => setEditing(null)}
          onDelete={
            editing && editing !== "new"
              ? () => remove(editing)
              : undefined
          }
          deleting={pending}
        />
      </Modal>
    </div>
  );
}
