"use server";

import { revalidatePath, updateTag } from "next/cache";
import type { FormState } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { announce, CATALOG_TOPIC } from "@/lib/live";

/** Reviews are cached with the catalogue, so a change clears it and refreshes open pages. */
function refresh() {
  updateTag("catalog");
  revalidatePath("/", "layout");
  announce(CATALOG_TOPIC);
}

export async function setReviewStatus(id: string, status: "approved" | "hidden" | "pending"): Promise<FormState> {
  const { supabase } = await requireAdmin();
  if (!["approved", "hidden", "pending"].includes(status)) return { error: "Unknown status." };
  const { error } = await supabase.from("product_reviews").update({ status }).eq("id", id);
  if (error) return { error: "Couldn't save." };
  refresh();
  return { message: status === "approved" ? "Approved. It's live on the product page." : status === "hidden" ? "Hidden from the shop" : "Moved back to waiting" };
}

export async function deleteReview(id: string): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("product_reviews").delete().eq("id", id);
  if (error) return { error: "Couldn't delete." };
  refresh();
  return { message: "Deleted" };
}
