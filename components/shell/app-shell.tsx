import { BottomNav } from "@/components/shell/bottom-nav";
import { Sidebar } from "@/components/shell/sidebar";
import { NotificationBell } from "@/components/shell/notification-bell";
import { PresenceNotifier } from "@/components/shell/presence-notifier";
import { UserMenu } from "@/components/shell/user-menu";
import { InstallBanner } from "@/components/pwa/install-prompt";
import { t, type Language } from "@/lib/i18n";
import type { Profile } from "@/lib/auth/profile";
import { CoupleProvider } from "@/components/couple-provider";
import { ToastProvider } from "@/components/ui/toast";
import { resolveDisplayName } from "@/lib/display-name";

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
  const myName = resolveDisplayName(me.id, me.display_name, "You");

  return (
    <CoupleProvider language={language} me={me} partner={partner}>
      <ToastProvider>
        <PresenceNotifier
          language={language}
          userId={me.id}
          myName={myName}
          partnerId={partner.id}
        />
        <div className="flex min-h-svh bg-background">
          <Sidebar language={language} />
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/80 bg-background/80 px-4 py-3 backdrop-blur-md md:px-8">
              <div className="min-w-0">
                <p className="bg-gradient-to-r from-primary via-fuchsia-300 to-accent bg-clip-text text-xs font-semibold uppercase tracking-[0.2em] text-transparent md:hidden">
                  {t("appName", language)}
                </p>
                <p className="hidden text-sm font-medium text-foreground md:block">
                  {t("appName", language)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell language={language} userId={me.id} />
                <UserMenu language={language} me={me} />
              </div>
            </header>
            <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-8">
              {children}
            </main>
            <InstallBanner language={language} />
            <BottomNav language={language} />
          </div>
        </div>
      </ToastProvider>
    </CoupleProvider>
  );
}
