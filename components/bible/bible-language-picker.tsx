"use client";

import { Globe } from "lucide-react";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type BibleViewMode = "mm" | "en" | "chin";

const OPTIONS: { value: BibleViewMode; labelKey: "bible.viewMm" | "bible.viewEn" | "bible.viewChin" }[] =
  [
    { value: "mm", labelKey: "bible.viewMm" },
    { value: "en", labelKey: "bible.viewEn" },
    { value: "chin", labelKey: "bible.viewChin" },
  ];

export function BibleLanguagePicker({
  language,
  value,
  open,
  onOpenChange,
  onChange,
}: {
  language: Language;
  value: BibleViewMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (mode: BibleViewMode) => void;
}) {
  const badge = t(
    value === "mm"
      ? "bible.viewMm"
      : value === "en"
        ? "bible.viewEn"
        : "bible.viewChin",
    language,
  );

  return (
    <div className="relative flex min-w-0 items-center">
      <button
        type="button"
        aria-label={t("bible.language", language)}
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="relative flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground"
      >
        <Globe className="h-4 w-4" />
        <span className="absolute -bottom-1 -right-1 rounded-full bg-primary px-1.5 py-px text-[9px] font-semibold leading-none text-primary-foreground">
          {badge}
        </span>
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          open ? "ml-2 max-w-[220px] opacity-100" : "ml-0 max-w-0 opacity-0",
        )}
      >
        <div className="flex gap-1 rounded-xl bg-muted/80 p-1">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                onOpenChange(false);
              }}
              className={cn(
                "min-h-9 rounded-lg px-2.5 text-xs font-medium transition-colors",
                value === opt.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(opt.labelKey, language)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
