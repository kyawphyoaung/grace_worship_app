"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Setlist = Database["public"]["Tables"]["setlists"]["Row"];

export type ActionResult = { error: string | null };

export type SongSectionInput = {
  section_type: string;
  label: string | null;
  lyrics_mm: string | null;
  lyrics_en: string | null;
  notes: string | null;
};

export type SongPayload = {
  title_en: string | null;
  title_mm: string | null;
  author: string | null;
  default_key: string | null;
  bpm: number | null;
  tempo: string | null;
  time_signature: string;
  youtube_url: string | null;
  tags: string[];
};

export async function saveSong(input: {
  userId: string;
  songId?: string | null;
  song: SongPayload;
  sections: SongSectionInput[];
}): Promise<ActionResult & { songId: string | null }> {
  const supabase = await createClient();
  let songId = input.songId ?? null;

  if (songId) {
    const { error } = await supabase
      .from("songs")
      .update(input.song)
      .eq("id", songId);
    if (error) return { error: error.message, songId: null };
    const { error: delErr } = await supabase
      .from("song_sections")
      .delete()
      .eq("song_id", songId);
    if (delErr) return { error: delErr.message, songId: null };
  } else {
    const { data, error } = await supabase
      .from("songs")
      .insert({ user_id: input.userId, ...input.song })
      .select("id")
      .single();
    if (error || !data) {
      return { error: error?.message ?? "Failed to save", songId: null };
    }
    songId = data.id;
  }

  if (input.sections.length > 0 && songId) {
    const { error: secErr } = await supabase.from("song_sections").insert(
      input.sections.map((d, i) => ({
        song_id: songId!,
        section_type: d.section_type,
        section_order: i + 1,
        label: d.label,
        lyrics_mm: d.lyrics_mm,
        lyrics_en: d.lyrics_en,
        notes: d.notes,
      })),
    );
    if (secErr) return { error: secErr.message, songId: null };
  }

  return { error: null, songId };
}

export async function deleteSong(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("songs").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export type EventPayload = {
  event_name: string;
  event_date: string;
  event_type: string;
  role: string;
  notes: string | null;
};

export async function saveEvent(input: {
  userId: string;
  eventId?: string | null;
  event: EventPayload;
}): Promise<ActionResult> {
  const supabase = await createClient();
  if (input.eventId) {
    const { error } = await supabase
      .from("events")
      .update(input.event)
      .eq("id", input.eventId);
    return { error: error?.message ?? null };
  }
  const { error } = await supabase.from("events").insert({
    user_id: input.userId,
    ...input.event,
  });
  return { error: error?.message ?? null };
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export type UpcomingEventRow = {
  id: string;
  event_name: string;
  event_date: string;
  event_type: string;
  role: string;
};

/** Uses request-time "today" — call from the client after mount only. */
export async function listUpcomingEvents(
  limit = 8,
): Promise<{ events: UpcomingEventRow[]; error: string | null }> {
  const supabase = await createClient();
  const today = formatDateYmd(new Date());
  const { data, error } = await supabase
    .from("events")
    .select("id, event_name, event_date, event_type, role")
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .limit(limit);
  return { events: data ?? [], error: error?.message ?? null };
}

function formatDateYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function ensureSetlist(input: {
  eventId: string;
  userId: string;
}): Promise<ActionResult & { setlist: Setlist | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("setlists")
    .insert({ event_id: input.eventId, user_id: input.userId })
    .select("*")
    .single();
  if (error || !data) {
    return {
      error: error?.message ?? "Failed to create setlist",
      setlist: null,
    };
  }
  return { error: null, setlist: data };
}

export async function addSetlistItem(input: {
  setlistId: string;
  songId: string;
  position: number;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("setlist_items").insert({
    setlist_id: input.setlistId,
    song_id: input.songId,
    position: input.position,
  });
  return { error: error?.message ?? null };
}

export async function reorderSetlistItems(
  orderedIds: string[],
): Promise<ActionResult> {
  const supabase = await createClient();
  const phase1 = await Promise.all(
    orderedIds.map((id, idx) =>
      supabase
        .from("setlist_items")
        .update({ position: 1000 + idx + 1 })
        .eq("id", id),
    ),
  );
  const err1 = phase1.find((r) => r.error)?.error;
  if (err1) return { error: err1.message };

  const phase2 = await Promise.all(
    orderedIds.map((id, idx) =>
      supabase
        .from("setlist_items")
        .update({ position: idx + 1 })
        .eq("id", id),
    ),
  );
  const err2 = phase2.find((r) => r.error)?.error;
  return { error: err2?.message ?? null };
}

export async function updateSetlistItem(input: {
  id: string;
  keyOverride: string | null;
  transitionNote: string | null;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("setlist_items")
    .update({
      key_override: input.keyOverride,
      transition_note: input.transitionNote,
    })
    .eq("id", input.id);
  return { error: error?.message ?? null };
}

export async function removeSetlistItem(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("setlist_items").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function createEventPrayer(input: {
  eventId: string;
  fromUserId: string;
  note: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("event_prayers").insert({
    event_id: input.eventId,
    from_user_id: input.fromUserId,
    note: input.note,
  });
  return { error: error?.message ?? null };
}

export async function createEventFeedback(input: {
  eventId: string;
  fromUserId: string;
  toUserId: string;
  note: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("event_feedback").insert({
    event_id: input.eventId,
    from_user_id: input.fromUserId,
    to_user_id: input.toUserId,
    note: input.note,
  });
  return { error: error?.message ?? null };
}

export async function saveMinistryReflection(input: {
  existingId?: string | null;
  eventId: string;
  userId: string;
  postServiceReflection: string | null;
  servingGratitude: string | null;
  isShared: boolean;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const payload = {
    event_id: input.eventId,
    user_id: input.userId,
    post_service_reflection: input.postServiceReflection,
    serving_gratitude: input.servingGratitude,
    is_shared: input.isShared,
  };
  if (input.existingId) {
    const { error } = await supabase
      .from("ministry_reflections")
      .update(payload)
      .eq("id", input.existingId);
    return { error: error?.message ?? null };
  }
  const { error } = await supabase.from("ministry_reflections").insert(payload);
  return { error: error?.message ?? null };
}

export async function deleteEventFeedPost(input: {
  kind: "prayer" | "feedback" | "reflection";
  id: string;
  userId: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  if (input.kind === "prayer") {
    const { error } = await supabase
      .from("event_prayers")
      .delete()
      .eq("id", input.id)
      .eq("from_user_id", input.userId);
    return { error: error?.message ?? null };
  }
  if (input.kind === "feedback") {
    const { error } = await supabase
      .from("event_feedback")
      .delete()
      .eq("id", input.id)
      .eq("from_user_id", input.userId);
    return { error: error?.message ?? null };
  }
  const { error } = await supabase
    .from("ministry_reflections")
    .delete()
    .eq("id", input.id)
    .eq("user_id", input.userId);
  return { error: error?.message ?? null };
}
