"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  blur = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  blur?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className={cn(
          "absolute inset-0 bg-black/60",
          blur && "bg-indigo-950/55 backdrop-blur-md",
        )}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-xl",
          blur &&
            "border-primary/20 bg-gradient-to-b from-card via-card to-primary/5 shadow-[0_0_48px_-12px_hsl(var(--primary)/0.45)]",
          className,
        )}
      >
        <h2 id="modal-title" className="mb-4 text-lg font-semibold text-foreground">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
