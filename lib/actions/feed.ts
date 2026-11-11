"use server";

import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string | null };

export async function createPrayer(input: {
  userId: string;
  title: string;
  content: string;
  isShared: boolean;
  recipientId?: string | null;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("prayers").insert({
    user_id: input.userId,
    title: input.title,
    content: input.content,
    is_shared: input.isShared,
    recipient_id: input.recipientId ?? null,
    status: "pending",
  });
  return { error: error?.message ?? null };
}

export async function updatePrayer(input: {
  id: string;
  userId: string;
  title: string;
  content: string;
  isShared: boolean;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("prayers")
    .update({
      title: input.title,
      content: input.content,
      is_shared: input.isShared,
    })
    .eq("id", input.id)
    .eq("user_id", input.userId);
  return { error: error?.message ?? null };
}

export async function deletePrayer(
  id: string,
  userId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("prayers")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  return { error: error?.message ?? null };
}

export async function markPrayerAnswered(input: {
  id: string;
  userId: string;
  answeredAt: string;
  testimony: string | null;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("prayers")
    .update({
      status: "answered",
      answered_at: input.answeredAt,
      testimony: input.testimony,
    })
    .eq("id", input.id)
    .eq("user_id", input.userId);
  return { error: error?.message ?? null };
}

export async function addPrayerInteraction(input: {
  prayerId: string;
  userId: string;
  note: string | null;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("prayer_interactions").insert({
    prayer_id: input.prayerId,
    user_id: input.userId,
    interaction_type: "prayed_for",
    note: input.note,
  });
  return { error: error?.message ?? null };
}

export async function createGratitude(input: {
  userId: string;
  content: string;
  isShared: boolean;
  recipientId?: string | null;
  entryDate?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const payload: {
    user_id: string;
    content: string;
    is_shared: boolean;
    recipient_id: string | null;
    entry_date?: string;
  } = {
    user_id: input.userId,
    content: input.content,
    is_shared: input.isShared,
    recipient_id: input.recipientId ?? null,
  };
  if (input.entryDate) {
    payload.entry_date = input.entryDate;
  }
  const { error } = await supabase.from("gratitude_entries").insert(payload);
  return { error: error?.message ?? null };
}

export async function deleteGratitude(
  id: string,
  userId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("gratitude_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  return { error: error?.message ?? null };
}

export async function toggleLoveReaction(input: {
  userId: string;
  entityType: "prayer" | "gratitude";
  entityId: string;
  existingId?: string | null;
}): Promise<ActionResult> {
  const supabase = await createClient();
  if (input.existingId) {
    const { error } = await supabase
      .from("feed_reactions")
      .delete()
      .eq("id", input.existingId);
    return { error: error?.message ?? null };
  }
  const { error } = await supabase.from("feed_reactions").insert({
    user_id: input.userId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    reaction: "love",
  });
  return { error: error?.message ?? null };
}

export async function addFeedComment(input: {
  userId: string;
  entityType: "prayer" | "gratitude";
  entityId: string;
  content: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("feed_comments").insert({
    user_id: input.userId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    content: input.content,
  });
  return { error: error?.message ?? null };
}
