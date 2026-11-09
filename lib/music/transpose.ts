/** Chromatic note index: C=0 … B=11 */
const NOTE_TO_INDEX: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

const SHARP_KEYS = new Set(["C", "G", "D", "A", "E", "B", "F#"]);
const FLAT_KEYS = new Set(["F", "Bb", "Eb", "Ab", "Db", "Gb"]);

const SHARP_SCALE = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

const FLAT_SCALE = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;

export type ParsedChord = {
  root: string;
  suffix: string;
  slashRoot: string | null;
  raw: string;
};

/** Match a note token at the start of a string (C, C#, Db, …). */
function matchNoteToken(input: string): { note: string; length: number } | null {
  const m = input.match(/^([A-Ga-g])([#♯b♭]?)/);
  if (!m) return null;
  const letter = m[1].toUpperCase();
  const acc =
    m[2] === "#" || m[2] === "♯" ? "#" : m[2] === "b" || m[2] === "♭" ? "b" : "";
  const note = `${letter}${acc}`;
  if (!(note in NOTE_TO_INDEX)) return null;
  return { note, length: m[0].length };
}

export function noteIndex(note: string): number | null {
  const cleaned = note.trim();
  const matched = matchNoteToken(cleaned);
  if (!matched) return null;
  return NOTE_TO_INDEX[matched.note] ?? null;
}

/** Extract major/minor key root for accidental preference (e.g. Am → A). */
export function keyRoot(key: string): string {
  const matched = matchNoteToken(key.trim());
  return matched?.note ?? key.trim();
}

export function prefersFlats(targetKey: string): boolean {
  const root = keyRoot(targetKey);
  if (FLAT_KEYS.has(root)) return true;
  if (SHARP_KEYS.has(root)) return false;
  return root.includes("b");
}

export function indexToNote(index: number, useFlats: boolean): string {
  const i = ((index % 12) + 12) % 12;
  return useFlats ? FLAT_SCALE[i] : SHARP_SCALE[i];
}

export function transposeOffset(fromKey: string, toKey: string): number | null {
  const from = noteIndex(keyRoot(fromKey));
  const to = noteIndex(keyRoot(toKey));
  if (from == null || to == null) return null;
  return (to - from + 12) % 12;
}

/**
 * Parse a chord token without brackets: Fmaj7, Am, C/G, F#m7b5
 */
export function parseChord(raw: string): ParsedChord | null {
  const text = raw.trim();
  if (!text) return null;

  const slashIdx = text.indexOf("/");
  const main = slashIdx >= 0 ? text.slice(0, slashIdx) : text;
  const slashPart = slashIdx >= 0 ? text.slice(slashIdx + 1) : null;

  const rootMatch = matchNoteToken(main);
  if (!rootMatch) return null;

  const root = rootMatch.note;
  const suffix = main.slice(rootMatch.length);

  let slashRoot: string | null = null;
  if (slashPart) {
    const slashMatch = matchNoteToken(slashPart);
    if (slashMatch) slashRoot = slashMatch.note;
  }

  return { root, suffix, slashRoot, raw: text };
}

export function transposeChordToken(
  chord: string,
  offset: number,
  targetKey: string,
): string {
  const parsed = parseChord(chord);
  if (!parsed) return chord;
  const useFlats = prefersFlats(targetKey);
  const rootIdx = noteIndex(parsed.root);
  if (rootIdx == null) return chord;
  const newRoot = indexToNote(rootIdx + offset, useFlats);

  let out = `${newRoot}${parsed.suffix}`;
  if (parsed.slashRoot) {
    const slashIdx = noteIndex(parsed.slashRoot);
    if (slashIdx != null) {
      out += `/${indexToNote(slashIdx + offset, useFlats)}`;
    } else {
      out += `/${parsed.slashRoot}`;
    }
  }
  return out;
}

/** Transpose all [Chord] tokens in a lyrics string. */
export function transposeLyrics(
  lyrics: string,
  fromKey: string,
  toKey: string,
): string {
  if (!lyrics) return lyrics;
  const offset = transposeOffset(fromKey, toKey);
  if (offset == null) return lyrics;
  if (offset === 0 && keyRoot(fromKey) === keyRoot(toKey)) return lyrics;

  return lyrics.replace(/\[([^\]]+)\]/g, (_, chord: string) => {
    return `[${transposeChordToken(chord, offset, toKey)}]`;
  });
}

export type LyricSegment =
  | { kind: "text"; text: string }
  | { kind: "chord"; chord: string; text: string };

/**
 * Parse a single lyric line into chord+text segments for stacked display.
 * `[C]If you miss the [Am]train` → chord C over "If you miss the ", Am over "train"
 */
export function parseChordLyricLine(line: string): LyricSegment[] {
  const segments: LyricSegment[] = [];
  const re = /\[([^\]]+)\]/g;
  let last = 0;
  let match: RegExpExecArray | null;
  const chordSpans: { index: number; chord: string; end: number }[] = [];

  while ((match = re.exec(line)) !== null) {
    chordSpans.push({
      index: match.index,
      chord: match[1],
      end: match.index + match[0].length,
    });
  }

  if (chordSpans.length === 0) {
    return [{ kind: "text", text: line }];
  }

  for (let i = 0; i < chordSpans.length; i++) {
    const span = chordSpans[i];
    if (span.index > last) {
      const before = line.slice(last, span.index);
      if (before) segments.push({ kind: "text", text: before });
    }
    const nextStart =
      i + 1 < chordSpans.length ? chordSpans[i + 1].index : line.length;
    const lyric = line.slice(span.end, nextStart);
    segments.push({ kind: "chord", chord: span.chord, text: lyric });
    last = nextStart;
  }

  return segments;
}

export function parseChordLyrics(lyrics: string): LyricSegment[][] {
  return lyrics.split("\n").map((line) => parseChordLyricLine(line));
}
