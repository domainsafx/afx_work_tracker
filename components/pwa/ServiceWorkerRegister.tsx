"use client";

import { useEffect } from "react";

/**
 * Registers /public/sw.js. This is what makes the app installable as a PWA
 * (Chrome's install prompt / "Add to Home screen") and is a hard
 * requirement for the Trusted Web Activity (TWA) APK wrapper — Android
 * won't treat a TWA as verified/standalone without an active, controlling
 * service worker. Runs client-side only and no-ops outside a browser
 * (SSR) or on unsupported browsers.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Registered after load so it never competes with the initial page's
    // own network requests for bandwidth/priority.
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker registration failed:", err);
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
