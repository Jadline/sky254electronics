"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { announce, CATALOG_TOPIC } from "@/lib/live";
import { isLegalSlug, LEGAL_BODY_MAX, SITE_PAGES } from "@/lib/site-pages";

export type LegalSaveResult = { ok: true; updatedAt: string } | { ok: false; error: string };

/** Saves a legal page's text (Markdown from the Legal pages editor). It's live straight away. */
export async function saveLegalPage(slug: string, rawBody: string): Promise<LegalSaveResult> {
  const { supabase } = await requireAdmin();
  if (!isLegalSlug(slug)) return { ok: false, error: "That page doesn't exist." };

  const body = String(rawBody ?? "").replace(/\r\n?/g, "\n").trim();
  if (!body) return { ok: false, error: "The page is empty. Write or paste the policy first, or reset it to our starter text." };
  if (body.length > LEGAL_BODY_MAX) return { ok: false, error: "That text is too long for one page." };

  // The rows come from the site pages migration; the dashboard may only update them.
  const { data, error } = await supabase.from("site_pages").update({ body }).eq("slug", slug).select("updated_at");
  if (error) return { ok: false, error: "Couldn't save the page. Please try again." };
  if (!data?.length) return { ok: false, error: "This page isn't set up in the database yet. Run the site pages migration first." };

  // Pages are cached with the catalogue, so clear that and refresh open tabs.
  updateTag("catalog");
  revalidatePath(SITE_PAGES[slug].path);
  revalidatePath("/admin/legal", "layout");
  announce(CATALOG_TOPIC);
  return { ok: true, updatedAt: data[0].updated_at };
}
