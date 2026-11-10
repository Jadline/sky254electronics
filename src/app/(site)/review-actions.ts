"use server";

import { normalisePhone } from "@/lib/order-labels";
import { REVIEW_LIMITS } from "@/lib/reviews";
import { createAdminClient } from "@/lib/supabase/admin";

export type ReviewResult = { ok: boolean; message: string; field?: string };

/** At most this many reviews from one phone per day, to stop floods. */
const MAX_PER_DAY = 5;

/**
 * Saves a review for the shop to approve. The phone number is private: it marks the
 * review as from a verified buyer when that phone has a confirmed order for the product,
 * and allows one review per product per phone.
 */
export async function submitReview(_: ReviewResult | null, form: FormData): Promise<ReviewResult> {
  const value = (key: string, max: number) => String(form.get(key) ?? "").trim().slice(0, max);
  // Bots that fill the hidden field are told it worked, and nothing is saved.
  if (value("website", 200)) return { ok: true, message: "Thanks! Your review will appear once we've checked it." };

  const slug = value("product", 200);
  const name = value("name", REVIEW_LIMITS.name);
  const phone = normalisePhone(value("phone", 20));
  const rating = Number(form.get("rating"));
  const title = value("title", REVIEW_LIMITS.title) || null;
  const body = String(form.get("body") ?? "").trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, message: "Please choose from 1 to 5 stars.", field: "rating" };
  if (!name) return { ok: false, message: "Please enter your name.", field: "name" };
  if (!phone) return { ok: false, message: "Please enter a valid Kenyan phone number, like 0712 345 678.", field: "phone" };
  if (body.length < 10) return { ok: false, message: "Please write a few words about the product.", field: "body" };
  if (body.length > REVIEW_LIMITS.body) return { ok: false, message: "Please keep your review under 2,000 characters.", field: "body" };

  const db = createAdminClient();
  const { data: product } = await db.from("products").select("id").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (!product) return { ok: false, message: "We couldn't find that product." };

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await db.from("product_reviews").select("id", { count: "exact", head: true }).eq("phone", phone).gte("created_at", since);
  if ((count ?? 0) >= MAX_PER_DAY) return { ok: false, message: "Thanks for all your reviews! Please try again tomorrow." };

  // A verified buyer: this phone has an order with this product that the shop confirmed.
  const { data: bought } = await db
    .from("order_items")
    .select("id, orders!inner(customer_phone, status)")
    .eq("product_id", product.id)
    .eq("orders.customer_phone", phone)
    .in("orders.status", ["confirmed", "out_for_delivery", "completed"])
    .limit(1);

  const { error } = await db.from("product_reviews").insert({
    product_id: product.id,
    name,
    rating,
    title,
    body,
    phone,
    verified: (bought?.length ?? 0) > 0,
  });
  if (error?.code === "23505") return { ok: false, message: "You've already reviewed this product. Thank you!" };
  if (error) return { ok: false, message: "We couldn't save your review just now. Please try again." };
  return { ok: true, message: `Thanks, ${name.split(" ")[0]}! Your review will appear once we've checked it.` };
}
