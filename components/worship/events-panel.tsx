"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { t, tf, type Language } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import {
  EVENT_ROLES,
  EVENT_TYPES,
  type EventRole,
  type EventType,
} from "@/lib/worship/constants";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type View = "list" | "calendar";

export function EventsPanel({
  language,
  userId,
  events,
  setlistCounts,
  onOpenEvent,
}: {
  language: Language;
  userId: string;
  events: EventRow[];
  setlistCounts: Record<string, number>;
  onOpenEvent: (eventId: string) => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<View>("list");
  const [month, setMonth] = useState(new Date());
  const [editing, setEditing] = useState<EventRow | null | "new">(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [eventType, setEventType] = useState<EventType>("sunday");
  const [role, setRole] = useState<EventRole>("leader");
  const [notes, setNotes] = useState("");

  const sorted = useMemo(
    () =>
      [...events].sort((a, b) =>
        a.event_date < b.event_date
          ? 1
          : a.event_date > b.event_date
            ? -1
            : 0,
      ),
    [events],
  );

  const datesWithEvents = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const e of events) {
      const list = map.get(e.event_date) ?? [];
      list.push(e);
      map.set(e.event_date, list);
    }
    return map;
  }, [events]);

  const openNew = (presetDate?: string) => {
    setEditing("new");
    setName("");
    setDate(presetDate ?? format(new Date(), "yyyy-MM-dd"));
    setEventType("sunday");
    setRole("leader");
    setNotes("");
  };

  const openEdit = (event: EventRow) => {
    setEditing(event);
    setName(event.event_name);
    setDate(event.event_date);
    setEventType(event.event_type as EventType);
    setRole(event.role as EventRole);
    setNotes(event.notes ?? "");
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "sunday":
        return t("worship.typeSunday", language);
      case "saturday":
        return t("worship.typeSaturday", language);
      case "wednesday":
        return t("worship.typeWednesday", language);
      default:
        return t("worship.typeCustom", language);
    }
  };

  const roleLabel = (r: string) => {
    if (r === "leader") return t("worship.roleLeader", language);
    if (r === "backup") return t("worship.roleBackup", language);
    return t("worship.roleParticipant", language);
  };

  const save = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      const supabase = createClient();
      if (editing && editing !== "new") {
        const { error } = await supabase
          .from("events")
          .update({
            event_name: name.trim(),
            event_date: date,
            event_type: eventType,
            role,
            notes: notes.trim() || null,
          })
          .eq("id", editing.id);
        if (error) {
          showToast(error.message);
          return;
        }
      } else {
        const { error } = await supabase.from("events").insert({
          user_id: userId,
          event_name: name.trim(),
          event_date: date,
          event_type: eventType,
          role,
          notes: notes.trim() || null,
        });
        if (error) {
          showToast(error.message);
          return;
        }
      }
      showToast(t("worship.eventSaved", language));
      setEditing(null);
      router.refresh();
    });
  };

  const remove = (event: EventRow) => {
    if (!window.confirm(t("worship.deleteEventConfirm", language))) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("events").delete().eq("id", event.id);
      if (error) {
        showToast(error.message);
        return;
      }
      showToast(t("worship.eventDeleted", language));
      setEditing(null);
      router.refresh();
    });
  };

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = monthStart.getDay();

  const dayEvents = selectedDay ? (datesWithEvents.get(selectedDay) ?? []) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: "list", label: t("worship.list", language) },
            { value: "calendar", label: t("worship.calendar", language) },
          ]}
        />
        <Button className="min-h-11" onClick={() => openNew()}>
          <Plus className="h-4 w-4" />
          {t("worship.addEvent", language)}
        </Button>
      </div>

      {view === "list" ? (
        sorted.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-primary/25 bg-card/60 px-5 py-12 text-center">
            <CalendarDays className="mx-auto mb-3 h-8 w-8 text-primary/70" />
            <p className="text-sm text-muted-foreground">
              {t("worship.noEvents", language)}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {sorted.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onOpenEvent(event.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    openEdit(event);
                  }}
                  className="card-glow w-full rounded-2xl border border-primary/15 p-4 text-left transition hover:border-primary/35"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-primary">
                        {format(parseISO(event.event_date), "EEE · MMM d, yyyy")}
                      </p>
                      <p className="mt-1 truncate text-base font-semibold">
                        {event.event_name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {typeLabel(event.event_type)} · {roleLabel(event.role)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-secondary-foreground">
                        {tf("worship.songsCount", language, {
                          n: String(setlistCounts[event.id] ?? 0),
                        })}
                      </span>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(event);
                        }}
                      >
                        {t("common.edit", language)}
                      </button>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl hover:bg-muted"
              onClick={() => setMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="font-semibold">{format(month, "MMMM yyyy")}</p>
            <button
              type="button"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl hover:bg-muted"
              onClick={() => setMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={`${d}-${i}`} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const has = datesWithEvents.has(key);
              const selected = selectedDay === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(key)}
                  onDoubleClick={() => openNew(key)}
                  className={cn(
                    "flex min-h-11 flex-col items-center justify-center rounded-xl text-sm transition",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : has
                        ? "bg-primary/15 text-foreground"
                        : "hover:bg-muted",
                    isSameDay(day, new Date()) && !selected
                      ? "ring-1 ring-accent/60"
                      : null,
                  )}
                >
                  {format(day, "d")}
                  {has ? (
                    <span
                      className={cn(
                        "mt-0.5 h-1 w-1 rounded-full",
                        selected ? "bg-primary-foreground" : "bg-accent",
                      )}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          {selectedDay ? (
            <div className="rounded-2xl border border-border bg-card/70 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">
                  {format(parseISO(selectedDay), "MMM d, yyyy")}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="min-h-9"
                  onClick={() => openNew(selectedDay)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("worship.addEvent", language)}
                </Button>
              </div>
              {dayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("common.empty", language)}
                </p>
              ) : (
                <ul className="space-y-2">
                  {dayEvents.map((event) => (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => onOpenEvent(event.id)}
                        className="w-full rounded-xl border border-border/70 px-3 py-2 text-left hover:border-primary/40"
                      >
                        <p className="font-medium">{event.event_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {typeLabel(event.event_type)} · {roleLabel(event.role)}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={
          editing && editing !== "new"
            ? t("worship.editEvent", language)
            : t("worship.addEvent", language)
        }
        className="max-w-md"
        blur
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="event-name">{t("worship.eventName", language)}</Label>
            <Input
              id="event-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-11"
              placeholder="Sunday Worship"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event-date">{t("worship.eventDate", language)}</Label>
            <Input
              id="event-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="min-h-11"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("worship.eventType", language)}</Label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="flex h-11 w-full rounded-md border border-input bg-transparent px-2 text-sm"
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {typeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("worship.eventRole", language)}</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as EventRole)}
                className="flex h-11 w-full rounded-md border border-input bg-transparent px-2 text-sm"
              >
                {EVENT_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event-notes">{t("worship.eventNotes", language)}</Label>
            <textarea
              id="event-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => setEditing(null)}
            >
              {t("common.cancel", language)}
            </Button>
            <Button
              type="button"
              className="min-h-11"
              disabled={pending || !name.trim()}
              onClick={save}
            >
              {t("common.save", language)}
            </Button>
          </div>
          {editing && editing !== "new" ? (
            <Button
              type="button"
              variant="destructive"
              className="min-h-11 w-full"
              disabled={pending}
              onClick={() => remove(editing)}
            >
              {t("common.delete", language)}
            </Button>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
