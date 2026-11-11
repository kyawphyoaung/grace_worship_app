"use server";

import { createClient } from "@/lib/supabase/server";

export type AuthActionResult = { error: string | null };

export async function login(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function logout(): Promise<AuthActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  return { error: error?.message ?? null };
}

export async function forgotPassword(
  email: string,
  redirectTo: string,
): Promise<AuthActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  return { error: error?.message ?? null };
}

export async function updatePassword(
  password: string,
): Promise<AuthActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  return { error: error?.message ?? null };
}
