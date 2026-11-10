export type CachedBibleVerse = {
  verse: number;
  text_mm: string | null;
  text_en: string | null;
  text_chin: string | null;
  text_kjv: string | null;
};

export type CachedBibleChapter = {
  bookId: string;
  chapter: number;
  nameEn: string;
  nameMm: string;
  nameChin: string | null;
  verses: CachedBibleVerse[];
  savedAt: string;
};

const STORAGE_KEY = "grace:last-bible-chapter";

export function saveLastBibleChapter(chapter: CachedBibleChapter): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chapter));
  } catch {
    // Storage may be full or blocked.
  }
}

export function loadLastBibleChapter(): CachedBibleChapter | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedBibleChapter;
    if (
      !parsed ||
      typeof parsed.bookId !== "string" ||
      typeof parsed.chapter !== "number" ||
      !Array.isArray(parsed.verses)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
