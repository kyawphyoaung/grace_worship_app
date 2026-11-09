"use client";

import { Globe } from "lucide-react";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  BIBLE_VERSION_BADGE,
  type BibleVersion,
} from "@/lib/config";
import { Checkbox } from "@/components/ui/checkbox";

const OPTIONS: {
  value: BibleVersion;
  labelKey:
    | "bible.viewMm"
    | "bible.viewEn"
    | "bible.viewChin"
    | "bible.viewKjv";
}[] = [
  { value: "mm", labelKey: "bible.viewMm" },
  { value: "en", labelKey: "bible.viewEn" },
  { value: "chin", labelKey: "bible.viewChin" },
  { value: "kjv", labelKey: "bible.viewKjv" },
];

export type BibleViewMode = BibleVersion;

export function BibleLanguagePicker({
  language,
  value,
  open,
  onOpenChange,
  onChange,
}: {
  language: Language;
  value: BibleVersion[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (versions: BibleVersion[]) => void;
}) {
  const badge =
    value.length === 0
      ? "—"
      : value.length === 1
        ? BIBLE_VERSION_BADGE[value[0]]
        : String(value.length);

  const toggle = (version: BibleVersion) => {
    const has = value.includes(version);
    if (has) {
      if (value.length === 1) return;
      onChange(value.filter((v) => v !== version));
      return;
    }
    onChange([...value, version]);
  };

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
          open ? "ml-2 max-w-[280px] opacity-100" : "ml-0 max-w-0 opacity-0",
        )}
      >
        <div className="min-w-[220px] space-y-1 rounded-xl bg-muted/80 p-2">
          <p className="px-1 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            {t("bible.selectVersions", language)}
          </p>
          {OPTIONS.map((opt) => {
            const checked = value.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={cn(
                  "flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs font-medium transition-colors",
                  checked
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(opt.value)}
                />
                <span>{t(opt.labelKey, language)}</span>
                <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {BIBLE_VERSION_BADGE[opt.value]}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
