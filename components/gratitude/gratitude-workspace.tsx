"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  parseISO,
} from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { t, tf, type Language } from "@/lib/i18n";
import { Segmented } from "@/components/ui/segmented";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useCouple } from "@/components/couple-provider";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Entry = Database["public"]["Tables"]["gratitude_entries"]["Row"];
type View = "list" | "calendar" | "monthly";

export function GratitudeWorkspace({
  language,
  userId,
  entries,
}: {
  language: Language;
  userId: string;
  entries: Entry[];
}) {
  const router = useRouter();
  const { partnerName } = useCouple();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<View>("list");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [entryDate, setEntryDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [message, setMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.content.toLowerCase().includes(q));
  }, [entries, query]);

  const datesWithEntries = useMemo(
    () => new Set(entries.map((e) => e.entry_date)),
    [entries],
  );

  const monthKey = format(calendarMonth, "yyyy-MM");
  const monthlyEntries = useMemo(
    () => entries.filter((e) => e.entry_date.startsWith(monthKey)),
    [entries, monthKey],
  );

  const save = () => {
    if (!content.trim()) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("gratitude_entries").insert({
        user_id: userId,
        content: content.trim(),
        entry_date: entryDate,
        is_shared: isShared,
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setOpen(false);
      setContent("");
      setIsShared(false);
      router.refresh();
    });
  };

  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold">{t("gratitude.title", language)}</h2>
        <Button className="min-h-11" onClick={() => setOpen(true)}>
          {t("gratitude.addEntry", language)}
        </Button>
      </div>

      {message ? (
        <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
          {message}
        </p>
      ) : null}

      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: "list", label: t("gratitude.list", language) },
          { value: "calendar", label: t("gratitude.calendar", language) },
          { value: "monthly", label: t("gratitude.monthly", language) },
        ]}
      />

      {view === "list" ? (
        <div className="space-y-3">
          <Input
            className="min-h-11 bg-card"
            placeholder={t("gratitude.searchPlaceholder", language)}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ul className="space-y-2">
            {filtered.length === 0 ? (
              <li className="text-sm text-muted-foreground">
                {t("common.empty", language)}
              </li>
            ) : (
              filtered.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-border bg-card p-3"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{entry.entry_date}</span>
                    <span>
                      {entry.is_shared
                        ? t("common.shared", language)
                        : t("common.private", language)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed">{entry.content}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}

      {view === "calendar" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() =>
                setCalendarMonth(
                  new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth() - 1,
                    1,
                  ),
                )
              }
            >
              ‹
            </Button>
            <p className="font-medium">{format(calendarMonth, "MMMM yyyy")}</p>
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() =>
                setCalendarMonth(
                  new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth() + 1,
                    1,
                  ),
                )
              }
            >
              ›
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={`${d}-${i}`} className="py-1">
                {d}
              </div>
            ))}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const active = datesWithEntries.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  className={cn(
                    "flex min-h-11 items-center justify-center rounded-lg text-sm",
                    active && "bg-primary/20 text-primary",
                    isSameDay(day, new Date()) && "ring-1 ring-primary/40",
                  )}
                  onClick={() => {
                    setEntryDate(key);
                    setOpen(true);
                  }}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {view === "monthly" ? (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() =>
                setCalendarMonth(
                  new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth() - 1,
                    1,
                  ),
                )
              }
            >
              ‹
            </Button>
            <div className="text-center">
              <p className="font-medium">{t("gratitude.thisMonth", language)}</p>
              <p className="text-sm text-muted-foreground">
                {format(calendarMonth, "MMMM yyyy")} · {monthlyEntries.length}{" "}
                {t("gratitude.entriesCount", language)}
              </p>
            </div>
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() =>
                setCalendarMonth(
                  new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth() + 1,
                    1,
                  ),
                )
              }
            >
              ›
            </Button>
          </div>
          <ul className="space-y-2">
            {monthlyEntries
              .slice()
              .sort((a, b) => a.entry_date.localeCompare(b.entry_date))
              .map((entry) => (
                <li key={entry.id} className="border-t border-border/60 pt-2 text-sm">
                  <span className="text-xs text-primary">
                    {format(parseISO(entry.entry_date), "MMM d")}
                  </span>
                  <p className="mt-0.5 leading-relaxed">{entry.content}</p>
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("gratitude.addEntry", language)}
      >
        <div className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="text-muted-foreground">Date</span>
            <Input
              type="date"
              className="min-h-11 bg-background"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
            />
          </label>
          <textarea
            className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder={t("gratitude.placeholder", language)}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <Checkbox
              checked={isShared}
              onCheckedChange={(v) => setIsShared(v === true)}
            />
            {tf("common.shareWithName", language, { name: partnerName })}
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" className="min-h-11" onClick={() => setOpen(false)}>
              {t("common.cancel", language)}
            </Button>
            <Button className="min-h-11" disabled={pending} onClick={save}>
              {t("common.save", language)}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
