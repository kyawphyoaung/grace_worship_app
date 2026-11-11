"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, WifiOff } from "lucide-react";
import {
  loadLastBibleChapter,
  type CachedBibleChapter,
} from "@/lib/pwa/bible-cache";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  const [chapter, setChapter] = useState<CachedBibleChapter | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setChapter(loadLastBibleChapter());
    setReady(true);
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-10 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <div className="mb-8 rounded-3xl border border-border bg-card/80 p-6 text-center shadow-[0_0_40px_-18px_hsl(var(--primary)/0.45)]">
        <WifiOff className="mx-auto h-8 w-8 text-primary" />
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          You&apos;re offline
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Grace will reconnect when you&apos;re back online. Meanwhile, here is
          your last cached Bible chapter.
        </p>
        <Button asChild className="mt-5 min-h-11">
          <Link href="/home">Try Home again</Link>
        </Button>
      </div>

      {!ready ? null : chapter && chapter.verses.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="h-4 w-4" />
            <h2 className="text-lg font-semibold">
              {chapter.nameEn} {chapter.chapter}
            </h2>
          </div>
          {chapter.nameMm ? (
            <p className="mm-text text-sm text-muted-foreground">
              {chapter.nameMm} {chapter.chapter}
            </p>
          ) : null}
          <div className="space-y-4">
            {chapter.verses.map((v) => (
              <div
                key={v.verse}
                className="rounded-2xl border border-border/70 bg-card/60 p-4"
              >
                <p className="mb-2 text-xs font-semibold text-primary">
                  {v.verse}
                </p>
                {v.text_mm ? (
                  <p className="mm-text text-base leading-relaxed">{v.text_mm}</p>
                ) : null}
                {v.text_en ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {v.text_en}
                  </p>
                ) : null}
                {v.text_chin ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {v.text_chin}
                  </p>
                ) : null}
                {v.text_kjv ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {v.text_kjv}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No Bible chapter cached yet. Open a chapter while online, then it will
          be available here offline.
        </p>
      )}
    </div>
  );
}
