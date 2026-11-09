"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { UserAvatar } from "@/components/user-avatar";
import { useCouple } from "@/components/couple-provider";
import { t } from "@/lib/i18n";

export function CouplePill() {
  const { me, partner, myName, partnerName, language } = useCouple();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!partner) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 items-center gap-1 rounded-full border border-border bg-card/80 px-2 py-1"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <UserAvatar
          userId={me.id}
          displayName={myName}
          avatarUrl={me.avatar_url}
          size={28}
        />
        <HeartMini />
        <UserAvatar
          userId={partner.id}
          displayName={partnerName}
          avatarUrl={partner.avatar_url}
          size={28}
        />
      </button>
      {open && mounted
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 bg-black/40"
                aria-label="Close"
                onClick={() => setOpen(false)}
              />
              <div
                role="dialog"
                className="fixed inset-x-4 top-16 z-50 ml-auto w-full max-w-xs rounded-xl border border-border bg-card p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar
                    userId={me.id}
                    displayName={myName}
                    avatarUrl={me.avatar_url}
                    size={36}
                  />
                  <p className="truncate text-sm font-medium">{myName}</p>
                </div>
                <div className="my-3 flex items-center gap-3">
                  <UserAvatar
                    userId={partner.id}
                    displayName={partnerName}
                    avatarUrl={partner.avatar_url}
                    size={36}
                  />
                  <p className="truncate text-sm font-medium">{partnerName}</p>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t("partner.switchHint", language)}
                </p>
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}

function HeartMini() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-primary"
      aria-hidden
    >
      <path d="M12 21s-6.7-4.35-9.33-7.4C.5 11.2.7 7.9 3.2 6.1c2-1.5 4.6-.9 5.9 1.1C10.4 5.2 13 4.6 15 6.1c2.5 1.8 2.7 5.1.53 7.5C18.7 16.65 12 21 12 21z" />
    </svg>
  );
}
