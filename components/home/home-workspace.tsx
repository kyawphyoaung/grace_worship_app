"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { CalendarDays, RefreshCw } from "lucide-react";
import { DAILY_VERSES } from "@/lib/verses/daily";
import { getTogetherDuration, toMyanmarDigits } from "@/lib/anniversary";
import { t, tf, type Language } from "@/lib/i18n";
import { useCouple } from "@/components/couple-provider";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";

type UpcomingEvent = {
  id: string;
  event_name: string;
  event_date: string;
  event_type: string;
  role: string;
};

export function HomeWorkspace({
  language,
  continueSession,
  genesis,
  upcomingEvents,
}: {
  language: Language;
  continueSession: {
    bookId: string;
    chapter: number;
    nameEn: string;
    nameMm: string;
  } | null;
  genesis: { bookId: string; nameEn: string; nameMm: string } | null;
  upcomingEvents: UpcomingEvent[];
}) {
  const { me, partner, myName, partnerName } = useCouple();
  const [verseIndex, setVerseIndex] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setVerseIndex(Math.floor(Math.random() * DAILY_VERSES.length));
    setReady(true);
  }, []);

  const verse = DAILY_VERSES[verseIndex] ?? DAILY_VERSES[0];
  const duration = useMemo(() => getTogetherDuration(), []);

  const primaryText = language === "mm" ? verse.text_mm : verse.text_en;
  const secondaryText = language === "mm" ? verse.text_en : verse.text_mm;
  const daysDisplay =
    language === "mm"
      ? toMyanmarDigits(duration.totalDays)
      : String(duration.totalDays);
  const monthsariesDisplay =
    language === "mm"
      ? toMyanmarDigits(duration.monthsaries)
      : String(duration.monthsaries);
  const anniversariesDisplay =
    language === "mm"
      ? toMyanmarDigits(duration.anniversaries)
      : String(duration.anniversaries);

  const continueHref = continueSession
    ? `/bible?book=${continueSession.bookId}&chapter=${continueSession.chapter}`
    : genesis
      ? `/bible?book=${genesis.bookId}&chapter=1`
      : "/bible";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card p-5 shadow-[0_0_40px_-18px_hsl(var(--primary))]">
        <button
          type="button"
          aria-label="Refresh verse"
          className="absolute right-3 top-3 flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() =>
            setVerseIndex((i) => {
              if (DAILY_VERSES.length < 2) return i;
              let next = i;
              while (next === i) {
                next = Math.floor(Math.random() * DAILY_VERSES.length);
              }
              return next;
            })
          }
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <p
          className={`mm-text pr-10 text-lg leading-relaxed text-foreground transition-opacity ${ready ? "opacity-100" : "opacity-0"}`}
        >
          {primaryText}
        </p>
        <p
          className={`mt-3 text-sm leading-relaxed text-muted-foreground transition-opacity ${ready ? "opacity-100" : "opacity-0"}`}
        >
          {secondaryText}
        </p>
        <p
          className={`mt-4 text-xs font-medium text-primary transition-opacity ${ready ? "opacity-100" : "opacity-0"}`}
        >
          {verse.ref_mm} · {verse.ref_en}
        </p>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {continueSession
            ? t("home.lastRead", language)
            : t("home.startReading", language)}
        </p>
        {continueSession ? (
          <p className="mt-2 text-xl font-semibold">
            {language === "mm" ? continueSession.nameMm : continueSession.nameEn}{" "}
            {continueSession.chapter}
            <span className="mt-1 block text-sm font-normal text-muted-foreground">
              {language === "mm" ? continueSession.nameEn : continueSession.nameMm}
            </span>
          </p>
        ) : genesis ? (
          <p className="mt-2 text-xl font-semibold">
            {language === "mm" ? genesis.nameMm : genesis.nameEn} 1
          </p>
        ) : (
          <p className="mt-2 text-muted-foreground">{t("common.empty", language)}</p>
        )}
        <Button asChild className="mt-4 min-h-11 w-full sm:w-auto">
          <Link href={continueHref}>
            {continueSession
              ? t("home.continueReading", language)
              : t("home.startReading", language)}
          </Link>
        </Button>
      </section>

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
          {language === "mm" ? duration.sinceLabelMm : duration.sinceLabelEn}
        </p>
        <p className="relative mt-2 text-xs text-muted-foreground/90">
          {tf("home.monthsariesAnniversaries", language, {
            m: monthsariesDisplay,
            a: anniversariesDisplay,
          })}
        </p>
      </section>

      {upcomingEvents.length > 0 ? (
        <section className="overflow-hidden rounded-3xl border border-teal-400/25 bg-gradient-to-br from-card via-card to-teal-950/30 p-5 shadow-[0_0_40px_-18px_hsl(168_55%_40%/0.45)]">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
              {t("home.upcomingEvents", language)}
            </h2>
          </div>
          <ul className="space-y-2.5">
            {upcomingEvents.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/worship?event=${event.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/30 px-3 py-3 transition hover:border-primary/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{event.event_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(event.event_date), "EEE · MMM d, yyyy")}
                      {" · "}
                      {event.role}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-primary">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
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
