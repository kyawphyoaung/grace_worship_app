/** Local profile photos mapped by known partner user id prefixes. */
const LOCAL_AVATAR_BY_PREFIX: { prefix: string; src: string }[] = [
  { prefix: "a029c171", src: "/images/avatars/harry.jpg" }, // Harry
  { prefix: "0007f7ae", src: "/images/avatars/ruth.jpg" }, // Ruth
];

export function localAvatarForUser(userId: string): string | null {
  const id = userId.toLowerCase();
  for (const entry of LOCAL_AVATAR_BY_PREFIX) {
    if (id.startsWith(entry.prefix)) return entry.src;
  }
  return null;
}

/** Prefer local couple photos, then stored avatar_url. */
export function resolveAvatarUrl(
  userId: string,
  avatarUrl?: string | null,
): string | null {
  return localAvatarForUser(userId) ?? avatarUrl ?? null;
}
