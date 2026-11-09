import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { format, parseISO } from "date-fns";
import { songTitle } from "@/lib/worship/constants";
import {
  parseChordLyricLine,
  type LyricSegment,
} from "@/lib/music/transpose";

let myanmarFontRegistered = false;

export function ensurePdfFonts() {
  if (myanmarFontRegistered) return;
  const src =
    typeof window !== "undefined"
      ? `${window.location.origin}/fonts/NotoSansMyanmar-Regular.ttf`
      : "/fonts/NotoSansMyanmar-Regular.ttf";
  Font.register({
    family: "NotoSansMyanmar",
    src,
  });
  myanmarFontRegistered = true;
}

export type PdfSection = {
  label: string | null;
  section_type: string;
  lyrics_mm: string | null;
  lyrics_en: string | null;
};

export type PdfSongItem = {
  position: number;
  key: string | null;
  time_signature: string;
  transition_note: string | null;
  song: {
    title_en: string | null;
    title_mm: string | null;
    author: string | null;
    default_key: string | null;
    bpm: number | null;
  };
  sections: PdfSection[];
};

export type PdfEventChartProps = {
  event: {
    event_name: string;
    event_date: string;
  };
  items: PdfSongItem[];
};

const colors = {
  ink: "#1a1525",
  muted: "#5b5470",
  line: "#d4cfe0",
  teal: "#1f9e8a",
  plum: "#6b3d8a",
  soft: "#f6f3fb",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontSize: 10,
    color: colors.ink,
    fontFamily: "Helvetica",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: colors.teal,
    paddingBottom: 12,
    marginBottom: 16,
  },
  brand: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.plum,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: colors.ink,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  chip: {
    backgroundColor: colors.soft,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 9,
    color: colors.muted,
  },
  songBlock: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 6,
    overflow: "hidden",
  },
  songHeader: {
    backgroundColor: colors.soft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  songIndex: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: colors.teal,
    width: 24,
  },
  songTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    flex: 1,
  },
  songTitleMm: {
    fontFamily: "NotoSansMyanmar",
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  songMeta: {
    fontSize: 9,
    color: colors.muted,
    textAlign: "right",
  },
  section: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  sectionLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: colors.plum,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  lyricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  lyricsCol: {
    flex: 1,
  },
  lyricsLang: {
    fontSize: 7,
    color: colors.teal,
    marginBottom: 2,
    fontFamily: "Helvetica-Bold",
  },
  chordLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 2,
  },
  chordStack: {
    flexDirection: "column",
    marginRight: 0,
  },
  chord: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.teal,
    marginBottom: 1,
  },
  lyricText: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: colors.ink,
    lineHeight: 1.35,
  },
  lyricTextMm: {
    fontSize: 10,
    fontFamily: "NotoSansMyanmar",
    color: colors.ink,
    lineHeight: 1.5,
  },
  transition: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingBottom: 8,
    fontSize: 8,
    color: colors.plum,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: colors.muted,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 6,
  },
});

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function hasMyanmar(text: string) {
  return /[\u1000-\u109F]/.test(text);
}

function ChordLyricBlock({
  lyrics,
  myanmar,
}: {
  lyrics: string;
  myanmar: boolean;
}) {
  const lines = lyrics.split("\n");
  const textStyle = myanmar ? styles.lyricTextMm : styles.lyricText;

  return (
    <View>
      {lines.map((line, lineIdx) => {
        const segments: LyricSegment[] = parseChordLyricLine(line);
        const hasChords = segments.some((s) => s.kind === "chord");
        if (!hasChords) {
          return (
            <Text key={lineIdx} style={textStyle}>
              {line || " "}
            </Text>
          );
        }
        return (
          <View key={lineIdx} style={styles.chordLine}>
            {segments.map((seg, i) => {
              if (seg.kind === "text") {
                return (
                  <Text key={i} style={textStyle}>
                    {seg.text}
                  </Text>
                );
              }
              return (
                <View key={i} style={styles.chordStack}>
                  <Text style={styles.chord}>{seg.chord || " "}</Text>
                  <Text
                    style={
                      myanmar && hasMyanmar(seg.text)
                        ? styles.lyricTextMm
                        : styles.lyricText
                    }
                  >
                    {seg.text || " "}
                  </Text>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

export function EventChartDocument({ event, items }: PdfEventChartProps) {
  const dateLabel = format(parseISO(event.event_date), "EEEE, MMM d, yyyy");

  return (
    <Document
      title={`${event.event_name} — Worship Chart`}
      author="Grace"
      subject="Worship setlist chart"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>Grace · Worship Chart</Text>
          <Text style={styles.title}>{event.event_name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.chip}>{dateLabel}</Text>
            <Text style={styles.chip}>{items.length} songs</Text>
          </View>
        </View>

        {items.map((item) => {
          const title = songTitle(item.song, "en");
          const mmTitle = item.song.title_mm?.trim();
          const key = item.key || item.song.default_key || "—";
          return (
            <View
              key={`${item.position}-${title}`}
              style={styles.songBlock}
              wrap={false}
            >
              <View style={styles.songHeader}>
                <Text style={styles.songIndex}>{item.position}.</Text>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text
                    style={
                      hasMyanmar(title) ? styles.songTitleMm : styles.songTitle
                    }
                  >
                    {title}
                  </Text>
                  {mmTitle && mmTitle !== title ? (
                    <Text style={styles.songTitleMm}>{mmTitle}</Text>
                  ) : null}
                  {item.song.author ? (
                    <Text
                      style={{ fontSize: 8, color: colors.muted, marginTop: 2 }}
                    >
                      {item.song.author}
                    </Text>
                  ) : null}
                </View>
                <View>
                  <Text style={styles.songMeta}>Key: {key}</Text>
                  <Text style={styles.songMeta}>{item.time_signature}</Text>
                  {item.song.bpm != null ? (
                    <Text style={styles.songMeta}>{item.song.bpm} BPM</Text>
                  ) : null}
                </View>
              </View>

              {item.sections.map((section, idx) => (
                <View key={`${item.position}-s-${idx}`} style={styles.section}>
                  <Text style={styles.sectionLabel}>
                    [{section.label || capitalize(section.section_type)}]
                  </Text>
                  <View style={styles.lyricsRow}>
                    {section.lyrics_mm ? (
                      <View style={styles.lyricsCol}>
                        <Text style={styles.lyricsLang}>MM</Text>
                        <ChordLyricBlock
                          lyrics={section.lyrics_mm}
                          myanmar
                        />
                      </View>
                    ) : null}
                    {section.lyrics_en ? (
                      <View style={styles.lyricsCol}>
                        <Text style={styles.lyricsLang}>EN</Text>
                        <ChordLyricBlock
                          lyrics={section.lyrics_en}
                          myanmar={false}
                        />
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}

              {item.transition_note ? (
                <Text style={styles.transition}>
                  → Transition: {item.transition_note}
                </Text>
              ) : null}
            </View>
          );
        })}

        <View style={styles.footer} fixed>
          <Text>Grace · Band chart</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
