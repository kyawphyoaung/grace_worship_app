"use client";

import { useState } from "react";
import { PrayerWorkspace } from "@/components/prayer/prayer-workspace";
import { GratitudeWorkspace } from "@/components/gratitude/gratitude-workspace";
import { Segmented } from "@/components/ui/segmented";
import { t, type Language } from "@/lib/i18n";
import type { Database } from "@/types/database";

type Prayer = Database["public"]["Tables"]["prayers"]["Row"];
type Interaction = Database["public"]["Tables"]["prayer_interactions"]["Row"];
type Entry = Database["public"]["Tables"]["gratitude_entries"]["Row"];
type Section = "prayer" | "gratitude";

export function PrayerSection({
  language,
  userId,
  partnerId,
  prayers,
  interactions,
  reminderTime,
  gratitudeEntries,
}: {
  language: Language;
  userId: string;
  partnerId: string | null;
  prayers: Prayer[];
  interactions: Interaction[];
  reminderTime: string | null;
  gratitudeEntries: Entry[];
}) {
  const [section, setSection] = useState<Section>("prayer");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Segmented
        value={section}
        onChange={setSection}
        options={[
          { value: "prayer", label: t("prayer.prayers", language) },
          { value: "gratitude", label: t("prayer.gratitude", language) },
        ]}
      />

      {section === "prayer" ? (
        <PrayerWorkspace
          language={language}
          userId={userId}
          partnerId={partnerId}
          prayers={prayers}
          interactions={interactions}
          reminderTime={reminderTime}
        />
      ) : (
        <GratitudeWorkspace
          language={language}
          userId={userId}
          entries={gratitudeEntries}
        />
      )}
    </div>
  );
}
