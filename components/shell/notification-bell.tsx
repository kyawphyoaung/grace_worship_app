"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { t, type Language } from "@/lib/i18n";
import { useCouple } from "@/components/couple-provider";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { resolveDisplayName } from "@/lib/display-name";
import type { Database } from "@/types/database";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function NotificationBell({
  language,
  userId,
}: {
  language: Language;
  userId: string;
}) {
  const { partner, partnerName } = useCouple();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Notification[]>([]);
  const [pending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = () => {
    startTransition(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      setRows(data ?? []);
    });
  };

  useEffect(() => {
    load();
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          load();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load on mount / user change only
  }, [userId]);

  const unread = useMemo(
    () => rows.filter((r) => r.read_at == null).length,
    [rows],
  );

  const actorProfile = (actorId: string): Profile | null => {
    if (partner && partner.id === actorId) return partner;
    return null;
  };

  const markAllRead = () => {
    startTransition(async () => {
      const supabase = createClient();
      const now = new Date().toISOString();
      await supabase
        .from("notifications")
        .update({ read_at: now })
        .eq("user_id", userId)
        .is("read_at", null);
      setRows((prev) =>
        prev.map((r) => (r.read_at ? r : { ...r, read_at: now })),
      );
    });
  };

  const markOneRead = (id: string) => {
    startTransition(async () => {
      const supabase = createClient();
      const now = new Date().toISOString();
      await supabase
        .from("notifications")
        .update({ read_at: now })
        .eq("id", id)
        .eq("user_id", userId);
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, read_at: now } : r)),
      );
    });
  };

  const panel =
    open && mounted
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[60] cursor-default bg-black/20"
              aria-label="Close"
              onClick={() => setOpen(false)}
            />
            <div
              role="dialog"
              aria-label={t("notifications.title", language)}
              className={cn(
                "fixed z-[70] overflow-hidden rounded-2xl border border-border bg-popover shadow-xl",
                "right-4 top-[4.25rem] w-[min(22rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)]",
                "left-auto sm:left-auto",
              )}
            >
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <p className="text-sm font-medium">
                  {t("notifications.title", language)}
                </p>
                {unread > 0 ? (
                  <Button
                    variant="ghost"
                    className="h-8 px-2 text-xs"
                    disabled={pending}
                    onClick={markAllRead}
                  >
                    {t("notifications.markAllRead", language)}
                  </Button>
                ) : null}
              </div>
              <ul className="max-h-[min(20rem,70vh)] overflow-y-auto">
                {rows.length === 0 ? (
                  <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {t("notifications.empty", language)}
                  </li>
                ) : (
                  rows.map((n) => {
                    const actor = actorProfile(n.actor_id);
                    const name = actor
                      ? resolveDisplayName(
                          actor.id,
                          actor.display_name,
                          partnerName,
                        )
                      : partnerName;
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          className={cn(
                            "flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-muted/50",
                            !n.read_at && "bg-primary/5",
                          )}
                          onClick={() => {
                            if (!n.read_at) markOneRead(n.id);
                          }}
                        >
                          <UserAvatar
                            userId={n.actor_id}
                            displayName={name}
                            avatarUrl={actor?.avatar_url ?? null}
                            size={36}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-snug text-foreground">
                              {n.message}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {formatDistanceToNow(new Date(n.created_at), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                          {!n.read_at ? (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                          ) : null}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={t("notifications.title", language)}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
        className="relative flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-card text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {panel}
    </div>
  );
}
