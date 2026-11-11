"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Music2, Plus, Search, Tag } from "lucide-react";
import { deleteSong } from "@/lib/actions/worship";
import { t, type Language } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { SongForm } from "@/components/worship/song-form";
import { songTimeSignature, songTitle } from "@/lib/worship/constants";
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
      const { error } = await deleteSong(song.id);
      if (error) {
        showToast(error);
        return;
      }
      showToast(t("worship.songDeleted", language));
      setEditing(null);
      router.refresh();
    });
  };

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
                <Link
                  href={`/worship/songs/${song.id}`}
                  className="card-glow block w-full rounded-2xl border border-primary/15 p-4 text-left transition hover:border-primary/35"
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
                </Link>
              </li>
            );
          })}
        </ul>
      )}

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
