"use client";

import { cn } from "@/lib/utils";
import { colorFromUserId, initialsFromName } from "@/lib/avatar-color";
import { resolveAvatarUrl } from "@/lib/avatars";

export function UserAvatar({
  userId,
  displayName,
  avatarUrl,
  size = 40,
  className,
}: {
  userId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const initials = initialsFromName(displayName);
  const bg = colorFromUserId(userId);
  const src = resolveAvatarUrl(userId, avatarUrl);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-primary/40 shadow-[0_0_16px_-6px_hsl(var(--primary))]",
        className,
      )}
      style={{ width: size, height: size }}
      title={displayName ?? undefined}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center font-semibold text-white"
          style={{
            backgroundImage: `linear-gradient(135deg, ${bg}, hsl(280 65% 48%))`,
            fontSize: Math.max(11, size * 0.32),
          }}
        >
          {initials}
        </span>
      )}
    </span>
  );
}
