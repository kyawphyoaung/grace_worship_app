import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { PartnerGate } from "@/components/partner-gate";
import { LanguageToggle } from "@/components/language-toggle";
import { LogoutButton } from "@/components/logout-button";
import {
  ensureProfile,
  getCurrentUser,
  getPartnerUserId,
  isPartnerLinked,
  profileLanguage,
} from "@/lib/auth/profile";
import { t } from "@/lib/i18n";

export const instant = false;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const profile = await ensureProfile(supabase, user.id, user.email);
  if (!profile) {
    redirect("/auth/login");
  }

  const language = profileLanguage(profile);
  const linked = await isPartnerLinked(supabase, user.id);

  if (!linked) {
    return (
      <div className="min-h-svh bg-background">
        <div className="flex items-center justify-end gap-2 p-4">
          <LanguageToggle userId={user.id} language={language} />
          <LogoutButton label={t("auth.logout", language)} />
        </div>
        <PartnerGate language={language} />
      </div>
    );
  }

  const partnerId = await getPartnerUserId(supabase, user.id);
  const { data: partnerProfile } = partnerId
    ? await supabase.from("profiles").select("*").eq("id", partnerId).maybeSingle()
    : { data: null };

  if (!partnerProfile) {
    return (
      <div className="min-h-svh bg-background">
        <div className="flex items-center justify-end gap-2 p-4">
          <LanguageToggle userId={user.id} language={language} />
          <LogoutButton label={t("auth.logout", language)} />
        </div>
        <PartnerGate language={language} />
      </div>
    );
  }

  return (
    <AppShell language={language} me={profile} partner={partnerProfile}>
      {children}
    </AppShell>
  );
}
