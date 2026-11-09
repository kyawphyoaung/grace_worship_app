import { PARTNER_DISPLAY_NAMES } from "@/lib/config";

/** Reject email local-parts, domains, and raw emails as display names. */
export function isBadDisplayName(name: string | null | undefined): boolean {
  if (!name?.trim()) return true;
  const n = name.trim();
  if (n.includes("@")) return true;
  if (/\.(me|com|net|org|io|co|dev)$/i.test(n)) return true;
  if (/^[a-z0-9._-]+\.(me|com|net|org|io|co|dev)$/i.test(n)) return true;
  return false;
}

export function resolveDisplayName(
  userId: string,
  displayName: string | null | undefined,
  fallback = "You",
): string {
  if (!isBadDisplayName(displayName)) {
    return displayName!.trim();
  }
  const known = PARTNER_DISPLAY_NAMES[userId];
  if (known) return known;
  return fallback;
}
