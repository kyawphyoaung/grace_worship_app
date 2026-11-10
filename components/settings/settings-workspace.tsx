"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { t, type Language } from "@/lib/i18n";
import { LanguageToggle } from "@/components/language-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCouple } from "@/components/couple-provider";
import { UserAvatar } from "@/components/user-avatar";
import { useToast } from "@/components/ui/toast";
import { InstallSettingsCard } from "@/components/pwa/install-prompt";
import type { Database } from "@/types/database";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

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
  const { me, myName, partner, partnerName } = useCouple();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(displayName ?? myName);
  const [reminder, setReminder] = useState(reminderTime?.slice(0, 5) ?? "08:00");
  const [message, setMessage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = () => {
    startTransition(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);
      setNotifications(data ?? []);
    });
  };

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, [userId]);

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

  const deleteOne = (id: string) => {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) {
        showToast(error.message);
        return;
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    });
  };

  const deleteAll = () => {
    if (!window.confirm(t("settings.deleteAllNotificationsConfirm", language))) {
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", userId);
      if (error) {
        showToast(error.message);
        return;
      }
      setNotifications([]);
      showToast(t("settings.notificationsCleared", language));
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

      <InstallSettingsCard language={language} />

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium">
              {t("settings.notifications", language)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("settings.notificationsHint", language)}
            </p>
          </div>
          {notifications.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-10 shrink-0"
              disabled={pending}
              onClick={deleteAll}
            >
              {t("settings.deleteAll", language)}
            </Button>
          ) : null}
        </div>

        {notifications.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
            {t("notifications.empty", language)}
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {notifications.map((n) => {
              const actorName =
                partner && partner.id === n.actor_id ? partnerName : partnerName;
              return (
                <li
                  key={n.id}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <UserAvatar
                    userId={n.actor_id}
                    displayName={actorName}
                    avatarUrl={
                      partner && partner.id === n.actor_id
                        ? partner.avatar_url
                        : null
                    }
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{n.message}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={t("common.delete", language)}
                    className="flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"
                    disabled={pending}
                    onClick={() => deleteOne(n.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
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
