import { PrayerSection } from "@/components/prayer/prayer-section";
import {
  ensureProfile,
  getCurrentUser,
  getPartnerUserId,
  profileLanguage,
} from "@/lib/auth/profile";
import { redirect } from "next/navigation";

export const instant = false;

export default async function PrayerPage() {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await ensureProfile(supabase, user.id, user.email);
  const language = profileLanguage(profile);
  const partnerId = await getPartnerUserId(supabase, user.id);

  const [
    { data: prayers },
    { data: gratitude },
    { data: reactions },
    { data: comments },
  ] = await Promise.all([
    supabase
      .from("prayers")
      .select("*")
      .or(`user_id.eq.${user.id},is_shared.eq.true`)
      .order("created_at", { ascending: false }),
    supabase
      .from("gratitude_entries")
      .select("*")
      .or(
        `user_id.eq.${user.id},is_shared.eq.true${partnerId ? `,recipient_id.eq.${user.id}` : ""}`,
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("feed_reactions")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("feed_comments")
      .select("*")
      .order("created_at", { ascending: true }),
  ]);

  return (
    <PrayerSection
      language={language}
      userId={user.id}
      partnerId={partnerId}
      prayers={prayers ?? []}
      gratitudeEntries={gratitude ?? []}
      reactions={reactions ?? []}
      comments={comments ?? []}
    />
  );
}
