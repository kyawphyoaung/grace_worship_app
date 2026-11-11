"use server";

import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/lib/i18n";
import type { BibleVersion } from "@/lib/config";

export type ActionResult = { error: string | null };

export type ProfileUpdate = {
  display_name?: string | null;
  prayer_reminder_time?: string | null;
  preferred_language?: Language;
  preferred_bible_languages?: BibleVersion[];
};

export async function updateProfile(
  userId: string,
  patch: ProfileUpdate,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId);
  return { error: error?.message ?? null };
}
