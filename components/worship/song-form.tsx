"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { t, type Language } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MUSIC_KEYS,
  SECTION_TYPES,
  TEMPO_OPTIONS,
  defaultSectionLabel,
  tempoFromBpm,
  type SectionType,
  type TempoOption,
} from "@/lib/worship/constants";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Song = Database["public"]["Tables"]["songs"]["Row"];
type SongSection = Database["public"]["Tables"]["song_sections"]["Row"];

type DraftSection = {
  localId: string;
  id?: string;
  section_type: SectionType;
  label: string;
  lyrics_mm: string;
  lyrics_en: string;
  notes: string;
};

function toDraft(sections: SongSection[]): DraftSection[] {
  return [...sections]
    .sort((a, b) => a.section_order - b.section_order)
    .map((s) => ({
      localId: s.id,
      id: s.id,
      section_type: (SECTION_TYPES.includes(s.section_type as SectionType)
        ? s.section_type
        : "verse") as SectionType,
      label: s.label ?? "",
      lyrics_mm: s.lyrics_mm ?? "",
      lyrics_en: s.lyrics_en ?? "",
      notes: s.notes ?? "",
    }));
}

export function SongForm({
  language,
  userId,
  song,
  sections,
  onClose,
}: {
  language: Language;
  userId: string;
  song: Song | null;
  sections: SongSection[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [titleEn, setTitleEn] = useState(song?.title_en ?? "");
  const [titleMm, setTitleMm] = useState(song?.title_mm ?? "");
  const [author, setAuthor] = useState(song?.author ?? "");
  const [defaultKey, setDefaultKey] = useState(song?.default_key ?? "");
  const [bpm, setBpm] = useState(song?.bpm != null ? String(song.bpm) : "");
  const [tempo, setTempo] = useState<TempoOption | "">(
    (song?.tempo as TempoOption | null) ?? "",
  );
  const [tags, setTags] = useState((song?.tags ?? []).join(", "));
  const [drafts, setDrafts] = useState<DraftSection[]>(() =>
    song ? toDraft(sections) : [],
  );

  const sectionTypeLabel = (type: SectionType) => {
    switch (type) {
      case "intro":
        return t("worship.typeIntro", language);
      case "verse":
        return t("worship.typeVerse", language);
      case "chorus":
        return t("worship.typeChorus", language);
      case "bridge":
        return t("worship.typeBridge", language);
      case "outro":
        return t("worship.typeOutro", language);
    }
  };

  const addSection = (type: SectionType) => {
    const labels = drafts.map((d) => d.label);
    setDrafts((prev) => [
      ...prev,
      {
        localId: `new-${Date.now()}-${prev.length}`,
        section_type: type,
        label: defaultSectionLabel(type, labels),
        lyrics_mm: "",
        lyrics_en: "",
        notes: "",
      },
    ]);
  };

  const updateSection = (
    localId: string,
    patch: Partial<Omit<DraftSection, "localId" | "id">>,
  ) => {
    setDrafts((prev) =>
      prev.map((d) => (d.localId === localId ? { ...d, ...patch } : d)),
    );
  };

  const removeSection = (localId: string) => {
    setDrafts((prev) => prev.filter((d) => d.localId !== localId));
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    setDrafts((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
  };

  const save = () => {
    if (!titleEn.trim() && !titleMm.trim()) {
      showToast(t("worship.needTitle", language));
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const bpmNum = bpm.trim() ? Number(bpm) : null;
      const resolvedTempo =
        tempo || tempoFromBpm(bpmNum) || null;
      const tagList = tags
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

      let songId = song?.id;
      if (songId) {
        const { error } = await supabase
          .from("songs")
          .update({
            title_en: titleEn.trim() || null,
            title_mm: titleMm.trim() || null,
            author: author.trim() || null,
            default_key: defaultKey || null,
            bpm: bpmNum,
            tempo: resolvedTempo,
            tags: tagList,
          })
          .eq("id", songId);
        if (error) {
          showToast(error.message);
          return;
        }
        await supabase.from("song_sections").delete().eq("song_id", songId);
      } else {
        const { data, error } = await supabase
          .from("songs")
          .insert({
            user_id: userId,
            title_en: titleEn.trim() || null,
            title_mm: titleMm.trim() || null,
            author: author.trim() || null,
            default_key: defaultKey || null,
            bpm: bpmNum,
            tempo: resolvedTempo,
            tags: tagList,
          })
          .select("id")
          .single();
        if (error || !data) {
          showToast(error?.message ?? "Failed to save");
          return;
        }
        songId = data.id;
      }

      if (drafts.length > 0) {
        const { error: secErr } = await supabase.from("song_sections").insert(
          drafts.map((d, i) => ({
            song_id: songId!,
            section_type: d.section_type,
            section_order: i + 1,
            label: d.label.trim() || null,
            lyrics_mm: d.lyrics_mm.trim() || null,
            lyrics_en: d.lyrics_en.trim() || null,
            notes: d.notes.trim() || null,
          })),
        );
        if (secErr) {
          showToast(secErr.message);
          return;
        }
      }

      showToast(t("worship.songSaved", language));
      onClose();
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="title-en">{t("worship.titleEn", language)}</Label>
          <Input
            id="title-en"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            className="min-h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="title-mm">{t("worship.titleMm", language)}</Label>
          <Input
            id="title-mm"
            value={titleMm}
            onChange={(e) => setTitleMm(e.target.value)}
            className="min-h-11 mm-text"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="author">{t("worship.author", language)}</Label>
          <Input
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="min-h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="key">{t("worship.defaultKey", language)}</Label>
          <select
            id="key"
            value={defaultKey}
            onChange={(e) => setDefaultKey(e.target.value)}
            className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">—</option>
            {MUSIC_KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bpm">{t("worship.tempoBpm", language)}</Label>
          <Input
            id="bpm"
            type="number"
            min={40}
            max={220}
            value={bpm}
            onChange={(e) => {
              setBpm(e.target.value);
              const n = Number(e.target.value);
              if (e.target.value && !Number.isNaN(n)) {
                const derived = tempoFromBpm(n);
                if (derived) setTempo(derived);
              }
            }}
            className="min-h-11"
            placeholder="72"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tempo">{t("worship.tempo", language)}</Label>
          <select
            id="tempo"
            value={tempo}
            onChange={(e) => setTempo(e.target.value as TempoOption | "")}
            className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">—</option>
            {TEMPO_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "slow"
                  ? t("worship.tempoSlow", language)
                  : opt === "medium"
                    ? t("worship.tempoMedium", language)
                    : t("worship.tempoFast", language)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="tags">{t("worship.tags", language)}</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="min-h-11"
            placeholder={t("worship.tagsHint", language)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold tracking-wide text-primary">
            {t("worship.sections", language)}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {SECTION_TYPES.map((type) => (
            <Button
              key={type}
              type="button"
              variant="secondary"
              size="sm"
              className="min-h-10"
              onClick={() => addSection(type)}
            >
              <Plus className="h-3.5 w-3.5" />
              {sectionTypeLabel(type)}
            </Button>
          ))}
        </div>

        {drafts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
            {t("worship.addSection", language)}
          </p>
        ) : (
          <div className="space-y-3">
            {drafts.map((section, index) => (
              <div
                key={section.localId}
                className="rounded-2xl border border-primary/15 bg-gradient-to-br from-card via-card to-primary/5 p-4 shadow-[0_0_28px_-20px_hsl(var(--primary))]"
              >
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      aria-label="Move up"
                      className="flex h-7 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30"
                      disabled={index === 0}
                      onClick={() => moveSection(index, -1)}
                    >
                      <GripVertical className="h-4 w-4 rotate-90" />
                    </button>
                  </div>
                  <select
                    value={section.section_type}
                    onChange={(e) =>
                      updateSection(section.localId, {
                        section_type: e.target.value as SectionType,
                      })
                    }
                    className="h-10 rounded-md border border-input bg-transparent px-2 text-sm"
                  >
                    {SECTION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {sectionTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={section.label}
                    onChange={(e) =>
                      updateSection(section.localId, { label: e.target.value })
                    }
                    className="min-h-10 flex-1"
                    placeholder={t("worship.sectionLabel", language)}
                  />
                  <button
                    type="button"
                    aria-label={t("common.delete", language)}
                    className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"
                    onClick={() => removeSection(section.localId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>{t("worship.lyricsMm", language)}</Label>
                    <textarea
                      value={section.lyrics_mm}
                      onChange={(e) =>
                        updateSection(section.localId, {
                          lyrics_mm: e.target.value,
                        })
                      }
                      rows={5}
                      className={cn(
                        "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm mm-text",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("worship.lyricsEn", language)}</Label>
                    <textarea
                      value={section.lyrics_en}
                      onChange={(e) =>
                        updateSection(section.localId, {
                          lyrics_en: e.target.value,
                        })
                      }
                      rows={5}
                      className={cn(
                        "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      )}
                    />
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  <Label>{t("worship.sectionNotes", language)}</Label>
                  <Input
                    value={section.notes}
                    onChange={(e) =>
                      updateSection(section.localId, { notes: e.target.value })
                    }
                    className="min-h-10"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-border/60 pt-4">
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={onClose}
          disabled={pending}
        >
          {t("common.cancel", language)}
        </Button>
        <Button
          type="button"
          className="min-h-11"
          onClick={save}
          disabled={pending}
        >
          {pending ? t("common.loading", language) : t("common.save", language)}
        </Button>
      </div>
    </div>
  );
}
