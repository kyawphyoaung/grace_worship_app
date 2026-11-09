"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ListFilter } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { t, tf, type Language } from "@/lib/i18n";
import { Segmented } from "@/components/ui/segmented";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useCouple } from "@/components/couple-provider";
import { UserAvatar } from "@/components/user-avatar";
import { resolveDisplayName } from "@/lib/display-name";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Prayer = Database["public"]["Tables"]["prayers"]["Row"];
type Interaction = Database["public"]["Tables"]["prayer_interactions"]["Row"];

type FilterValue = "all" | "pending" | "answered" | "shared" | "private";
type Tab = "prayers" | "journal" | "settings";

export function PrayerWorkspace({
  language,
  userId,
  partnerId,
  prayers,
  interactions,
  reminderTime,
  mode = "full",
}: {
  language: Language;
  userId: string;
  partnerId: string | null;
  prayers: Prayer[];
  interactions: Interaction[];
  reminderTime: string | null;
  mode?: "full" | "journal-only";
}) {
  const router = useRouter();
  const { me, partner, partnerName, myName } = useCouple();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>(mode === "journal-only" ? "journal" : "prayers");
  const [filter, setFilter] = useState<FilterValue>(
    mode === "journal-only" ? "private" : "all",
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Prayer | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isShared, setIsShared] = useState(true);
  const [answeredOpen, setAnsweredOpen] = useState(false);
  const [answeredPrayer, setAnsweredPrayer] = useState<Prayer | null>(null);
  const [answeredAt, setAnsweredAt] = useState(format(new Date(), "yyyy-MM-dd"));
  const [testimony, setTestimony] = useState("");
  const [prayOpen, setPrayOpen] = useState(false);
  const [prayPrayer, setPrayPrayer] = useState<Prayer | null>(null);
  const [prayNote, setPrayNote] = useState("");
  const [reminder, setReminder] = useState(reminderTime?.slice(0, 5) ?? "08:00");
  const [message, setMessage] = useState<string | null>(null);

  const interactionsByPrayer = useMemo(() => {
    const map = new Map<string, Interaction[]>();
    for (const row of interactions) {
      const list = map.get(row.prayer_id) ?? [];
      list.push(row);
      map.set(row.prayer_id, list);
    }
    return map;
  }, [interactions]);

  const authorName = (prayer: Prayer) => {
    if (prayer.user_id === userId) return myName;
    return partnerName;
  };

  const authorProfile = (prayer: Prayer) => {
    if (prayer.user_id === userId) return me;
    return partner;
  };

  const visible = useMemo(() => {
    let rows = prayers;
    if (tab === "journal" || mode === "journal-only") {
      rows = rows.filter((p) => p.user_id === userId && !p.is_shared);
    }
    switch (filter) {
      case "pending":
        return rows.filter((p) => p.status === "pending");
      case "answered":
        return rows.filter((p) => p.status === "answered");
      case "shared":
        return rows.filter((p) => p.is_shared);
      case "private":
        return rows.filter((p) => !p.is_shared && p.user_id === userId);
      default:
        return rows;
    }
  }, [prayers, filter, tab, mode, userId]);

  const filterLabel = (value: FilterValue) => {
    switch (value) {
      case "pending":
        return t("prayer.filterPending", language);
      case "answered":
        return t("prayer.filterAnswered", language);
      case "shared":
        return t("prayer.filterShared", language);
      case "private":
        return t("prayer.filterPrivate", language);
      default:
        return t("prayer.filterAll", language);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setContent("");
    setIsShared(tab !== "journal");
    setFormOpen(true);
  };

  const openEdit = (prayer: Prayer) => {
    setEditing(prayer);
    setTitle(prayer.title);
    setContent(prayer.content);
    setIsShared(prayer.is_shared);
    setFormOpen(true);
  };

  const savePrayer = () => {
    if (!title.trim() || !content.trim()) return;
    startTransition(async () => {
      const supabase = createClient();
      if (editing) {
        const { error } = await supabase
          .from("prayers")
          .update({
            title: title.trim(),
            content: content.trim(),
            is_shared: isShared,
          })
          .eq("id", editing.id)
          .eq("user_id", userId);
        if (error) {
          setMessage(error.message);
          return;
        }
      } else {
        const { error } = await supabase.from("prayers").insert({
          user_id: userId,
          title: title.trim(),
          content: content.trim(),
          is_shared: isShared,
          status: "pending",
        });
        if (error) {
          setMessage(error.message);
          return;
        }
      }
      setFormOpen(false);
      router.refresh();
    });
  };

  const markAnswered = () => {
    if (!answeredPrayer) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("prayers")
        .update({
          status: "answered",
          answered_at: answeredAt,
          testimony: testimony.trim() || null,
        })
        .eq("id", answeredPrayer.id)
        .eq("user_id", userId);
      if (error) {
        setMessage(error.message);
        return;
      }
      setAnsweredOpen(false);
      setTestimony("");
      router.refresh();
    });
  };

  const savePrayFor = () => {
    if (!prayPrayer) return;
    startTransition(async () => {
      const supabase = createClient();
      const note = prayNote.trim();
      const { error } = await supabase.from("prayer_interactions").insert({
        prayer_id: prayPrayer.id,
        user_id: userId,
        interaction_type: "prayed_for",
        note: note || null,
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setPrayOpen(false);
      setPrayNote("");
      router.refresh();
    });
  };

  const saveReminder = () => {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ prayer_reminder_time: `${reminder}:00` })
        .eq("id", userId);
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage(t("prayer.reminderHint", language));
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          {mode === "journal-only"
            ? t("prayer.journal", language)
            : t("prayer.title", language)}
        </h1>
        {tab !== "settings" ? (
          <Button className="min-h-11" onClick={openCreate}>
            {t("prayer.addPrayer", language)}
          </Button>
        ) : null}
      </div>

      {mode === "full" ? (
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "prayers", label: t("prayer.prayers", language) },
            { value: "journal", label: t("prayer.journal", language) },
            { value: "settings", label: t("prayer.settings", language) },
          ]}
        />
      ) : null}

      {message ? (
        <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
          {message}
        </p>
      ) : null}

      {tab === "settings" ? (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <Labelish label={t("prayer.reminderTime", language)}>
            <Input
              type="time"
              className="min-h-11 max-w-xs bg-background"
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
            />
          </Labelish>
          <Button className="min-h-11" disabled={pending} onClick={saveReminder}>
            {t("common.save", language)}
          </Button>
          <p className="text-sm text-muted-foreground">
            {t("prayer.reminderHint", language)}
          </p>
        </div>
      ) : (
        <>
          <div className="relative flex items-center">
            <button
              type="button"
              aria-label={t("prayer.filter", language)}
              aria-expanded={filterOpen}
              onClick={() => setFilterOpen((v) => !v)}
              className="relative flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-card text-foreground"
            >
              <ListFilter className="h-4 w-4" />
              <span className="absolute -bottom-1 -right-1 max-w-[4.5rem] truncate rounded-full bg-primary px-1.5 py-px text-[9px] font-semibold leading-none text-primary-foreground">
                {filterLabel(filter)}
              </span>
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-out",
                filterOpen
                  ? "ml-2 max-w-[320px] opacity-100"
                  : "ml-0 max-w-0 opacity-0",
              )}
            >
              <div className="flex gap-1 rounded-xl bg-muted/80 p-1">
                {(
                  [
                    "all",
                    "pending",
                    "answered",
                    "shared",
                    "private",
                  ] as FilterValue[]
                ).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setFilter(value);
                      setFilterOpen(false);
                    }}
                    className={cn(
                      "min-h-9 rounded-lg px-2.5 text-xs font-medium transition-colors",
                      filter === value
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {filterLabel(value)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ul className="space-y-3">
            {visible.length === 0 ? (
              <li className="text-sm text-muted-foreground">
                {t("common.empty", language)}
              </li>
            ) : (
              visible.map((prayer) => {
                const rows = interactionsByPrayer.get(prayer.id) ?? [];
                const isMine = prayer.user_id === userId;
                const author = authorProfile(prayer);
                const name = authorName(prayer);
                const partnerPrayed = rows.some(
                  (r) =>
                    r.interaction_type === "prayed_for" &&
                    r.user_id !== prayer.user_id,
                );
                return (
                  <li
                    key={prayer.id}
                    className="rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        userId={prayer.user_id}
                        displayName={
                          author
                            ? resolveDisplayName(author.id, author.display_name, name)
                            : name
                        }
                        avatarUrl={author?.avatar_url ?? null}
                        size={32}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {format(new Date(prayer.created_at), "MMM d · h:mm a")}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs",
                          prayer.status === "answered"
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {prayer.status === "answered"
                          ? t("prayer.filterAnswered", language)
                          : t("prayer.filterPending", language)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {prayer.is_shared
                          ? t("common.shared", language)
                          : t("common.private", language)}
                      </span>
                      {partnerPrayed ? (
                        <span className="inline-flex items-center gap-1.5 text-primary">
                          {partner ? (
                            <UserAvatar
                              userId={partner.id}
                              displayName={partnerName}
                              avatarUrl={partner.avatar_url}
                              size={18}
                            />
                          ) : null}
                          {tf("prayer.namePrayed", language, {
                            name: partnerName,
                          })}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-2 text-lg font-medium">{prayer.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                      {prayer.content}
                    </p>
                    {prayer.testimony ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {prayer.testimony}
                      </p>
                    ) : null}

                    {rows
                      .filter((r) => r.note)
                      .map((r) => (
                        <p
                          key={r.id}
                          className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
                        >
                          {r.note}
                        </p>
                      ))}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {isMine ? (
                        <>
                          <Button
                            variant="secondary"
                            className="min-h-11"
                            onClick={() => openEdit(prayer)}
                          >
                            {t("common.edit", language)}
                          </Button>
                          {prayer.status === "pending" ? (
                            <Button
                              className="min-h-11"
                              onClick={() => {
                                setAnsweredPrayer(prayer);
                                setAnsweredAt(format(new Date(), "yyyy-MM-dd"));
                                setTestimony("");
                                setAnsweredOpen(true);
                              }}
                            >
                              {t("prayer.markAnswered", language)}
                            </Button>
                          ) : null}
                        </>
                      ) : null}
                      {!isMine && prayer.is_shared && partnerId ? (
                        <Button
                          className="min-h-11"
                          disabled={pending}
                          onClick={() => {
                            setPrayPrayer(prayer);
                            setPrayNote("");
                            setPrayOpen(true);
                          }}
                        >
                          {tf("prayer.prayForName", language, {
                            name: partnerName,
                          })}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={
          editing
            ? t("prayer.editPrayer", language)
            : t("prayer.addPrayer", language)
        }
      >
        <div className="space-y-4">
          <Labelish label={t("prayer.titleField", language)}>
            <Input
              className="min-h-11 bg-background"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Labelish>
          <Labelish label={t("prayer.contentField", language)}>
            <textarea
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </Labelish>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <Checkbox
              checked={isShared}
              onCheckedChange={(v) => setIsShared(v === true)}
            />
            {tf("common.shareWithName", language, { name: partnerName })}
          </label>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() => setFormOpen(false)}
            >
              {t("common.cancel", language)}
            </Button>
            <Button className="min-h-11" disabled={pending} onClick={savePrayer}>
              {t("common.save", language)}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={answeredOpen}
        onClose={() => setAnsweredOpen(false)}
        title={t("prayer.markAnswered", language)}
      >
        <div className="space-y-4">
          <Labelish label={t("prayer.answeredDate", language)}>
            <Input
              type="date"
              className="min-h-11 bg-background"
              value={answeredAt}
              onChange={(e) => setAnsweredAt(e.target.value)}
            />
          </Labelish>
          <Labelish label={t("prayer.testimony", language)}>
            <textarea
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={testimony}
              onChange={(e) => setTestimony(e.target.value)}
            />
          </Labelish>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() => setAnsweredOpen(false)}
            >
              {t("common.cancel", language)}
            </Button>
            <Button className="min-h-11" disabled={pending} onClick={markAnswered}>
              {t("common.save", language)}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={prayOpen}
        onClose={() => setPrayOpen(false)}
        title={tf("prayer.prayForName", language, { name: partnerName })}
      >
        <div className="space-y-4">
          <Labelish label={t("prayer.prayNoteOptional", language)}>
            <textarea
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={prayNote}
              onChange={(e) => setPrayNote(e.target.value)}
            />
          </Labelish>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() => setPrayOpen(false)}
            >
              {t("common.cancel", language)}
            </Button>
            <Button className="min-h-11" disabled={pending} onClick={savePrayFor}>
              {t("common.save", language)}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Labelish({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
