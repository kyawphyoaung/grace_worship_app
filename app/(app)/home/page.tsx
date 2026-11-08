import {
  ensureProfile,
  getCurrentUser,
  profileLanguage,
} from "@/lib/auth/profile";
import { t } from "@/lib/i18n";
import { redirect } from "next/navigation";
import Link from "next/link";

export const instant = false;

export default async function HomePage() {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await ensureProfile(supabase, user.id, user.email);
  const language = profileLanguage(profile);

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {t("nav.home", language)}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {t("stubs.home", language)}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/bible"
          className="min-h-20 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          <p className="font-medium text-primary">{t("nav.bible", language)}</p>
        </Link>
        <Link
          href="/prayer"
          className="min-h-20 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          <p className="font-medium text-primary">{t("nav.prayer", language)}</p>
        </Link>
        <Link
          href="/worship"
          className="min-h-20 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          <p className="font-medium text-primary">{t("nav.worship", language)}</p>
        </Link>
      </div>
    </section>
  );
}
