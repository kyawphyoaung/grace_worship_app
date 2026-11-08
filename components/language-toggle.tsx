"use client";

import { createClient } from "@/lib/supabase/client";
import { t, type Language } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

export function LanguageToggle({
  userId,
  language,
  className,
}: {
  userId: string;
  language: Language;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState<Language>(language);

  const setLanguage = (next: Language) => {
    if (next === current || pending) return;
    setCurrent(next);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ preferred_language: next })
        .eq("id", userId);
      if (error) {
        setCurrent(language);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div
      className={cn("inline-flex items-center gap-1 rounded-lg bg-muted p-1", className)}
      role="group"
      aria-label={t("language.label", current)}
    >
      {(["en", "mm"] as const).map((code) => (
        <button
          key={code}
          type="button"
          disabled={pending}
          onClick={() => setLanguage(code)}
          className={cn(
            "min-h-11 min-w-11 rounded-md px-3 text-sm font-medium transition-colors",
            current === code
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {code === "en" ? "EN" : "MM"}
        </button>
      ))}
    </div>
  );
}
