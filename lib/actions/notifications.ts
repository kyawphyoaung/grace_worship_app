"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export type ActionResult = { error: string | null };

export type ListNotificationsResult = {
  error: string | null;
  notifications: Notification[];
};

export async function listNotifications(
  userId: string,
  limit = 20,
): Promise<ListNotificationsResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return {
    error: error?.message ?? null,
    notifications: data ?? [],
  };
}

export async function markAllNotificationsRead(
  userId: string,
): Promise<ActionResult & { readAt: string | null }> {
  const supabase = await createClient();
  const readAt = new Date().toISOString();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: readAt })
    .eq("user_id", userId)
    .is("read_at", null);
  return { error: error?.message ?? null, readAt: error ? null : readAt };
}

export async function markNotificationRead(
  id: string,
  userId: string,
): Promise<ActionResult & { readAt: string | null }> {
  const supabase = await createClient();
  const readAt = new Date().toISOString();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: readAt })
    .eq("id", id)
    .eq("user_id", userId);
  return { error: error?.message ?? null, readAt: error ? null : readAt };
}

export async function deleteNotification(
  id: string,
  userId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  return { error: error?.message ?? null };
}

export async function deleteAllNotifications(
  userId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userId);
  return { error: error?.message ?? null };
}

export async function sendPresenceNotification(input: {
  partnerId: string;
  userId: string;
  message: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: input.partnerId,
    actor_id: input.userId,
    type: "presence_opened",
    entity_type: "presence",
    entity_id: input.userId,
    message: input.message,
  });
  return { error: error?.message ?? null };
}

export async function sendBibleInviteNotification(input: {
  partnerId: string;
  actorId: string;
  message: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: input.partnerId,
    actor_id: input.actorId,
    type: "bible_study_invite",
    entity_type: "bible_study",
    entity_id: input.actorId,
    message: input.message,
  });
  return { error: error?.message ?? null };
}
