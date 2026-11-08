"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type PickerOption = {
  value: string;
  label: string;
  searchText?: string;
};

type Mode = "wheel" | "grid";

export function PickerSheet({
  label,
  value,
  options,
  onChange,
  mode = "wheel",
  searchable = false,
  searchPlaceholder = "Search…",
  doneLabel = "Done",
  columns = 5,
}: {
  label: string;
  value: string;
  options: PickerOption[];
  onChange: (value: string) => void;
  mode?: Mode;
  searchable?: boolean;
  searchPlaceholder?: string;
  doneLabel?: string;
  columns?: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState(value);
  const titleId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) =>
      (o.searchText ?? o.label).toLowerCase().includes(q),
    );
  }, [options, query, searchable]);

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    setQuery("");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, value]);

  useEffect(() => {
    if (!open || mode !== "wheel") return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-value="${CSS.escape(draft)}"]`,
    );
    el?.scrollIntoView({ block: "center" });
  }, [open, draft, mode, filtered]);

  const commit = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div className="w-full">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 text-left text-base text-foreground transition-colors hover:border-primary/40"
      >
        <span className="min-w-0">
          <span className="block text-xs text-muted-foreground">{label}</span>
          <span className="block truncate font-medium">
            {selected?.label ?? "—"}
          </span>
        </span>
        <span className="text-muted-foreground" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 flex max-h-[85vh] w-full flex-col rounded-t-2xl border border-border bg-card shadow-xl sm:max-h-[70vh] sm:max-w-md sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 id={titleId} className="text-base font-semibold">
                {label}
              </h2>
              <button
                type="button"
                className="min-h-11 min-w-11 rounded-lg px-3 text-sm font-medium text-primary"
                onClick={() => commit(draft)}
              >
                {doneLabel}
              </button>
            </div>

            {searchable ? (
              <div className="border-b border-border px-4 py-3">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-base"
                />
              </div>
            ) : null}

            {mode === "grid" ? (
              <div className="overflow-y-auto p-4">
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                >
                  {filtered.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => commit(opt.value)}
                      className={cn(
                        "flex min-h-12 items-center justify-center rounded-xl text-lg font-medium transition-colors",
                        opt.value === value
                          ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                          : "bg-muted/50 text-foreground hover:bg-muted",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div
                ref={listRef}
                className="snap-y snap-mandatory overflow-y-auto overscroll-contain py-8"
                style={{ scrollSnapType: "y mandatory" }}
              >
                {filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    data-value={opt.value}
                    onClick={() => setDraft(opt.value)}
                    onDoubleClick={() => commit(opt.value)}
                    className={cn(
                      "flex w-full snap-center items-center justify-center px-4 text-lg transition-colors",
                      "min-h-12",
                      opt.value === draft
                        ? "bg-primary/15 font-semibold text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
