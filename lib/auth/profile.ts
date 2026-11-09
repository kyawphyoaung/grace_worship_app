import { createClient } from "@/lib/supabase/server";
import { isBadDisplayName } from "@/lib/display-name";
import type { Language } from "@/lib/i18n";
import type { BibleVersion } from "@/lib/config";
import { BIBLE_VERSIONS } from "@/lib/config";
import type { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function ensureProfile(
  supabase: SupabaseServer,
  userId: string,
  _email?: string | null,
): Promise<Profile | null> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    if (isBadDisplayName(existing.display_name)) {
      const { data: fixed } = await supabase
        .from("profiles")
        .update({ display_name: null })
        .eq("id", userId)
        .select("*")
        .single();
      if (fixed) return fixed;
    }
    return existing;
  }

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      display_name: null,
      preferred_language: "en",
      preferred_bible_languages: ["mm", "en"],
    })
    .select("*")
    .single();

  if (error) {
    console.error("Failed to ensure profile", error.message);
    return null;
  }

  return created;
}

export async function isPartnerLinked(
  supabase: SupabaseServer,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("partners")
    .select("id")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .maybeSingle();

  return Boolean(data);
}

export function profileLanguage(profile: Profile | null): Language {
  return profile?.preferred_language === "mm" ? "mm" : "en";
}

export function profileBibleLanguages(
  profile: Profile | null,
): BibleVersion[] {
  const raw = profile?.preferred_bible_languages ?? ["mm", "en"];
  const allowed = new Set<string>(BIBLE_VERSIONS);
  const filtered = raw.filter((v): v is BibleVersion => allowed.has(v));
  return filtered.length > 0 ? filtered : ["mm", "en"];
}

export async function getPartnerUserId(
  supabase: SupabaseServer,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("partners")
    .select("user_a, user_b")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .maybeSingle();

  if (!data) return null;
  return data.user_a === userId ? data.user_b : data.user_a;
}
