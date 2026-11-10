"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Keeps an open admin tab up to date with new orders and changes saved elsewhere:
 * re-fetches the page's server data when the tab comes back into view, and every
 * `everySeconds` while it is visible. Nothing runs in a hidden tab.
 * router.refresh() keeps what's typed in forms, so it is safe on pages being edited.
 */
export function LiveRefresh({ everySeconds }: { everySeconds: number }) {
  const router = useRouter();

  useEffect(() => {
    let last = Date.now();
    const refresh = () => {
      // Coming back to the tab several times in a row reloads once.
      if (Date.now() - last < 5_000) return;
      last = Date.now();
      router.refresh();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const timer = window.setInterval(onVisible, everySeconds * 1000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [router, everySeconds]);

  return null;
}
