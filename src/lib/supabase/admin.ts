import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Full database access that bypasses Row Level Security. Server only: the
 * "server-only" import makes the build fail if browser code imports this file.
 * Use it for trusted work such as admin tasks, never for visitor requests by default.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
