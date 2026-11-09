export type ParsedReference = {
  bookQuery: string;
  chapter: number;
  verse?: number;
};

/**
 * Parse simple references like "John 3", "John 3:16", "Gen 1".
 * Free-text search is handled separately when this returns null.
 */
export function parseBibleReference(input: string): ParsedReference | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const match = trimmed.match(
    /^((?:\d\s*)?[A-Za-z\u1000-\u109F.]+(?:\s+[A-Za-z\u1000-\u109F.]+)?)\s+(\d+)(?::(\d+))?$/,
  );
  if (!match) return null;

  const bookQuery = match[1].replace(/\./g, "").trim();
  const chapter = Number(match[2]);
  const verse = match[3] ? Number(match[3]) : undefined;
  if (!Number.isFinite(chapter) || chapter < 1) return null;
  if (verse !== undefined && (!Number.isFinite(verse) || verse < 1)) return null;

  return { bookQuery, chapter, verse };
}

export function bookMatchesQuery(
  book: {
    name_en: string;
    name_mm: string;
    abbreviation: string;
    name_chin?: string | null;
  },
  query: string,
): boolean {
  const q = query.toLowerCase();
  return (
    book.name_en.toLowerCase().includes(q) ||
    book.name_mm.includes(query) ||
    (book.name_chin?.toLowerCase().includes(q) ?? false) ||
    book.abbreviation.toLowerCase() === q ||
    book.abbreviation.toLowerCase().startsWith(q)
  );
}
