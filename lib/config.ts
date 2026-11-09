/** Hardcoded couple anniversary (do not move to DB). */
export const ANNIVERSARY_DATE = "2026-10-14";

/** Allowed Bible reader versions (persisted on profiles.preferred_bible_languages). */
export const BIBLE_VERSIONS = ["mm", "en", "chin", "kjv"] as const;
export type BibleVersion = (typeof BIBLE_VERSIONS)[number];

export const BIBLE_VERSION_BADGE: Record<BibleVersion, string> = {
  mm: "MM",
  en: "EN",
  chin: "Tedim",
  kjv: "KJV",
};
