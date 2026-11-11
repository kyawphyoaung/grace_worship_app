"use client";

import { useEffect, useState } from "react";
import {
  getTogetherDuration,
  toMyanmarDigits,
  type TogetherDuration,
} from "@/lib/anniversary";
import { t, tf, type Language } from "@/lib/i18n";
import { useCouple } from "@/components/couple-provider";
import { UserAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";

export function TogetherCardSkeleton() {
  return (
    <section
      className="card-glow flex flex-col items-center gap-4 rounded-[1.75rem] border border-primary/25 px-5 py-7"
      aria-busy="true"
    >
      <div className="flex items-center gap-4">
        <Skeleton className="h-[72px] w-[72px] rounded-full" />
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-[72px] w-[72px] rounded-full" />
      </div>
      <Skeleton className="h-4 w-28 rounded-lg" />
      <Skeleton className="h-12 w-24 rounded-xl" />
      <Skeleton className="h-3 w-40 rounded-lg" />
      <Skeleton className="h-3 w-48 rounded-lg" />
    </section>
  );
}

/** Anniversary / days-together — computed only after mount (no Date.now during prerender). */
export function TogetherCard({ language }: { language: Language }) {
  const { me, partner, myName, partnerName } = useCouple();
  const [duration, setDuration] = useState<TogetherDuration | null>(null);

  useEffect(() => {
    setDuration(getTogetherDuration(new Date()));
  }, []);

  const daysDisplay =
    duration == null
      ? "—"
      : language === "mm"
        ? toMyanmarDigits(duration.totalDays)
        : String(duration.totalDays);
  const monthsariesDisplay =
    duration == null
      ? "—"
      : language === "mm"
        ? toMyanmarDigits(duration.monthsaries)
        : String(duration.monthsaries);
  const anniversariesDisplay =
    duration == null
      ? "—"
      : language === "mm"
        ? toMyanmarDigits(duration.anniversaries)
        : String(duration.anniversaries);

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-primary/25 bg-gradient-to-b from-card via-card to-primary/5 px-5 py-7 text-center shadow-[0_0_48px_-16px_hsl(var(--primary)/0.55)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.18), transparent 55%)",
        }}
      />
      <div className="relative flex items-center justify-center gap-4 sm:gap-5">
        <UserAvatar
          userId={me.id}
          displayName={myName}
          avatarUrl={me.avatar_url}
          size={72}
        />
        <span className="animate-heart-pulse inline-flex" aria-hidden>
          <HeartIcon color="#ef4444" />
        </span>
        {partner ? (
          <UserAvatar
            userId={partner.id}
            displayName={partnerName}
            avatarUrl={partner.avatar_url}
            size={72}
          />
        ) : null}
      </div>
      <p className="relative mt-6 text-sm text-muted-foreground">
        {t("home.togetherFor", language)}
      </p>
      <p className="relative mt-1 flex items-baseline justify-center gap-2">
        <span className="text-5xl font-semibold tracking-tight text-primary">
          {daysDisplay}
        </span>
        <span className="text-sm text-muted-foreground">
          {t("home.daysSuffix", language)}
        </span>
      </p>
      <p className="relative mt-3 text-sm text-muted-foreground">
        {duration
          ? language === "mm"
            ? duration.sinceLabelMm
            : duration.sinceLabelEn
          : "\u00A0"}
      </p>
      <p className="relative mt-2 text-xs text-muted-foreground/90">
        {duration
          ? tf("home.monthsariesAnniversaries", language, {
              m: monthsariesDisplay,
              a: anniversariesDisplay,
            })
          : "\u00A0"}
      </p>
    </section>
  );
}

function HeartIcon({ color }: { color: string }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden
      style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
    >
      <path d="M12 21s-6.7-4.35-9.33-7.4C.5 11.2.7 7.9 3.2 6.1c2-1.5 4.6-.9 5.9 1.1C10.4 5.2 13 4.6 15 6.1c2.5 1.8 2.7 5.1.53 7.5C18.7 16.65 12 21 12 21z" />
    </svg>
  );
}
