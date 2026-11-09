"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { t, type Language } from "@/lib/i18n";
import { LanguageToggle } from "@/components/language-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCouple } from "@/components/couple-provider";
import { UserAvatar } from "@/components/user-avatar";

export function SettingsWorkspace({
  language,
  userId,
  reminderTime,
  displayName,
}: {
  language: Language;
  userId: string;
  reminderTime: string | null;
  displayName: string | null;
}) {
  const router = useRouter();
  const { me, myName } = useCouple();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(displayName ?? myName);
  const [reminder, setReminder] = useState(reminderTime?.slice(0, 5) ?? "08:00");
  const [message, setMessage] = useState<string | null>(null);

  const save = () => {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: name.trim() || null,
          prayer_reminder_time: `${reminder}:00`,
        })
        .eq("id", userId);
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage(t("settings.saved", language));
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        {t("settings.title", language)}
      </h1>

      <section className="space-y-4 rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/10 p-5">
        <div className="flex items-center gap-3">
          <UserAvatar
            userId={me.id}
            displayName={myName}
            avatarUrl={me.avatar_url}
            size={56}
          />
          <div>
            <p className="font-medium">{myName}</p>
            <p className="text-xs text-muted-foreground">
              {t("settings.profile", language)}
            </p>
          </div>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">
            {t("settings.displayName", language)}
          </span>
          <Input
            className="min-h-11 bg-background"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-medium">{t("language.label", language)}</p>
        <p className="text-xs text-muted-foreground">
          {t("settings.languageHint", language)}
        </p>
        <LanguageToggle userId={userId} language={language} />
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">
            {t("prayer.reminderTime", language)}
          </span>
          <Input
            type="time"
            className="min-h-11 max-w-xs bg-background"
            value={reminder}
            onChange={(e) => setReminder(e.target.value)}
          />
        </label>
        <p className="text-xs text-muted-foreground">
          {t("prayer.reminderHint", language)}
        </p>
      </section>

      {message ? (
        <p className="rounded-lg bg-primary/15 px-3 py-2 text-sm text-primary">
          {message}
        </p>
      ) : null}

      <Button className="min-h-11 w-full sm:w-auto" disabled={pending} onClick={save}>
        {t("common.save", language)}
      </Button>
    </div>
  );
}
