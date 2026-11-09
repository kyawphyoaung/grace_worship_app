import { SettingsWorkspace } from "@/components/settings/settings-workspace";
import {
  ensureProfile,
  getCurrentUser,
  profileLanguage,
} from "@/lib/auth/profile";
import { redirect } from "next/navigation";

export const instant = false;

export default async function SettingsPage() {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await ensureProfile(supabase, user.id, user.email);
  if (!profile) redirect("/auth/login");

  return (
    <SettingsWorkspace
      language={profileLanguage(profile)}
      userId={user.id}
      reminderTime={profile.prayer_reminder_time}
      displayName={profile.display_name}
    />
  );
}
