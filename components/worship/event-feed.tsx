"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { t, type Language } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useCouple } from "@/components/couple-provider";
import { UserAvatar } from "@/components/user-avatar";
import { resolveDisplayName } from "@/lib/display-name";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type EventPrayer = Database["public"]["Tables"]["event_prayers"]["Row"];
type EventFeedback = Database["public"]["Tables"]["event_feedback"]["Row"];
type MinistryReflection =
  Database["public"]["Tables"]["ministry_reflections"]["Row"];

type PostKind = "prayer" | "feedback" | "reflection";

type FeedPost =
  | {
      kind: "prayer";
      id: string;
      created_at: string;
      authorId: string;
      content: string;
    }
  | {
      kind: "feedback";
      id: string;
      created_at: string;
      authorId: string;
      content: string;
    }
  | {
      kind: "reflection";
      id: string;
      created_at: string;
      authorId: string;
      content: string;
      gratitude: string | null;
      is_shared: boolean;
    };

const ACCENT: Record<PostKind, string> = {
  prayer: "border-l-fuchsia-400/80 from-fuchsia-950/25",
  feedback: "border-l-teal-400/80 from-teal-950/25",
  reflection: "border-l-amber-400/80 from-amber-950/20",
};

const BADGE: Record<PostKind, string> = {
  prayer: "bg-fuchsia-500/20 text-fuchsia-200",
  feedback: "bg-teal-500/20 text-teal-200",
  reflection: "bg-amber-500/20 text-amber-200",
};

