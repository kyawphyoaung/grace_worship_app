"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { DAILY_VERSES } from "@/lib/verses/daily";
import { t, type Language } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  TogetherCard,
  TogetherCardSkeleton,
} from "@/components/home/together-card";
import {
  UpcomingEventsCard,
  UpcomingEventsCardSkeleton,
} from "@/components/home/upcoming-events-card";

export function HomeWorkspace({
  language,
  continueSession,
  genesis,
}: {
  language: Language;
  continueSession: {
    bookId: string;
    chapter: number;
    nameEn: string;
    nameMm: string;
  } | null;
  genesis: { bookId: string; nameEn: string; nameMm: string } | null;
}) {
  const [verseIndex, setVerseIndex] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setVerseIndex(Math.floor(Math.random() * DAILY_VERSES.length));
    setReady(true);
  }, []);

  const verse = DAILY_VERSES[verseIndex] ?? DAILY_VERSES[0];
  const primaryText = language === "mm" ? verse.text_mm : verse.text_en;
  const secondaryText = language === "mm" ? verse.text_en : verse.text_mm;

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

      <Suspense fallback={<TogetherCardSkeleton />}>
        <TogetherCard language={language} />
      </Suspense>

      <Suspense fallback={<UpcomingEventsCardSkeleton />}>
        <UpcomingEventsCard language={language} />
      </Suspense>
    </div>
  );
}
