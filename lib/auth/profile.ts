import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/lib/i18n";
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
  email?: string | null,
): Promise<Profile | null> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const displayName = email ? email.split("@")[0] : null;
  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      display_name: displayName,
      preferred_language: "en",
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
