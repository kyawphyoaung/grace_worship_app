"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Heart, ListFilter, MessageCircle, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { t, tf, type Language } from "@/lib/i18n";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useCouple } from "@/components/couple-provider";
import { UserAvatar } from "@/components/user-avatar";
import { resolveDisplayName } from "@/lib/display-name";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Prayer = Database["public"]["Tables"]["prayers"]["Row"];
type Entry = Database["public"]["Tables"]["gratitude_entries"]["Row"];
type Reaction = Database["public"]["Tables"]["feed_reactions"]["Row"];
type Comment = Database["public"]["Tables"]["feed_comments"]["Row"];

type FeedItem =
  | { kind: "prayer"; created_at: string; data: Prayer }
  | { kind: "gratitude"; created_at: string; data: Entry };

type PostType = "prayer" | "gratitude";
type FilterValue = "all" | "pending" | "answered" | "shared" | "private";

export function FeedWorkspace({
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
  const router = useRouter();
  const { me, partner, myName, partnerName } = useCouple();
  const [pending, startTransition] = useTransition();
  const [composerOpen, setComposerOpen] = useState(false);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [postType, setPostType] = useState<PostType>("prayer");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [shareWith, setShareWith] = useState(true);
  const [prayForPartner, setPrayForPartner] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [floating, setFloating] = useState<Record<string, number>>({});

  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [
      ...prayers.map((p) => ({
        kind: "prayer" as const,
        created_at: p.created_at,
        data: p,
      })),
      ...gratitudeEntries.map((g) => ({
        kind: "gratitude" as const,
        created_at: g.created_at,
        data: g,
      })),
    ];
    return items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [prayers, gratitudeEntries]);

  const visible = useMemo(() => {
    switch (filter) {
      case "pending":
        return feed.filter(
          (i) => i.kind === "prayer" && i.data.status === "pending",
        );
      case "answered":
        return feed.filter(
          (i) => i.kind === "prayer" && i.data.status === "answered",
        );
      case "shared":
        return feed.filter((i) => i.data.is_shared);
      case "private":
        return feed.filter(
          (i) => !i.data.is_shared && i.data.user_id === userId,
        );
      default:
        return feed;
    }
  }, [feed, filter, userId]);

  const reactionsByKey = useMemo(() => {
    const map = new Map<string, Reaction[]>();
    for (const r of reactions) {
      const key = `${r.entity_type}:${r.entity_id}`;
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    return map;
  }, [reactions]);

  const commentsByKey = useMemo(() => {
    const map = new Map<string, Comment[]>();
    for (const c of comments) {
      const key = `${c.entity_type}:${c.entity_id}`;
      const list = map.get(key) ?? [];
      list.push(c);
      map.set(key, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
    }
    return map;
  }, [comments]);

  const authorFor = (authorId: string) => {
    if (authorId === userId) {
      return { profile: me, name: myName };
    }
    return { profile: partner, name: partnerName };
  };

  const filterLabel = (value: FilterValue) => {
    switch (value) {
      case "pending":
        return t("prayer.filterPending", language);
      case "answered":
        return t("prayer.filterAnswered", language);
      case "shared":
        return t("prayer.filterShared", language);
      case "private":
        return t("prayer.filterPrivate", language);
      default:
        return t("prayer.filterAll", language);
    }
  };

  const openComposer = () => {
    setPostType("prayer");
    setTitle("");
    setContent("");
    setShareWith(true);
    setPrayForPartner(false);
    setComposerOpen(true);
  };

  const publish = () => {
    if (!content.trim()) return;
    if (postType === "prayer" && !title.trim()) return;

    startTransition(async () => {
      const supabase = createClient();
      if (postType === "prayer") {
        const targeted = prayForPartner && partnerId;
        const { error } = await supabase.from("prayers").insert({
          user_id: userId,
          title: title.trim(),
          content: content.trim(),
          is_shared: targeted ? true : shareWith,
          recipient_id: targeted ? partnerId : null,
          status: "pending",
        });
        if (error) {
          setMessage(error.message);
          return;
        }
      } else {
        const { error } = await supabase.from("gratitude_entries").insert({
          user_id: userId,
          content: content.trim(),
          is_shared: shareWith,
          recipient_id: null,
        });
        if (error) {
          setMessage(error.message);
          return;
        }
      }
      setComposerOpen(false);
      router.refresh();
    });
  };

  const toggleLove = (
    entityType: "prayer" | "gratitude",
    entityId: string,
    authorId: string,
  ) => {
    if (!partnerId || authorId === userId) return;
    const key = `${entityType}:${entityId}`;
    const existing = (reactionsByKey.get(key) ?? []).find(
      (r) => r.user_id === userId && r.reaction === "love",
    );

    setFloating((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
    window.setTimeout(() => {
      setFloating((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 900);

    startTransition(async () => {
      const supabase = createClient();
      if (existing) {
        const { error } = await supabase
          .from("feed_reactions")
          .delete()
          .eq("id", existing.id);
        if (error) setMessage(error.message);
      } else {
        const { error } = await supabase.from("feed_reactions").insert({
          user_id: userId,
          entity_type: entityType,
          entity_id: entityId,
          reaction: "love",
        });
        if (error) setMessage(error.message);
      }
      router.refresh();
    });
  };

  const submitComment = (
    entityType: "prayer" | "gratitude",
    entityId: string,
  ) => {
    const key = `${entityType}:${entityId}`;
    const text = (drafts[key] ?? "").trim();
    if (!text) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("feed_comments").insert({
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        content: text,
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setDrafts((prev) => ({ ...prev, [key]: "" }));
      setExpanded((prev) => ({ ...prev, [key]: true }));
      router.refresh();
    });
  };

  const commentLabel = (n: number) => {
    if (n === 0) return t("feed.commentZero", language);
    if (n === 1) return t("feed.commentOne", language);
    return tf("feed.comments", language, { n: String(n) });
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">
        {t("feed.title", language)}
      </h1>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={openComposer}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-border card-glow p-3 text-left transition hover:border-primary/40"
        >
          <UserAvatar
            userId={me.id}
            displayName={myName}
            avatarUrl={me.avatar_url}
            size={44}
          />
          <span className="flex-1 truncate rounded-full bg-muted/60 px-4 py-2.5 text-sm text-muted-foreground">
            {t("feed.composerPrompt", language)}
          </span>
        </button>

        <div className="relative shrink-0">
          <button
            type="button"
            aria-label={t("prayer.filter", language)}
            aria-expanded={filterOpen}
            onClick={() => setFilterOpen((v) => !v)}
            className="relative flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-primary/25 bg-gradient-to-br from-card to-primary/15 text-foreground"
          >
            <ListFilter className="h-4 w-4 text-primary" />
            <span className="absolute -bottom-1 -right-1 max-w-[3.5rem] truncate rounded-full bg-gradient-to-r from-primary to-fuchsia-400 px-1.5 py-px text-[9px] font-semibold leading-none text-primary-foreground">
              {filterLabel(filter)}
            </span>
          </button>

          {filterOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                aria-label="Close"
                onClick={() => setFilterOpen(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-xl">
                {(
                  [
                    "all",
                    "pending",
                    "answered",
                    "shared",
                    "private",
                  ] as FilterValue[]
                ).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setFilter(value);
                      setFilterOpen(false);
                    }}
                    className={cn(
                      "flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm transition",
                      filter === value
                        ? "bg-primary/15 font-medium text-primary"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    {filterLabel(value)}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {message ? (
        <p className="rounded-lg bg-primary/15 px-3 py-2 text-sm text-primary">
          {message}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("feed.empty", language)}</p>
      ) : (
        <ul className="space-y-4">
          {visible.map((item) => {
            const entityType = item.kind;
            const entityId = item.data.id;
            const key = `${entityType}:${entityId}`;
            const authorId = item.data.user_id;
            const { profile, name } = authorFor(authorId);
            const isShared = item.data.is_shared;
            const isMine = authorId === userId;
            const recipientId =
              item.kind === "prayer" ? item.data.recipient_id : null;
            const isTargeted = Boolean(recipientId);
            const targetName =
              recipientId === userId
                ? myName
                : recipientId === partnerId
                  ? partnerName
                  : partnerName;
            const loves = reactionsByKey.get(key) ?? [];
            const lovedByMe = loves.some((r) => r.user_id === userId);
            const itemComments = commentsByKey.get(key) ?? [];
            const isOpen = expanded[key] ?? false;
            const showSocial = isShared;
            const canLove = showSocial && Boolean(partnerId) && !isMine;

            return (
              <li
                key={key}
                className="relative overflow-hidden rounded-2xl border border-border card-glow shadow-[0_0_32px_-18px_hsl(var(--primary)/0.45)]"
              >
                <div className="p-4 pb-2">
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      userId={authorId}
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
                      size={44}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), {
                          addSuffix: true,
                        })}
                        {isShared ? (
                          <>
                            {" · "}
                            <span className="text-primary/90">
                              {isTargeted
                                ? tf("feed.prayedFor", language, {
                                    name: targetName,
                                  })
                                : tf("feed.sharedWith", language, {
                                    name: partnerName,
                                  })}
                            </span>
                          </>
                        ) : (
                          <>
                            {" · "}
                            {t("common.private", language)}
                          </>
                        )}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        item.kind === "prayer"
                          ? "bg-fuchsia-500/20 text-fuchsia-200"
                          : "bg-amber-500/20 text-amber-200",
                      )}
                    >
                      {item.kind === "prayer"
                        ? t("feed.typePrayer", language)
                        : t("feed.typeGratitude", language)}
                    </span>
                  </div>

                  {item.kind === "prayer" ? (
                    <>
                      <h3 className="mt-3 text-lg font-semibold leading-snug">
                        {item.data.title}
                      </h3>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/95">
                        {item.data.content}
                      </p>
                    </>
                  ) : (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/95">
                      {item.data.content}
                    </p>
                  )}

                  {showSocial ? (
                    <div className="relative mt-2 flex items-center gap-0.5 border-t border-border/50 pt-1.5">
                      {canLove ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            toggleLove(entityType, entityId, authorId)
                          }
                          className={cn(
                            "relative inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition",
                            lovedByMe
                              ? "text-rose-300"
                              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                          )}
                        >
                          <Heart
                            className={cn(
                              "h-3.5 w-3.5",
                              lovedByMe && "fill-rose-400 text-rose-400",
                            )}
                          />
                          <span>{loves.length}</span>
                          {floating[key] ? (
                            <span
                              aria-hidden
                              className="pointer-events-none absolute -top-1 left-1/2 text-base text-rose-400 animate-heart-float"
                            >
                              ♥
                            </span>
                          ) : null}
                        </button>
                      ) : (
                        <div
                          className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 text-xs text-muted-foreground/70"
                          aria-label={`${t("feed.love", language)} ${loves.length}`}
                        >
                          <Heart
                            className={cn(
                              "h-3.5 w-3.5",
                              loves.length > 0 &&
                                "fill-rose-400/70 text-rose-400/70",
                            )}
                          />
                          <span>{loves.length}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((prev) => ({ ...prev, [key]: !isOpen }))
                        }
                        className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-medium text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {commentLabel(itemComments.length)}
                      </button>
                    </div>
                  ) : null}
                </div>

                {showSocial && isOpen ? (
                  <div className="space-y-2.5 border-t border-border/60 bg-background/40 px-4 py-2.5">
                    {itemComments.map((c) => {
                      const cAuthor = authorFor(c.user_id);
                      return (
                        <div key={c.id} className="flex gap-2">
                          <UserAvatar
                            userId={c.user_id}
                            displayName={cAuthor.name}
                            avatarUrl={cAuthor.profile?.avatar_url ?? null}
                            size={26}
                          />
                          <div className="min-w-0 flex-1 rounded-2xl bg-muted/50 px-2.5 py-1.5">
                            <p className="text-xs font-semibold">
                              {cAuthor.name}
                            </p>
                            <p className="text-sm leading-relaxed">{c.content}</p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(c.created_at), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        userId={me.id}
                        displayName={myName}
                        avatarUrl={me.avatar_url}
                        size={26}
                      />
                      <Input
                        className="min-h-9 flex-1 rounded-full bg-muted/40 text-sm"
                        placeholder={t("feed.writeComment", language)}
                        value={drafts[key] ?? ""}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            submitComment(entityType, entityId);
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        className="min-h-9 min-w-9 rounded-full"
                        disabled={pending}
                        onClick={() => submitComment(entityType, entityId)}
                        aria-label={t("feed.post", language)}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        title={t("feed.newPost", language)}
        blur
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-1">
            {(["prayer", "gratitude"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setPostType(type);
                  if (type === "gratitude") setPrayForPartner(false);
                }}
                className={cn(
                  "min-h-11 rounded-lg text-sm font-medium transition",
                  postType === type
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                {type === "prayer"
                  ? t("feed.typePrayer", language)
                  : t("feed.typeGratitude", language)}
              </button>
            ))}
          </div>

          {postType === "prayer" ? (
            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">
                {t("prayer.titleField", language)}
              </span>
              <Input
                className="min-h-11 bg-background"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
          ) : null}

          <label className="block space-y-1 text-sm">
            <span className="text-muted-foreground">
              {postType === "prayer"
                ? t("prayer.contentField", language)
                : t("gratitude.title", language)}
            </span>
            <textarea
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={
                postType === "gratitude"
                  ? t("gratitude.placeholder", language)
                  : undefined
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </label>

          <label className="flex min-h-11 items-center gap-3 text-sm">
            <Checkbox
              checked={shareWith || prayForPartner}
              disabled={prayForPartner}
              onCheckedChange={(v) => setShareWith(v === true)}
            />
            {tf("common.shareWithName", language, { name: partnerName })}
          </label>

          {postType === "prayer" && partnerId ? (
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <Checkbox
                checked={prayForPartner}
                onCheckedChange={(v) => {
                  const next = v === true;
                  setPrayForPartner(next);
                  if (next) setShareWith(true);
                }}
              />
              {tf("prayer.prayForName", language, { name: partnerName })}
            </label>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() => setComposerOpen(false)}
            >
              {t("common.cancel", language)}
            </Button>
            <Button className="min-h-11" disabled={pending} onClick={publish}>
              {t("feed.post", language)}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
