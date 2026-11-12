"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** At most one refresh this often, however many changes arrive. */
const MIN_GAP_MS = 2000;
/** A tab hidden longer than this refreshes when shown again, announcement or not. */
const AWAY_MS = 10_000;

/**
 * Keeps an open page up to date: when the dashboard saves a change, the server
 * announces it on `topic` (lib/live.ts) and this re-fetches the page's data.
 * router.refresh() keeps scroll position, the cart and anything typed in forms.
 * A tab in the background refreshes when it's shown again instead.
 *
 * Browsers throttle background tabs, which can silently drop the Realtime connection,
 * so an announcement can be missed. To cover that, a tab that was away for a while
 * also refreshes when it comes back, and so does one whose connection reconnects.
 */
export function LiveUpdates({ topic }: { topic: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let last = 0;
    let timer: number | undefined;
    let stale = false;
    let hiddenAt = document.visibilityState === "hidden" ? Date.now() : 0;
    let subscribedOnce = false;

    const refresh = () => {
      timer = undefined;
      if (document.visibilityState === "hidden") {
        stale = true;
        return;
      }
      last = Date.now();
      router.refresh();
    };
    const onChange = () => {
      if (timer !== undefined) return; // one is already on its way
      timer = window.setTimeout(refresh, Math.max(300, MIN_GAP_MS - (Date.now() - last)));
    };
    const onVisible = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }
      const away = hiddenAt > 0 && Date.now() - hiddenAt > AWAY_MS;
      hiddenAt = 0;
      if (stale || away) {
        stale = false;
        onChange();
      }
    };

    const channel = supabase
      .channel(topic)
      .on("broadcast", { event: "changed" }, onChange)
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        // A reconnect may have missed announcements while the connection was down.
        if (subscribedOnce) onChange();
        subscribedOnce = true;
      });
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [router, topic]);

  return null;
}
