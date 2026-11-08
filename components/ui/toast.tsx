"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type ToastState = { id: number; message: string } | null;

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const showToast = useCallback((message: string) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (clearTimer.current) clearTimeout(clearTimer.current);
    idRef.current += 1;
    setToast({ id: idRef.current, message });
    setVisible(true);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      clearTimer.current = setTimeout(() => setToast(null), 280);
    }, 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 transition-opacity duration-300 md:bottom-8",
            visible ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="rounded-full border border-primary/30 bg-card/95 px-4 py-2.5 text-sm text-foreground shadow-lg backdrop-blur">
            {toast.message}
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
