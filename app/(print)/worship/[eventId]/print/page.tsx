import { notFound, redirect } from "next/navigation";
import {
  ensureProfile,
  getCurrentUser,
  profileLanguage,
} from "@/lib/auth/profile";
import { PrintChart } from "@/components/worship/print-chart";
import type { Database } from "@/types/database";

export const instant = false;

type Song = Database["public"]["Tables"]["songs"]["Row"];
type SongSection = Database["public"]["Tables"]["song_sections"]["Row"];
type SetlistItem = Database["public"]["Tables"]["setlist_items"]["Row"];

export default async function WorshipPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ key?: string }>;
}) {
  const { eventId } = await params;
  const { key } = await searchParams;
  const mode = key === "override" ? "override" : "original";

  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await ensureProfile(supabase, user.id, user.email);
  const language = profileLanguage(profile);

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) notFound();

  const { data: setlist } = await supabase
    .from("setlists")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();

  let items: (SetlistItem & { song: Song })[] = [];
  const sectionsBySong = new Map<string, SongSection[]>();

  if (setlist) {
    const [{ data: rawItems }, { data: songs }, { data: sections }] =
      await Promise.all([
        supabase
          .from("setlist_items")
          .select("*")
          .eq("setlist_id", setlist.id)
          .order("position", { ascending: true }),
        supabase.from("songs").select("*"),
        supabase
          .from("song_sections")
          .select("*")
          .order("section_order", { ascending: true }),
      ]);

    const songsById = new Map((songs ?? []).map((s) => [s.id, s]));
    items = (rawItems ?? [])
      .map((item) => {
        const song = songsById.get(item.song_id);
        if (!song) return null;
        return { ...item, song };
      })
      .filter((x): x is SetlistItem & { song: Song } => x !== null);

    for (const section of sections ?? []) {
      const list = sectionsBySong.get(section.song_id) ?? [];
      list.push(section);
      sectionsBySong.set(section.song_id, list);
    }
  }

  return (
    <PrintChart
      language={language}
      event={event}
      items={items}
      sectionsBySong={sectionsBySong}
      mode={mode}
    />
  );
}
