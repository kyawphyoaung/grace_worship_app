import {
  ensureProfile,
  getCurrentUser,
  profileLanguage,
} from "@/lib/auth/profile";
import { t } from "@/lib/i18n";
import { redirect } from "next/navigation";

export default async function PrayerPage() {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await ensureProfile(supabase, user.id, user.email);
  const language = profileLanguage(profile);

  return (
    <section className="mx-auto max-w-2xl space-y-3">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        {t("nav.prayer", language)}
      </h1>
      <p className="text-base leading-relaxed text-muted-foreground">
        {t("stubs.prayer", language)}
      </p>
      <p className="text-sm text-muted-foreground">
        {t("stubs.comingSoon", language)}
      </p>
    </section>
  );
}
