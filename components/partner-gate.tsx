import { t, type Language } from "@/lib/i18n";

export function PartnerGate({ language }: { language: Language }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
        {t("appName", language)}
      </p>
      <h1 className="text-2xl font-semibold text-foreground">
        {t("partner.notLinkedTitle", language)}
      </h1>
      <p className="text-base leading-relaxed text-muted-foreground">
        {t("partner.notLinkedBody", language)}
      </p>
    </div>
  );
}
