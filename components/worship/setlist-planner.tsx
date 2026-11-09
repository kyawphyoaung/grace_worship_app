"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { t, type Language } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { PickerSheet } from "@/components/ui/picker-sheet";
import {
  MUSIC_KEYS,
  songTimeSignature,
  songTitle,
} from "@/lib/worship/constants";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Song = Database["public"]["Tables"]["songs"]["Row"];
type Setlist = Database["public"]["Tables"]["setlists"]["Row"];
type SetlistItem = Database["public"]["Tables"]["setlist_items"]["Row"];

export type SetlistItemView = SetlistItem & { song: Song };

function SortableRow({
  item,
  language,
  onEdit,
  onRemove,
}: {
  item: SetlistItemView;
  language: Language;
  onEdit: (item: SetlistItemView) => void;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const title = songTitle(item.song, language === "mm" ? "mm" : "en");
  const key = item.key_override || item.song.default_key;
  const timeSig = songTimeSignature(item.song);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border border-primary/20 bg-card/80 px-2 py-2",
        isDragging &&
          "z-20 opacity-95 shadow-[0_0_24px_-8px_hsl(var(--primary))]",
      )}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="flex min-h-11 min-w-11 shrink-0 touch-none items-center justify-center rounded-lg border border-teal-400/40 bg-primary/15 text-primary"
          aria-label={t("worship.dragHint", language)}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            <span className="mr-1.5 text-primary">{item.position}.</span>
            {title}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {[
              key ? `${t("worship.key", language)} ${key}` : null,
              timeSig,
              item.song.bpm != null
                ? `${item.song.bpm} ${t("worship.bpm", language)}`
                : null,
              item.transition_note ? `→ ${item.transition_note}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        <button
          type="button"
          aria-label={t("worship.editSetlistItem", language)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-primary hover:bg-primary/10"
          onClick={() => onEdit(item)}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={t("worship.removeFromSetlist", language)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"
          onClick={() => onRemove(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function SetlistPlanner({
  language,
  userId,
  eventId,
  setlist,
  items,
  songs,
}: {
  language: Language;
  userId: string;
  eventId: string;
  setlist: Setlist | null;
  items: SetlistItemView[];
  songs: Song[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [localItems, setLocalItems] = useState(items);
  const [editing, setEditing] = useState<SetlistItemView | null>(null);
  const [editKey, setEditKey] = useState("");
  const [editTransition, setEditTransition] = useState("");

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ensureSetlist = async () => {
    if (setlist) return setlist.id;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("setlists")
      .insert({ event_id: eventId, user_id: userId })
      .select("*")
      .single();
    if (error || !data)
      throw new Error(error?.message ?? "Failed to create setlist");
    return data.id;
  };

  const persistOrder = async (ordered: SetlistItemView[]) => {
    const supabase = createClient();
    await Promise.all(
      ordered.map((item, idx) =>
        supabase
          .from("setlist_items")
          .update({ position: 1000 + idx + 1 })
          .eq("id", item.id),
      ),
    );
    await Promise.all(
      ordered.map((item, idx) =>
        supabase
          .from("setlist_items")
          .update({ position: idx + 1 })
          .eq("id", item.id),
      ),
    );
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localItems.findIndex((i) => i.id === active.id);
    const newIndex = localItems.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(localItems, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      position: idx + 1,
    }));
    setLocalItems(next);
    startTransition(async () => {
      try {
        await persistOrder(next);
        router.refresh();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Reorder failed");
      }
    });
  };

  const addSong = (song: Song) => {
    startTransition(async () => {
      try {
        const supabase = createClient();
        const setlistId = await ensureSetlist();
        const position = localItems.length + 1;
        const { error } = await supabase.from("setlist_items").insert({
          setlist_id: setlistId,
          song_id: song.id,
          position,
        });
        if (error) {
          showToast(error.message);
          return;
        }
        setPickerOpen(false);
        setQuery("");
        router.refresh();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed to add");
      }
    });
  };

  const openEdit = (item: SetlistItemView) => {
    setEditing(item);
    setEditKey(item.key_override || item.song.default_key || "C");
    setEditTransition(item.transition_note ?? "");
  };

  const saveEdit = () => {
    if (!editing) return;
    const defaultKey = editing.song.default_key;
    const keyOverride =
      editKey && editKey !== defaultKey ? editKey : null;
    const patch = {
      key_override: keyOverride,
      transition_note: editTransition.trim() || null,
    };
    setLocalItems((prev) =>
      prev.map((item) =>
        item.id === editing.id ? { ...item, ...patch } : item,
      ),
    );
    setEditing(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("setlist_items")
        .update(patch)
        .eq("id", editing.id);
      if (error) showToast(error.message);
      else router.refresh();
    });
  };

  const removeItem = (id: string) => {
    startTransition(async () => {
      const supabase = createClient();
      const remaining = localItems
        .filter((i) => i.id !== id)
        .map((item, idx) => ({ ...item, position: idx + 1 }));
      setLocalItems(remaining);
      const { error } = await supabase
        .from("setlist_items")
        .delete()
        .eq("id", id);
      if (error) {
        showToast(error.message);
        return;
      }
      if (remaining.length > 0) await persistOrder(remaining);
      router.refresh();
    });
  };

  const inSetlist = new Set(localItems.map((i) => i.song_id));
  const pickerSongs = songs.filter((song) => {
    if (inSetlist.has(song.id)) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [
      song.title_en ?? "",
      song.title_mm ?? "",
      song.author ?? "",
      ...(song.tags ?? []),
    ]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  const keyOptions = [
    ...(editing?.song.default_key
      ? [
          {
            value: editing.song.default_key,
            label: `${editing.song.default_key} (default)`,
          },
        ]
      : [{ value: "", label: "—" }]),
    ...MUSIC_KEYS.filter((k) => k !== editing?.song.default_key).map((k) => ({
      value: k,
      label: k,
    })),
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">
            {t("worship.setlist", language)}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("worship.dragHint", language)}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="min-h-10"
          onClick={() => setPickerOpen(true)}
          disabled={pending}
        >
          <Plus className="h-4 w-4" />
          {t("worship.addToSetlist", language)}
        </Button>
      </div>

      {localItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {t("worship.emptySetlist", language)}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={localItems.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {localItems.map((item) => (
                <SortableRow
                  key={item.id}
                  item={item}
                  language={language}
                  onEdit={openEdit}
                  onRemove={removeItem}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={t("worship.addToSetlist", language)}
        className="max-h-[85vh] overflow-y-auto"
        blur
      >
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("worship.searchAddSong", language)}
            className="min-h-11 pl-9 pr-9"
            autoFocus
          />
          {query ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
              onClick={() => setQuery("")}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
          {pickerSongs.length === 0 ? (
            <li className="py-6 text-center text-sm text-muted-foreground">
              {t("common.empty", language)}
            </li>
          ) : (
            pickerSongs.map((song) => (
              <li key={song.id}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => addSong(song)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/30 px-3 py-3 text-left hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {songTitle(song, language === "mm" ? "mm" : "en")}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {[song.author, song.default_key, songTimeSignature(song)]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <Plus className="h-4 w-4 shrink-0 text-primary" />
                </button>
              </li>
            ))
          )}
        </ul>
      </Modal>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={t("worship.editSetlistItem", language)}
        className="max-w-md"
        blur
      >
        {editing ? (
          <div className="space-y-4">
            <p className="text-sm font-medium">
              {songTitle(editing.song, language === "mm" ? "mm" : "en")}
            </p>
            <PickerSheet
              label={t("worship.keyOverride", language)}
              value={editKey || editing.song.default_key || "C"}
              onChange={setEditKey}
              mode="grid"
              columns={5}
              doneLabel={t("common.done", language)}
              options={keyOptions.filter((o) => o.value)}
            />
            <div className="space-y-1.5">
              <Label>{t("worship.transitionNote", language)}</Label>
              <Input
                value={editTransition}
                onChange={(e) => setEditTransition(e.target.value)}
                className="min-h-11"
                placeholder={t("common.optional", language)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => setEditing(null)}
              >
                {t("common.cancel", language)}
              </Button>
              <Button
                type="button"
                className="min-h-11"
                disabled={pending}
                onClick={saveEdit}
              >
                {t("common.save", language)}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
