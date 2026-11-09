"use client";

import { createContext, useContext, useMemo } from "react";
import type { Language } from "@/lib/i18n";
import type { Profile } from "@/lib/auth/profile";
import { resolveDisplayName } from "@/lib/display-name";

export type CoupleContextValue = {
  language: Language;
  me: Profile;
  partner: Profile | null;
  partnerName: string;
  myName: string;
};

const CoupleContext = createContext<CoupleContextValue | null>(null);

export function CoupleProvider({
  language,
  me,
  partner,
  children,
}: {
  language: Language;
  me: Profile;
  partner: Profile | null;
  children: React.ReactNode;
}) {
  const value = useMemo<CoupleContextValue>(
    () => ({
      language,
      me,
      partner,
      myName: resolveDisplayName(me.id, me.display_name, "You"),
      partnerName: partner
        ? resolveDisplayName(partner.id, partner.display_name, "Partner")
        : "Partner",
    }),
    [language, me, partner],
  );

  return (
    <CoupleContext.Provider value={value}>{children}</CoupleContext.Provider>
  );
}

export function useCouple() {
  const ctx = useContext(CoupleContext);
  if (!ctx) {
    throw new Error("useCouple must be used within CoupleProvider");
  }
  return ctx;
}

/** Safe for components that may render outside the linked shell. */
export function useCoupleOptional() {
  return useContext(CoupleContext);
}
