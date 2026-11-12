"use server";

import { revalidatePath, updateTag } from "next/cache";
import type { FormState } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { announce, CATALOG_TOPIC } from "@/lib/live";

const text = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").trim().slice(0, max);

/** Checkout reads delivery with the catalogue, so a change clears it and refreshes open pages. */
function refresh() {
  updateTag("catalog");
  revalidatePath("/", "layout");
  announce(CATALOG_TOPIC);
}

/** Whole shillings. Blank = null. undefined = not a valid amount. */
function shillings(raw: string): number | null | undefined {
  if (raw === "") return null;
  const cleaned = raw.replace(/[,\s]/g, "");
  if (!/^\d+$/.test(cleaned)) return undefined;
  const n = Number(cleaned);
  return n <= 10_000_000 ? n : undefined;
}

type Table = "delivery_options" | "pickup_points";
const isTable = (t: string): t is Table => t === "delivery_options" || t === "pickup_points";

export async function saveDeliveryOption(form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = text(form, "id", 40);
  const name = text(form, "name", 160);
  if (!name) return { error: "Please enter a name." };
  const cost = shillings(text(form, "cost_kes", 20));
  if (cost === undefined) return { error: "Cost must be a whole number of shillings." };

  const row = {
    name,
    areas: text(form, "areas", 500) || null,
    town: text(form, "town", 80) || null,
    cost_kes: cost,
    own_rider: form.get("own_rider") === "on",
  };
  const { error } = id
    ? await supabase.from("delivery_options").update(row).eq("id", id)
    : await supabase.from("delivery_options").insert({ ...row, sort_order: await nextSort(supabase, "delivery_options") });
  if (error) return { error: "Couldn't save." };
  refresh();
  return { message: id ? "Saved" : "Added" };
}

export async function savePickupPoint(form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = text(form, "id", 40);
  const name = text(form, "name", 160);
  if (!name) return { error: "Please enter a name." };

  const row = { name, address: text(form, "address", 300) || null, hours: text(form, "hours", 120) || null };
  const { error } = id
    ? await supabase.from("pickup_points").update(row).eq("id", id)
    : await supabase.from("pickup_points").insert({ ...row, sort_order: await nextSort(supabase, "pickup_points") });
  if (error) return { error: "Couldn't save." };
  refresh();
  return { message: id ? "Saved" : "Added" };
}

/** New ones go to the end of the list. */
async function nextSort(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], table: Table) {
  const { data } = await supabase.from(table).select("sort_order").order("sort_order", { ascending: false }).limit(1);
  return (data?.[0]?.sort_order ?? 0) + 1;
}

/** The switches in the table: shown at checkout, and (for delivery options) own rider. */
export async function setDeliverySwitch(table: string, id: string, field: string, on: boolean): Promise<FormState> {
  const { supabase } = await requireAdmin();
  if (!isTable(table) || !(field === "is_active" || (field === "own_rider" && table === "delivery_options"))) return { error: "Unknown setting." };
  const { error } = await supabase.from(table).update({ [field]: on }).eq("id", id);
  if (error) return { error: "Couldn't save." };
  refresh();
  return { message: field === "is_active" ? (on ? "Shown at checkout" : "Hidden from checkout") : on ? "Own rider: pay on delivery" : "Courier: M-Pesa first" };
}

/** Orders keep the name they were placed with, so deleting doesn't change them. */
export async function deleteDeliveryRow(table: string, id: string): Promise<FormState> {
  const { supabase } = await requireAdmin();
  if (!isTable(table)) return { error: "Unknown list." };
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return { error: "Couldn't delete." };
  refresh();
  return { message: "Deleted" };
}

export async function saveFreeDelivery(form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const amount = shillings(text(form, "free_delivery_over_kes", 20));
  if (amount === undefined) return { error: "Enter a whole number of shillings, or leave it blank." };
  const { error } = await supabase
    .from("shop_settings")
    .update({ free_delivery_over_kes: amount || null })
    .eq("id", 1);
  if (error) return { error: "Couldn't save." };
  refresh();
  return { message: amount ? "Saved" : "Free delivery off" };
}
