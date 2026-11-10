import "server-only";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Topics that open pages listen on (see components/live-updates.tsx). */
export const CATALOG_TOPIC = "catalog";
export const orderTopic = (orderId: string) => `order:${orderId}`;

/**
 * Tells every open page listening on `topic` to fetch fresh data, through Supabase
 * Realtime. Runs after the response is sent, so a save never waits on it, and a
 * failure only means open pages update on their next visit instead of at once.
 */
export function announce(topic: string) {
  after(async () => {
    const supabase = createAdminClient();
    const channel = supabase.channel(topic);
    try {
      await channel.httpSend("changed", {}, { timeout: 5000 });
    } catch {
      // Best effort: see above.
    } finally {
      await supabase.removeChannel(channel);
    }
  });
}
