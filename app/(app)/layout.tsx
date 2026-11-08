import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { PartnerGate } from "@/components/partner-gate";
import { LanguageToggle } from "@/components/language-toggle";
import { LogoutButton } from "@/components/logout-button";
import {
  ensureProfile,
  getCurrentUser,
  isPartnerLinked,
  profileLanguage,
} from "@/lib/auth/profile";
import { t } from "@/lib/i18n";

// Auth-gated shell reads cookies/session on every request.
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
  const language = profileLanguage(profile);
  const linked = await isPartnerLinked(supabase, user.id);

  if (!linked) {
    return (
      <div className="min-h-svh bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
        <div className="flex items-center justify-end gap-2 p-4">
          <LanguageToggle userId={user.id} language={language} />
          <LogoutButton label={t("auth.logout", language)} />
        </div>
        <PartnerGate language={language} />
      </div>
    );
  }

  return (
    <AppShell
      language={language}
      userId={user.id}
      displayName={profile?.display_name ?? null}
    >
      {children}
    </AppShell>
  );
}
