import { BottomNav } from "@/components/shell/bottom-nav";
import { Sidebar } from "@/components/shell/sidebar";
import { LanguageToggle } from "@/components/language-toggle";
import { LogoutButton } from "@/components/logout-button";
import { t, type Language } from "@/lib/i18n";

export function AppShell({
  children,
  language,
  userId,
  displayName,
}: {
  children: React.ReactNode;
  language: Language;
  userId: string;
  displayName: string | null;
}) {
  return (
    <div className="flex min-h-svh bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <Sidebar language={language} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur md:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary md:hidden">
              {t("appName", language)}
            </p>
            {displayName ? (
              <p className="text-sm text-muted-foreground">{displayName}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle userId={userId} language={language} />
            <LogoutButton label={t("auth.logout", language)} />
          </div>
        </header>
        <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-8">{children}</main>
        <BottomNav language={language} />
      </div>
    </div>
  );
}
