"use client";

import { Globe } from "lucide-react";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  BIBLE_VERSION_BADGE,
  type BibleVersion,
} from "@/lib/config";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

const OPTIONS: {
  value: BibleVersion;
  labelKey:
    | "bible.viewMm"
    | "bible.viewEn"
    | "bible.viewChin"
    | "bible.viewKjv";
  hint: string;
}[] = [
  { value: "mm", labelKey: "bible.viewMm", hint: "Myanmar" },
  { value: "en", labelKey: "bible.viewEn", hint: "English (WEB)" },
  { value: "chin", labelKey: "bible.viewChin", hint: "Tedim Chin" },
  { value: "kjv", labelKey: "bible.viewKjv", hint: "King James" },
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
    <>
      <button
        type="button"
        aria-label={t("bible.language", language)}
        aria-expanded={open}
        onClick={() => onOpenChange(true)}
        className="relative flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-gradient-to-br from-card to-primary/15 text-foreground shadow-[0_0_20px_-10px_hsl(var(--primary))]"
      >
        <Globe className="h-4 w-4 text-primary" />
        <span className="absolute -bottom-1 -right-1 rounded-full bg-gradient-to-r from-primary to-fuchsia-400 px-1.5 py-px text-[9px] font-semibold leading-none text-primary-foreground">
          {badge}
        </span>
      </button>

      <Modal
        open={open}
        onClose={() => onOpenChange(false)}
        title={t("bible.versionsTitle", language)}
        blur
        className="max-w-md"
      >
        <p className="mb-4 text-sm text-muted-foreground">
          {t("bible.versionsHint", language)}
        </p>
        <div className="space-y-2">
          {OPTIONS.map((opt) => {
            const checked = value.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={cn(
                  "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                  checked
                    ? "border-primary/50 bg-primary/10 shadow-[0_0_24px_-14px_hsl(var(--primary))]"
                    : "border-border/80 bg-muted/30 hover:border-primary/30",
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(opt.value)}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{t(opt.labelKey, language)}</p>
                  <p className="text-xs text-muted-foreground">{opt.hint}</p>
                </div>
                <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {BIBLE_VERSION_BADGE[opt.value]}
                </span>
              </label>
            );
          })}
        </div>
        <div className="mt-5 flex justify-end">
          <Button className="min-h-11 btn-glow border-0" onClick={() => onOpenChange(false)}>
            {t("common.done", language)}
          </Button>
        </div>
      </Modal>
    </>
  );
}
