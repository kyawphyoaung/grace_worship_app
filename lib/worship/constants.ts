export const MUSIC_KEYS = [
  "C",
  "C#",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
  "Cm",
  "C#m",
  "Dm",
  "Ebm",
  "Em",
  "Fm",
  "F#m",
  "Gm",
  "Am",
  "Bbm",
  "Bm",
] as const;

export type MusicKey = (typeof MUSIC_KEYS)[number];

export const SECTION_TYPES = [
  "intro",
  "verse",
  "chorus",
  "bridge",
  "outro",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export const EVENT_TYPES = [
  "sunday",
  "saturday",
  "wednesday",
  "custom",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_ROLES = ["leader", "backup", "participant"] as const;

export type EventRole = (typeof EVENT_ROLES)[number];

export const TEMPO_OPTIONS = ["slow", "medium", "fast"] as const;

export type TempoOption = (typeof TEMPO_OPTIONS)[number];

export function tempoFromBpm(bpm: number | null | undefined): TempoOption | null {
  if (bpm == null || Number.isNaN(bpm)) return null;
  if (bpm < 80) return "slow";
  if (bpm <= 115) return "medium";
  return "fast";
}

export function defaultSectionLabel(
  type: SectionType,
  existingLabels: string[],
): string {
  const base =
    type === "intro"
      ? "Intro"
      : type === "chorus"
        ? "Chorus"
        : type === "bridge"
          ? "Bridge"
          : type === "outro"
            ? "Outro"
            : "Verse";

  if (type === "verse" || type === "chorus" || type === "bridge") {
    let n = 1;
    while (existingLabels.includes(`${base} ${n}`)) n += 1;
    return `${base} ${n}`;
  }

  if (existingLabels.includes(base)) {
    let n = 2;
    while (existingLabels.includes(`${base} ${n}`)) n += 1;
    return `${base} ${n}`;
  }
  return base;
}

export function songTitle(
  song: { title_en: string | null; title_mm: string | null },
  prefer: "en" | "mm" = "en",
): string {
  if (prefer === "mm") {
    return song.title_mm?.trim() || song.title_en?.trim() || "Untitled";
  }
  return song.title_en?.trim() || song.title_mm?.trim() || "Untitled";
}
