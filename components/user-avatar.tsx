"use client";

import { cn } from "@/lib/utils";
import { colorFromUserId, initialsFromName } from "@/lib/avatar-color";

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

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-primary/30",
        className,
      )}
      style={{ width: size, height: size }}
      title={displayName ?? undefined}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center font-semibold text-primary-foreground"
          style={{ backgroundColor: bg, fontSize: Math.max(11, size * 0.32) }}
        >
          {initials}
        </span>
      )}
    </span>
  );
}
