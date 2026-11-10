"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { t, type Language } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "grace:install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOS || iPadOs;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return media || iosStandalone;
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(true);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIos());

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setDeferred(null);
    });
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  const canInstall = !installed && (Boolean(deferred) || ios);

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setDeferred(null);
        setInstalled(true);
      }
      return;
    }
    if (ios) {
      setShowIosHelp(true);
    }
  };

  return {
    canInstall,
    installed,
    ios,
    showIosHelp,
    setShowIosHelp,
    install,
  };
}

/** Subtle bottom banner prompting install (hidden when dismissed or already installed). */
export function InstallBanner({ language }: { language: Language }) {
  const { canInstall, ios, showIosHelp, setShowIosHelp, install } =
    useInstallPrompt();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!canInstall || dismissed) return null;

  return (
    <>
      <div
        className={cn(
          "fixed inset-x-3 z-40 rounded-2xl border border-primary/30 bg-card/95 p-3 shadow-[0_0_40px_-12px_hsl(var(--primary)/0.55)] backdrop-blur",
          "bottom-[5.25rem] md:bottom-4 md:left-auto md:right-6 md:w-[22rem]",
        )}
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              {t("pwa.installTitle", language)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {ios
                ? t("pwa.installHintIos", language)
                : t("pwa.installHint", language)}
            </p>
          </div>
          <button
            type="button"
            aria-label={t("common.close", language)}
            className="flex min-h-9 min-w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            onClick={() => {
              try {
                localStorage.setItem(DISMISS_KEY, "1");
              } catch {
                // ignore
              }
              setDismissed(true);
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <Button
          type="button"
          className="mt-3 min-h-11 w-full"
          onClick={() => void install()}
        >
          <Download className="h-4 w-4" />
          {t("pwa.installAction", language)}
        </Button>
      </div>

      {showIosHelp ? (
        <IosInstallHelp
          language={language}
          onClose={() => setShowIosHelp(false)}
        />
      ) : null}
    </>
  );
}

export function InstallSettingsCard({ language }: { language: Language }) {
  const { canInstall, installed, ios, showIosHelp, setShowIosHelp, install } =
    useInstallPrompt();

  if (installed) {
    return (
      <section className="space-y-2 rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-medium">{t("pwa.installTitle", language)}</p>
        <p className="text-xs text-muted-foreground">
          {t("pwa.alreadyInstalled", language)}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <div>
        <p className="text-sm font-medium">{t("pwa.installTitle", language)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {ios
            ? t("pwa.installHintIos", language)
            : t("pwa.installHint", language)}
        </p>
      </div>
      <Button
        type="button"
        className="min-h-11 w-full sm:w-auto"
        disabled={!canInstall && !ios}
        onClick={() => void install()}
      >
        <Download className="h-4 w-4" />
        {t("pwa.installAction", language)}
      </Button>
      {showIosHelp ? (
        <IosInstallHelp
          language={language}
          onClose={() => setShowIosHelp(false)}
        />
      ) : null}
    </section>
  );
}

function IosInstallHelp({
  language,
  onClose,
}: {
  language: Language;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-3 flex items-center gap-2">
          <Share className="h-4 w-4 text-primary" />
          <p className="font-medium">{t("pwa.iosHelpTitle", language)}</p>
        </div>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>{t("pwa.iosStep1", language)}</li>
          <li>{t("pwa.iosStep2", language)}</li>
          <li>{t("pwa.iosStep3", language)}</li>
        </ol>
        <Button type="button" className="mt-4 min-h-11 w-full" onClick={onClose}>
          {t("common.done", language)}
        </Button>
      </div>
    </div>
  );
}
