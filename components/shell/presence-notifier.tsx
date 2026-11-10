"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { tf, type Language } from "@/lib/i18n";

const SESSION_KEY = "grace:presence-notified";

/** Once per browser session, notify the partner that this user opened the app. */
export function PresenceNotifier({
  language,
  userId,
  myName,
  partnerId,
}: {
  language: Language;
  userId: string;
  myName: string;
  partnerId: string;
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SESSION_KEY) === userId) return;
    } catch {
      // sessionStorage may be blocked; still attempt once via ref
    }
    sent.current = true;

    const run = async () => {
      const supabase = createClient();
      const { error } = await supabase.from("notifications").insert({
        user_id: partnerId,
        actor_id: userId,
        type: "presence_opened",
        entity_type: "presence",
        entity_id: userId,
        message: tf("notifications.presenceOpened", language, {
          name: myName,
        }),
      });
      if (!error) {
        try {
          sessionStorage.setItem(SESSION_KEY, userId);
        } catch {
          // ignore
        }
      }
    };

    void run();
  }, [language, myName, partnerId, userId]);

  return null;
}
