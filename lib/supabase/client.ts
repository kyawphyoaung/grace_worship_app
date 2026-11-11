/**
 * Browser Supabase client is disabled.
 * All auth/data must go through Server Actions in `@/lib/actions/*`
 * using `createClient` from `@/lib/supabase/server` so the phone never
 * calls `*.supabase.co` directly (ISP DNS blocks).
 */
export function createClient(): never {
  throw new Error(
    "Browser Supabase client is disabled. Use Server Actions from @/lib/actions instead.",
  );
}
