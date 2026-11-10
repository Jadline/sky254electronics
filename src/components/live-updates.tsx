"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** At most one refresh this often, however many changes arrive. */
const MIN_GAP_MS = 2000;

/**
 * Keeps an open page up to date: when the dashboard saves a change, the server
 * announces it on `topic` (lib/live.ts) and this re-fetches the page's data.
 * router.refresh() keeps scroll position, the cart and anything typed in forms.
 * A tab in the background refreshes when it's shown again instead.
 */
export function LiveUpdates({ topic }: { topic: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let last = 0;
    let timer: number | undefined;
    let stale = false;

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
      if (stale && document.visibilityState === "visible") {
        stale = false;
        onChange();
      }
    };

    const channel = supabase.channel(topic).on("broadcast", { event: "changed" }, onChange).subscribe();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [router, topic]);

  return null;
}
