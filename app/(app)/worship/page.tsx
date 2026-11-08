import {
  ensureProfile,
  getCurrentUser,
  profileLanguage,
} from "@/lib/auth/profile";
import { t } from "@/lib/i18n";
import { redirect } from "next/navigation";

export const instant = false;

export default async function WorshipPage() {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await ensureProfile(supabase, user.id, user.email);
  const language = profileLanguage(profile);

  return (
    <section className="mx-auto max-w-2xl space-y-3">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        {t("nav.worship", language)}
      </h1>
      <p className="text-base leading-relaxed text-muted-foreground">
        {t("stubs.worship", language)}
      </p>
      <p className="text-sm text-muted-foreground">
        {t("stubs.comingSoon", language)}
      </p>
    </section>
  );
}
