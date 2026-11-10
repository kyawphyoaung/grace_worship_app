"use client";

import { useEffect } from "react";

/** Registers `/sw.js` once the app is interactive. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // Registration can fail on insecure origins other than localhost.
      }
    };

    void register();
  }, []);

  return null;
}
