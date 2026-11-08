"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { DAILY_VERSES } from "@/lib/verses/daily";
import { getTogetherDuration } from "@/lib/anniversary";
import { t, tf, type Language } from "@/lib/i18n";
import { useCouple } from "@/components/couple-provider";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";

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
  const { me, partner } = useCouple();
  const [verseIndex, setVerseIndex] = useState(() =>
    Math.floor(Math.random() * DAILY_VERSES.length),
  );
  const verse = DAILY_VERSES[verseIndex] ?? DAILY_VERSES[0];
  const duration = useMemo(() => getTogetherDuration(), []);

  const primaryText = language === "mm" ? verse.text_mm : verse.text_en;
  const secondaryText = language === "mm" ? verse.text_en : verse.text_mm;

  const continueHref = continueSession
    ? `/bible?book=${continueSession.bookId}&chapter=${continueSession.chapter}`
    : genesis
      ? `/bible?book=${genesis.bookId}&chapter=1`
      : "/bible";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      {/* Daily verse */}
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
        <p className="mm-text pr-10 text-lg leading-relaxed text-foreground">
          {primaryText}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {secondaryText}
        </p>
        <p className="mt-4 text-xs font-medium text-primary">
          {verse.ref_mm} · {verse.ref_en}
        </p>
      </section>

      {/* Continue reading */}
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

      {/* Anniversary */}
      <section className="rounded-3xl border border-border bg-card p-6 text-center">
        <div className="flex items-center justify-center gap-3">
          <UserAvatar
            userId={me.id}
            displayName={me.display_name}
            avatarUrl={me.avatar_url}
            size={72}
          />
          <HeartLarge />
          {partner ? (
            <UserAvatar
              userId={partner.id}
              displayName={partner.display_name}
              avatarUrl={partner.avatar_url}
              size={72}
            />
          ) : null}
        </div>
        <p className="mt-5 text-sm text-muted-foreground">
          {t("home.togetherFor", language)}
        </p>
        <p className="mt-1 text-4xl font-semibold text-primary">
          {duration.totalDays}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {tf("home.yearsMonthsDays", language, {
            y: String(duration.years),
            m: String(duration.months),
            d: String(duration.days),
          })}
        </p>
      </section>
    </div>
  );
}

function HeartLarge() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      className="text-primary"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 21s-6.7-4.35-9.33-7.4C.5 11.2.7 7.9 3.2 6.1c2-1.5 4.6-.9 5.9 1.1C10.4 5.2 13 4.6 15 6.1c2.5 1.8 2.7 5.1.53 7.5C18.7 16.65 12 21 12 21z" />
    </svg>
  );
}
