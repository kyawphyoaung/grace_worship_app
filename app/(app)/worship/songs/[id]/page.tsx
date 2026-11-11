import { notFound, redirect } from "next/navigation";
import { SongPreview } from "@/components/worship/song-preview";
import {
  ensureProfile,
  getCurrentUser,
  profileLanguage,
} from "@/lib/auth/profile";

export const instant = false;

export default async function SongPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await ensureProfile(supabase, user.id, user.email);
  const language = profileLanguage(profile);

  const [{ data: song }, { data: sections }] = await Promise.all([
    supabase.from("songs").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("song_sections")
      .select("*")
      .eq("song_id", id)
      .order("section_order", { ascending: true }),
  ]);

  if (!song) notFound();

  const backHref =
    from === "library" || from == null
      ? "/worship?library=1"
      : "/worship";

  return (
    <SongPreview
      language={language}
      userId={user.id}
      song={song}
      sections={sections ?? []}
      backHref={backHref}
    />
  );
}
