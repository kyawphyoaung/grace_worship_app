"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { CalendarDays } from "lucide-react";
import {
  listUpcomingEvents,
  type UpcomingEventRow,
} from "@/lib/actions/worship";
import { t, type Language } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";

export function UpcomingEventsCardSkeleton() {
  return (
    <section
      className="overflow-hidden rounded-3xl border border-teal-400/25 bg-gradient-to-br from-card via-card to-teal-950/30 p-5"
      aria-busy="true"
    >
      <div className="mb-3 flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-36 rounded-lg" />
      </div>
      <div className="space-y-2.5">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    </section>
  );
}

/** Loads upcoming events after mount so the server page never calls Date.now(). */
export function UpcomingEventsCard({ language }: { language: Language }) {
  const [events, setEvents] = useState<UpcomingEventRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { events: rows } = await listUpcomingEvents(8);
      if (!cancelled) setEvents(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (events == null) {
    return <UpcomingEventsCardSkeleton />;
  }

  if (events.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-3xl border border-teal-400/25 bg-gradient-to-br from-card via-card to-teal-950/30 p-5 shadow-[0_0_40px_-18px_hsl(168_55%_40%/0.45)]">
      <div className="mb-3 flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
          {t("home.upcomingEvents", language)}
        </h2>
      </div>
      <ul className="space-y-2.5">
        {events.map((event) => (
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
  );
}
