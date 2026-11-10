"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin-auth";

/** Marks a contact-form message as dealt with, or back to new. */
export async function setEnquiryStatus(id: string, status: "new" | "done"): Promise<FormState> {
  const { supabase } = await requireAdmin();
  if (status !== "new" && status !== "done") return { error: "Unknown status." };
  const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);
  if (error) return { error: "Couldn't save." };
  revalidatePath("/admin", "layout");
  return { message: status === "done" ? "Marked as done" : "Moved back to new" };
}

export async function deleteEnquiry(id: string): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("enquiries").delete().eq("id", id);
  if (error) return { error: "Couldn't delete." };
  revalidatePath("/admin", "layout");
  return { message: "Deleted" };
}