export function EventFeed({
  language,
  userId,
  event,
  prayers,
  feedback,
  reflections,
}: {
  language: Language;
  userId: string;
  event: EventRow;
  prayers: EventPrayer[];
  feedback: EventFeedback[];
  reflections: MinistryReflection[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { me, partner, myName, partnerName } = useCouple();
  const [pending, startTransition] = useTransition();
  const [composerOpen, setComposerOpen] = useState(false);
  const [postKind, setPostKind] = useState<PostKind>("feedback");
  const [content, setContent] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [shareReflection, setShareReflection] = useState(false);

  const isOwner = event.user_id === userId;
  // Partner prayer: only the partner (non-owner) can create — Harry for Ruth's events
  const canCreatePrayer = Boolean(partner) && !isOwner;
  const canCreateFeedback = Boolean(partner) && !isOwner;
  const canCreateReflection = isOwner;

  const availableKinds = useMemo(() => {
    const kinds: PostKind[] = [];
    if (canCreatePrayer) kinds.push("prayer");
    if (canCreateFeedback) kinds.push("feedback");
    if (canCreateReflection) kinds.push("reflection");
    return kinds;
  }, [canCreatePrayer, canCreateFeedback, canCreateReflection]);

  const posts = useMemo<FeedPost[]>(() => {
    const list: FeedPost[] = [
      ...prayers.map((p) => ({
        kind: "prayer" as const,
        id: p.id,
        created_at: p.created_at,
        authorId: p.from_user_id,
        content: p.note,
      })),
      ...feedback.map((f) => ({
        kind: "feedback" as const,
        id: f.id,
        created_at: f.created_at,
        authorId: f.from_user_id,
        content: f.note,
      })),
      ...reflections
        .filter((r) => r.user_id === userId || r.is_shared)
        .map((r) => ({
          kind: "reflection" as const,
          id: r.id,
          created_at: r.created_at,
          authorId: r.user_id,
          content: r.post_service_reflection ?? "",
          gratitude: r.serving_gratitude,
          is_shared: r.is_shared,
        })),
    ];
    return list.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [prayers, feedback, reflections, userId]);

  const kindLabel = (kind: PostKind) => {
    if (kind === "prayer") return t("worship.postTypePrayer", language);
    if (kind === "feedback") return t("worship.postTypeFeedback", language);
    return t("worship.postTypeReflection", language);
  };

  const openComposer = () => {
    if (availableKinds.length === 0) return;
    const initial = availableKinds[0];
    setPostKind(initial);
    setContent("");
    setGratitude("");
    setShareReflection(false);
    setComposerOpen(true);
  };

  const authorFor = (authorId: string) => {
    if (authorId === userId) return { profile: me, name: myName };
    return { profile: partner, name: partnerName };
  };

  const publish = () => {
    if (!content.trim() && postKind !== "reflection") return;
    if (
      postKind === "reflection" &&
      !content.trim() &&
      !gratitude.trim()
    )
      return;

    startTransition(async () => {
      const supabase = createClient();
      if (postKind === "prayer") {
        if (!canCreatePrayer) {
          showToast(t("worship.onlyPartnerPrayer", language));
          return;
        }
        const { error } = await supabase.from("event_prayers").insert({
          event_id: event.id,
          from_user_id: userId,
          note: content.trim(),
        });
        if (error) {
          showToast(error.message);
          return;
        }
      } else if (postKind === "feedback") {
        if (!partner || !canCreateFeedback) return;
        const { error } = await supabase.from("event_feedback").insert({
          event_id: event.id,
          from_user_id: userId,
          to_user_id: event.user_id,
          note: content.trim(),
        });
        if (error) {
          showToast(error.message);
          return;
        }
      } else {
        const existing = reflections.find((r) => r.user_id === userId);
        const payload = {
          event_id: event.id,
          user_id: userId,
          post_service_reflection: content.trim() || null,
          serving_gratitude: gratitude.trim() || null,
          is_shared: shareReflection,
        };
        const { error } = existing
          ? await supabase
              .from("ministry_reflections")
              .update(payload)
              .eq("id", existing.id)
          : await supabase.from("ministry_reflections").insert(payload);
        if (error) {
          showToast(error.message);
          return;
        }
      }
      setComposerOpen(false);
      showToast(t("worship.saved", language));
      router.refresh();
    });
  };

  return (
    <section className="space-y-3">
      <h3 className="text-base font-semibold">{t("worship.eventFeed", language)}</h3>

      {availableKinds.length > 0 ? (
        <button
          type="button"
          onClick={openComposer}
          className="flex w-full items-center gap-3 rounded-2xl border border-border card-glow p-3 text-left transition hover:border-primary/40"
        >
          <UserAvatar
            userId={me.id}
            displayName={myName}
            avatarUrl={me.avatar_url}
            size={40}
          />
          <span className="flex-1 truncate rounded-full bg-muted/60 px-4 py-2.5 text-sm text-muted-foreground">
            {t("worship.writePost", language)}
          </span>
        </button>
      ) : isOwner ? (
        <p className="text-sm text-muted-foreground">
          {t("worship.onlyPartnerPrayer", language)}
        </p>
      ) : null}

      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("common.empty", language)}</p>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => {
            const { profile, name } = authorFor(post.authorId);
            return (
              <li
                key={`${post.kind}-${post.id}`}
                className={cn(
                  "overflow-hidden rounded-2xl border border-border border-l-4 bg-gradient-to-br to-card p-4",
                  ACCENT[post.kind],
                )}
              >
                <div className="flex items-start gap-3">
                  <UserAvatar
                    userId={post.authorId}
                    displayName={
                      profile
                        ? resolveDisplayName(
                            profile.id,
                            profile.display_name,
                            name,
                          )
                        : name
                    }
                    avatarUrl={profile?.avatar_url ?? null}
                    size={40}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{name}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          BADGE[post.kind],
                        )}
                      >
                        {kindLabel(post.kind)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                    {post.content ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                        {post.content}
                      </p>
                    ) : null}
                    {post.kind === "reflection" && post.gratitude ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                        {post.gratitude}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        title={t("worship.eventFeed", language)}
        className="max-w-md"
        blur
      >
        <div className="space-y-4">
          {availableKinds.length > 1 ? (
            <Segmented
              value={postKind}
              onChange={setPostKind}
              options={availableKinds.map((kind) => ({
                value: kind,
                label: kindLabel(kind),
              }))}
            />
          ) : null}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder={
              postKind === "reflection"
                ? t("worship.ministryReflection", language)
                : t("worship.writePost", language)
            }
          />

          {postKind === "reflection" ? (
            <>
              <div className="space-y-1.5">
                <Label>{t("worship.servingGratitude", language)}</Label>
                <textarea
                  value={gratitude}
                  onChange={(e) => setGratitude(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={shareReflection}
                  onCheckedChange={(v) => setShareReflection(Boolean(v))}
                />
                {t("worship.shareReflection", language)}
              </label>
            </>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => setComposerOpen(false)}
            >
              {t("common.cancel", language)}
            </Button>
            <Button
              type="button"
              className="min-h-11"
              disabled={pending}
              onClick={publish}
            >
              {t("feed.post", language)}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
