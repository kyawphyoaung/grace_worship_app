import { BottomNav } from "@/components/shell/bottom-nav";
import { Sidebar } from "@/components/shell/sidebar";
import { LanguageToggle } from "@/components/language-toggle";
import { LogoutButton } from "@/components/logout-button";
import { CouplePill } from "@/components/shell/couple-pill";
import { t, type Language } from "@/lib/i18n";
import type { Profile } from "@/lib/auth/profile";
import { CoupleProvider } from "@/components/couple-provider";
import { ToastProvider } from "@/components/ui/toast";

export function AppShell({
  children,
  language,
  me,
  partner,
}: {
  children: React.ReactNode;
  language: Language;
  me: Profile;
  partner: Profile;
}) {
  return (
    <CoupleProvider language={language} me={me} partner={partner}>
      <ToastProvider>
        <div className="flex min-h-svh bg-background">
          <Sidebar language={language} />
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/80 bg-background/90 px-4 py-3 backdrop-blur md:px-8">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary md:hidden">
                  {t("appName", language)}
                </p>
                {me.display_name ? (
                  <p className="truncate text-sm text-muted-foreground">
                    {me.display_name}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <CouplePill />
                <LanguageToggle userId={me.id} language={language} />
                <LogoutButton label={t("auth.logout", language)} />
              </div>
            </header>
            <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-8">
              {children}
            </main>
            <BottomNav language={language} />
          </div>
        </div>
      </ToastProvider>
    </CoupleProvider>
  );
}
