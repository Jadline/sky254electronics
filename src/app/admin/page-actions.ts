"use server";

import { revalidatePath, updateTag } from "next/cache";
import type { FormState } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { announce, CATALOG_TOPIC } from "@/lib/live";
import { isSitePageSlug, PAGE_LIMITS, SITE_PAGES } from "@/lib/site-pages";

/** Saves an information page's title, Google description and text. */
export async function saveSitePage(_: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const slug = String(form.get("slug") ?? "");
  if (!isSitePageSlug(slug)) return { error: "That page doesn't exist." };

  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim() || null;
  const body = String(form.get("body") ?? "").replace(/\r\n?/g, "\n").trim();
  if (!title) return { error: "Please enter a title." };
  if (title.length > PAGE_LIMITS.title) return { error: `Please keep the title under ${PAGE_LIMITS.title} characters.` };
  if (description && description.length > PAGE_LIMITS.description)
    return { error: `Please keep the Google description under ${PAGE_LIMITS.description} characters.` };
  if (body.length > PAGE_LIMITS.body) return { error: "That text is too long." };

  const { data, error } = await supabase.from("site_pages").update({ title, description, body }).eq("slug", slug).select("slug");
  if (error) return { error: "Couldn't save." };
  if (!data?.length) return { error: "This page isn't set up in the database yet. Run the site pages migration first." };

  // Pages are cached with the catalogue, so clear that and refresh open tabs.
  updateTag("catalog");
  revalidatePath(SITE_PAGES[slug].path);
  revalidatePath("/admin/pages", "layout");
  announce(CATALOG_TOPIC);
  return { message: "Saved. The page is live." };
}
