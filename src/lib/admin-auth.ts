import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in admin, or null. Being signed in isn't enough: they must be in the admins table.
 * Cached per request, so the layout, the badges and the page share one check.
 */
export const getAdmin = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) return null;
  return { supabase, user };
});

/** Call first in every admin page and action. Sends anyone else to the login page. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** A name to greet the admin by: their profile name, else the first part of their email. */
export function adminName(user: { email?: string; user_metadata?: Record<string, unknown> }) {
  const fromProfile = user.user_metadata?.name ?? user.user_metadata?.full_name;
  if (typeof fromProfile === "string" && fromProfile.trim()) return fromProfile.trim().split(/\s+/)[0];
  const local = (user.email ?? "").split("@")[0].split(/[._+-]/)[0];
  return local ? local[0].toUpperCase() + local.slice(1) : "there";
}
