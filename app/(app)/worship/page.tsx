import { WorshipWorkspace } from "@/components/worship/worship-workspace";
import {
  ensureProfile,
  getCurrentUser,
  profileLanguage,
} from "@/lib/auth/profile";
import { redirect } from "next/navigation";

export const instant = false;

export default async function WorshipPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; library?: string }>;
}) {
  const { event: eventParam, library: libraryParam } = await searchParams;
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await ensureProfile(supabase, user.id, user.email);
  const language = profileLanguage(profile);
  const libraryOpen =
    libraryParam === "1" || libraryParam === "true" || libraryParam === "yes";

  const [
    { data: songs },
    { data: sections },
    { data: events },
    { data: setlists },
    { data: setlistItems },
    { data: prayers },
    { data: feedback },
    { data: reflections },
  ] = await Promise.all([
    supabase.from("songs").select("*").order("updated_at", { ascending: false }),
    supabase
      .from("song_sections")
      .select("*")
      .order("section_order", { ascending: true }),
    supabase.from("events").select("*").order("event_date", { ascending: false }),
    supabase.from("setlists").select("*"),
    supabase
      .from("setlist_items")
      .select("*")
      .order("position", { ascending: true }),
    supabase
      .from("event_prayers")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("event_feedback")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("ministry_reflections").select("*"),
  ]);

  return (
    <WorshipWorkspace
      language={language}
      userId={user.id}
      initialEventId={eventParam ?? null}
      initialLibraryOpen={libraryOpen}
      songs={songs ?? []}
      sections={sections ?? []}
      events={events ?? []}
      setlists={setlists ?? []}
      setlistItems={setlistItems ?? []}
      prayers={prayers ?? []}
      feedback={feedback ?? []}
      reflections={reflections ?? []}
    />
  );
}
