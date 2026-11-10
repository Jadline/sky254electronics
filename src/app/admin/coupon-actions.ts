"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { isValidCode, normaliseCode } from "@/lib/coupons";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

/** A whole number of shillings (or percent), blank for "none". undefined = not a valid number. */
function whole(raw: string): number | null | undefined {
  if (raw === "") return null;
  const cleaned = raw.replace(/[,\s]/g, "");
  if (!/^\d+$/.test(cleaned)) return undefined;
  const n = Number(cleaned);
  return n > 0 && n <= 100_000_000 ? n : undefined;
}

/** A yyyy-mm-dd date in Nairobi time (UTC+3 all year), at the start or the very end of that day. */
function nairobiDate(raw: string, end: boolean): string | null | undefined {
  if (raw === "") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(Date.parse(raw))) return undefined;
  return `${raw}T${end ? "23:59:59" : "00:00:00"}+03:00`;
}

export async function saveCoupon(form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = text(form, "id");
  const code = normaliseCode(text(form, "code"));
  if (!isValidCode(code)) return { error: "Codes are 3 to 30 letters, numbers or dashes, like SAVE10." };

  const kind = text(form, "kind");
  if (kind !== "percent" && kind !== "amount") return { error: "Please choose a percentage or an amount off." };
  const value = whole(text(form, "value"));
  if (value == null) return { error: kind === "percent" ? "Please enter the percentage off." : "Please enter the amount off." };
  if (kind === "percent" && value > 90) return { error: "A percentage coupon can take at most 90% off." };

  const minSubtotal = whole(text(form, "min_subtotal_kes"));
  const maxDiscount = whole(text(form, "max_discount_kes"));
  const maxUses = whole(text(form, "max_uses"));
  if (minSubtotal === undefined || maxDiscount === undefined || maxUses === undefined) return { error: "Please check the numbers: whole numbers only." };

  const startsAt = nairobiDate(text(form, "starts_on"), false);
  const endsAt = nairobiDate(text(form, "ends_on"), true);
  if (startsAt === undefined || endsAt === undefined) return { error: "Please check the dates." };
  if (startsAt && endsAt && endsAt <= startsAt) return { error: "The last day must be after the first day." };

  const row = {
    code,
    kind,
    value: value as number,
    min_subtotal_kes: minSubtotal,
    max_discount_kes: kind === "percent" ? maxDiscount : null,
    max_uses: maxUses,
    starts_at: startsAt,
    ends_at: endsAt,
    once_per_customer: form.get("once_per_customer") === "on",
    is_active: form.get("is_active") === "on",
    note: text(form, "note").slice(0, 200) || null,
  };

  const { error } = id ? await supabase.from("coupons").update(row).eq("id", id) : await supabase.from("coupons").insert(row);
  if (error) return { error: error.code === "23505" ? "There's already a coupon with that code." : "Couldn't save the coupon." };
  revalidatePath("/admin/coupons");
  return { message: id ? `Saved ${code}` : `Added ${code}` };
}

export async function setCouponActive(id: string, on: boolean): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("coupons").update({ is_active: on }).eq("id", id);
  if (error) return { error: "Couldn't save." };
  revalidatePath("/admin/coupons");
  return { message: on ? "Switched on" : "Switched off" };
}

/** Orders keep the code and discount they used, so deleting a coupon doesn't change them. */
export async function deleteCoupon(id: string): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) return { error: "Couldn't delete." };
  revalidatePath("/admin/coupons");
  return { message: "Deleted" };
}
