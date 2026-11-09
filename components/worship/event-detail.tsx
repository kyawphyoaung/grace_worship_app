"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Download, Play, Sparkles } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/client";
import { t, tf, type Language } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useCouple } from "@/components/couple-provider";
import {
  SetlistPlanner,
  type SetlistItemView,
} from "@/components/worship/setlist-planner";
import { RehearsalMode } from "@/components/worship/rehearsal-mode";
import {
  EventChartDocument,
  type PdfSongItem,
} from "@/lib/pdf/event-chart";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type Song = Database["public"]["Tables"]["songs"]["Row"];
type SongSection = Database["public"]["Tables"]["song_sections"]["Row"];
type Setlist = Database["public"]["Tables"]["setlists"]["Row"];
type EventPrayer = Database["public"]["Tables"]["event_prayers"]["Row"];
type EventFeedback = Database["public"]["Tables"]["event_feedback"]["Row"];
type MinistryReflection =
  Database["public"]["Tables"]["ministry_reflections"]["Row"];

export function EventDetail({
  language,
  userId,
  event,
  songs,
  sections,
  setlist,
  items,
  prayers,
  feedback,
  reflections,
  onBack,
}: {
  language: Language;
  userId: string;
  event: EventRow;
  songs: Song[];
  sections: SongSection[];
  setlist: Setlist | null;
  items: SetlistItemView[];
  prayers: EventPrayer[];
  feedback: EventFeedback[];
  reflections: MinistryReflection[];
  onBack: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { partner, partnerName, myName } = useCouple();
  const [pending, startTransition] = useTransition();
  const [rehearsal, setRehearsal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [prayerNote, setPrayerNote] = useState("");
  const [feedbackNote, setFeedbackNote] = useState("");
  const myReflection = reflections.find((r) => r.user_id === userId) ?? null;
  const sharedPartnerReflection = reflections.find(
    (r) => r.user_id !== userId && r.is_shared,
  );
  const [reflection, setReflection] = useState(
    myReflection?.post_service_reflection ?? "",
  );
  const [gratitude, setGratitude] = useState(
    myReflection?.serving_gratitude ?? "",
  );
  const [shareReflection, setShareReflection] = useState(
    myReflection?.is_shared ?? false,
  );

  const isOwner = event.user_id === userId;
  const sectionsBySong = useMemo(() => {
    const map = new Map<string, SongSection[]>();
    for (const s of sections) {
      const list = map.get(s.song_id) ?? [];
      list.push(s);
      map.set(s.song_id, list);
    }
    return map;
  }, [sections]);

  const roleLabel = (role: string) => {
    if (role === "leader") return t("worship.roleLeader", language);
    if (role === "backup") return t("worship.roleBackup", language);
    return t("worship.roleParticipant", language);
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

  const savePrayer = () => {
    if (!prayerNote.trim()) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("event_prayers").insert({
        event_id: event.id,
        from_user_id: userId,
        note: prayerNote.trim(),
      });
      if (error) {
        showToast(error.message);
        return;
      }
      setPrayerNote("");
      showToast(t("worship.saved", language));
      router.refresh();
    });
  };

  const saveFeedback = () => {
    if (!feedbackNote.trim() || !partner) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("event_feedback").insert({
        event_id: event.id,
        from_user_id: userId,
        to_user_id: partner.id,
        note: feedbackNote.trim(),
      });
      if (error) {
        showToast(error.message);
        return;
      }
      setFeedbackNote("");
      showToast(t("worship.saved", language));
      router.refresh();
    });
  };

  const saveReflection = () => {
    startTransition(async () => {
      const supabase = createClient();
      const payload = {
        event_id: event.id,
        user_id: userId,
        post_service_reflection: reflection.trim() || null,
        serving_gratitude: gratitude.trim() || null,
        is_shared: shareReflection,
      };
      const { error } = myReflection
        ? await supabase
            .from("ministry_reflections")
            .update(payload)
            .eq("id", myReflection.id)
        : await supabase.from("ministry_reflections").insert(payload);
      if (error) {
        showToast(error.message);
        return;
      }
      showToast(t("worship.saved", language));
      router.refresh();
    });
  };

  const exportPdf = async () => {
    setExporting(true);
    try {
      const pdfItems: PdfSongItem[] = items.map((item) => ({
        position: item.position,
        key: item.key_override || item.song.default_key,
        transition_note: item.transition_note,
        song: {
          title_en: item.song.title_en,
          title_mm: item.song.title_mm,
          author: item.song.author,
          default_key: item.song.default_key,
          bpm: item.song.bpm,
        },
        sections: [...(sectionsBySong.get(item.song_id) ?? [])]
          .sort((a, b) => a.section_order - b.section_order)
          .map((s) => ({
            label: s.label,
            section_type: s.section_type,
            lyrics_mm: s.lyrics_mm,
            lyrics_en: s.lyrics_en,
            notes: s.notes,
          })),
      }));

      const blob = await pdf(
        <EventChartDocument
          event={{
            event_name: event.event_name,
            event_date: event.event_date,
            event_type: event.event_type,
            role: event.role,
            notes: event.notes,
          }}
          items={pdfItems}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${event.event_name.replace(/\s+/g, "-").toLowerCase()}-chart.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(t("worship.pdfReady", language));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "PDF failed");
    } finally {
      setExporting(false);
    }
  };

  const nameFor = (id: string) =>
    id === userId ? myName : partnerName;

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common.back", language)}
      </button>

      <header className="overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-card via-secondary/40 to-primary/10 p-5 shadow-[0_0_40px_-18px_hsl(var(--primary))]">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">
          {typeLabel(event.event_type)} · {roleLabel(event.role)}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          {event.event_name}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {format(parseISO(event.event_date), "EEEE, MMM d, yyyy")}
        </p>
        {event.notes ? (
          <p className="mt-3 text-sm text-foreground/90">{event.notes}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            className="min-h-11"
            disabled={items.length === 0}
            onClick={() => setRehearsal(true)}
          >
            <Play className="h-4 w-4" />
            {t("worship.startRehearsal", language)}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-11"
            disabled={items.length === 0 || exporting}
            onClick={() => void exportPdf()}
          >
            <Download className="h-4 w-4" />
            {exporting
              ? t("worship.exporting", language)
              : t("worship.exportPdf", language)}
          </Button>
        </div>
      </header>

      <SetlistPlanner
        language={language}
        userId={userId}
        eventId={event.id}
        setlist={setlist}
        items={items}
        songs={songs}
      />

      <section className="space-y-3 rounded-3xl border border-fuchsia-400/20 bg-gradient-to-br from-card to-fuchsia-950/20 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-fuchsia-300" />
          <h3 className="font-semibold">{t("worship.partnerPrayer", language)}</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("worship.partnerPrayerHint", language)}
        </p>
        {!isOwner || partner ? (
          <div className="space-y-2">
            <textarea
              value={prayerNote}
              onChange={(e) => setPrayerNote(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder={t("worship.writePrayer", language)}
            />
            <Button
              type="button"
              className="min-h-11"
              disabled={pending || !prayerNote.trim()}
              onClick={savePrayer}
            >
              {t("worship.writePrayer", language)}
            </Button>
          </div>
        ) : null}
        <ul className="space-y-2">
          {prayers.length === 0 ? (
            <li className="text-sm text-muted-foreground">
              {t("worship.noPartnerPrayers", language)}
            </li>
          ) : (
            prayers.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2"
              >
                <p className="text-xs text-muted-foreground">
                  {tf("worship.prayerFrom", language, {
                    name: nameFor(p.from_user_id),
                  })}
                </p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{p.note}</p>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="space-y-3 rounded-3xl border border-teal-400/20 bg-gradient-to-br from-card to-teal-950/20 p-4">
        <h3 className="font-semibold">{t("worship.postService", language)}</h3>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("worship.ministryReflection", language)}</Label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("worship.servingGratitude", language)}</Label>
            <textarea
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={shareReflection}
              onCheckedChange={(v) => setShareReflection(Boolean(v))}
            />
            {t("worship.shareReflection", language)}
          </label>
          <Button
            type="button"
            className="min-h-11"
            disabled={pending}
            onClick={saveReflection}
          >
            {t("common.save", language)}
          </Button>
        </div>

        {sharedPartnerReflection ? (
          <div className="rounded-xl border border-primary/25 bg-primary/5 px-3 py-2">
            <p className="text-xs text-muted-foreground">
              {tf("worship.prayerFrom", language, { name: partnerName })} ·{" "}
              {t("worship.ministryReflection", language)}
            </p>
            {sharedPartnerReflection.post_service_reflection ? (
              <p className="mt-1 text-sm whitespace-pre-wrap">
                {sharedPartnerReflection.post_service_reflection}
              </p>
            ) : null}
            {sharedPartnerReflection.serving_gratitude ? (
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                {sharedPartnerReflection.serving_gratitude}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className={cn("space-y-2 border-t border-border/50 pt-3")}>
          <h4 className="text-sm font-semibold">
            {t("worship.eventFeedback", language)}
          </h4>
          <p className="text-sm text-muted-foreground">
            {t("worship.feedbackHint", language)}
          </p>
          {partner ? (
            <>
              <textarea
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={t("worship.writeFeedback", language)}
              />
              <Button
                type="button"
                variant="secondary"
                className="min-h-11"
                disabled={pending || !feedbackNote.trim()}
                onClick={saveFeedback}
              >
                {t("worship.writeFeedback", language)}
              </Button>
            </>
          ) : null}
          <ul className="space-y-2">
            {feedback.map((f) => (
              <li
                key={f.id}
                className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2"
              >
                <p className="text-xs text-muted-foreground">
                  {tf("worship.feedbackFrom", language, {
                    name: nameFor(f.from_user_id),
                  })}
                </p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{f.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <RehearsalMode
        language={language}
        open={rehearsal}
        onClose={() => setRehearsal(false)}
        items={items}
        sectionsBySong={sectionsBySong}
        eventName={event.event_name}
      />
    </div>
  );
}
