"use client";

import { FeedWorkspace } from "@/components/prayer/feed-workspace";
import type { Language } from "@/lib/i18n";
import type { Database } from "@/types/database";

type Prayer = Database["public"]["Tables"]["prayers"]["Row"];
type Entry = Database["public"]["Tables"]["gratitude_entries"]["Row"];
type Reaction = Database["public"]["Tables"]["feed_reactions"]["Row"];
type Comment = Database["public"]["Tables"]["feed_comments"]["Row"];

export function PrayerSection({
  language,
  userId,
  partnerId,
  prayers,
  gratitudeEntries,
  reactions,
  comments,
}: {
  language: Language;
  userId: string;
  partnerId: string | null;
  prayers: Prayer[];
  gratitudeEntries: Entry[];
  reactions: Reaction[];
  comments: Comment[];
}) {
  return (
    <FeedWorkspace
      language={language}
      userId={userId}
      partnerId={partnerId}
      prayers={prayers}
      gratitudeEntries={gratitudeEntries}
      reactions={reactions}
      comments={comments}
    />
  );
}
