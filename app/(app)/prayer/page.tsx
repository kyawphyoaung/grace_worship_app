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

  const [{ data: prayers }, { data: interactions }, { data: gratitude }] =
    await Promise.all([
      supabase
        .from("prayers")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("prayer_interactions")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("gratitude_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false }),
    ]);

  return (
    <PrayerSection
      language={language}
      userId={user.id}
      partnerId={partnerId}
      prayers={prayers ?? []}
      interactions={interactions ?? []}
      reminderTime={profile?.prayer_reminder_time ?? null}
      gratitudeEntries={gratitude ?? []}
    />
  );
}
