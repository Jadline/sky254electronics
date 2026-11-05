"use server";

import { randomBytes, randomInt } from "node:crypto";
import { after } from "next/server";
import { sendOrderAlert } from "@/lib/notify";
import { DELIVERY_METHODS, type DeliveryMethod } from "@/lib/order-labels";
import { createAdminClient } from "@/lib/supabase/admin";

export type CheckoutInput = {
  items: { slug: string; qty: number }[];
  /** The total the customer was shown. If it no longer matches, they review it first. */
  expectedSubtotal: number;
  name: string;
  phone: string;
  email: string;
  deliveryMethod: string;
  address: string;
  notes: string;
  /** A hidden field people never fill in, to catch simple bots. */
  website: string;
};

export type CheckoutResult = { ok: true; token: string } | { ok: false; error: string; field?: string };

const MAX_ORDERS_PER_PHONE = 5;
const RATE_WINDOW_MINUTES = 10;
const ORDER_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O or 1/I/L, easy to read over the phone

const clean = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/** Kenyan mobile numbers, stored as 2547XXXXXXXX or 2541XXXXXXXX. */
function normalisePhone(raw: string) {
  const digits = raw.replace(/[\s()-]/g, "").replace(/^\+/, "");
  if (/^0[17]\d{8}$/.test(digits)) return "254" + digits.slice(1);
  if (/^[17]\d{8}$/.test(digits)) return "254" + digits;
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  return null;
}

function orderNumber() {
  let code = "";
  for (let i = 0; i < 6; i++) code += ORDER_CHARS[randomInt(ORDER_CHARS.length)];
  return `SKY-${code}`;
}

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  // Bots that fill the hidden field get a generic failure and create nothing.
  if (clean(input?.website, 200)) return { ok: false, error: "We couldn't place that order. Please try again." };

  const name = clean(input.name, 100);
  if (name.length < 2) return { ok: false, error: "Please enter your name.", field: "name" };

  const phone = normalisePhone(clean(input.phone, 20));
  if (!phone) return { ok: false, error: "Please enter a valid Kenyan phone number, like 0712 345 678.", field: "phone" };

  const email = clean(input.email, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "That email address doesn't look right.", field: "email" };
  }

  const method = clean(input.deliveryMethod, 20);
  if (!Object.hasOwn(DELIVERY_METHODS, method)) return { ok: false, error: "Please choose how you'd like to get your order." };
  const deliveryMethod = method as DeliveryMethod;
  const address = clean(input.address, 300);
  if (DELIVERY_METHODS[deliveryMethod].needsAddress && address.length < 3) {
    return { ok: false, error: "Please tell us where to deliver.", field: "address" };
  }
  const notes = clean(input.notes, 500);

  // Combine repeated lines and check quantities.
  if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > 50) {
    return { ok: false, error: "Your cart is empty." };
  }
  const wanted = new Map<string, number>();
  for (const item of input.items) {
    const slug = clean(item?.slug, 200);
    const qty = Number(item?.qty);
    if (!slug || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      return { ok: false, error: "Something in your cart isn't right. Please review it and try again." };
    }
    wanted.set(slug, (wanted.get(slug) ?? 0) + qty);
  }

  const db = createAdminClient();

  const since = new Date(Date.now() - RATE_WINDOW_MINUTES * 60_000).toISOString();
  const { count, error: countError } = await db
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_phone", phone)
    .gte("created_at", since);
  if (countError) return { ok: false, error: "We couldn't place your order. Please try again." };
  if ((count ?? 0) >= MAX_ORDERS_PER_PHONE) {
    return { ok: false, error: "That's a lot of orders in a short time. Please wait a few minutes, or call us." };
  }

  // Every name and price comes from the database, never from the browser.
  const { data: products, error: productError } = await db
    .from("products")
    .select("id, slug, name, price_kes, in_stock, is_active")
    .in("slug", [...wanted.keys()]);
  if (productError) return { ok: false, error: "We couldn't place your order. Please try again." };

  const lines: { product_id: string; product_name: string; price_kes: number; qty: number; line_total_kes: number }[] = [];
  for (const [slug, qty] of wanted) {
    const product = products.find((p) => p.slug === slug);
    if (!product || !product.is_active || !product.in_stock || product.price_kes == null) {
      return {
        ok: false,
        error: `${product?.name ?? "An item in your cart"} is no longer available. Please remove it from your cart.`,
      };
    }
    lines.push({
      product_id: product.id,
      product_name: product.name,
      price_kes: product.price_kes,
      qty,
      line_total_kes: product.price_kes * qty,
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.line_total_kes, 0);
  if (subtotal <= 0) return { ok: false, error: "Your cart is empty." };
  if (subtotal !== input.expectedSubtotal) {
    return { ok: false, error: "A price in your cart has changed. Please check the new total and try again." };
  }

  const token = randomBytes(24).toString("base64url");
  let order: { id: string; order_number: string } | null = null;
  for (let attempt = 0; attempt < 5 && !order; attempt++) {
    const { data, error } = await db
      .from("orders")
      .insert({
        order_number: orderNumber(),
        access_token: token,
        payment_method: "cash",
        customer_name: name,
        customer_phone: phone,
        customer_email: email || null,
        delivery_method: deliveryMethod,
        delivery_address: DELIVERY_METHODS[deliveryMethod].needsAddress ? address : null,
        notes: notes || null,
        subtotal_kes: subtotal,
        total_kes: subtotal,
      })
      .select("id, order_number")
      .single();
    if (data) order = data;
    // Retry only if the random order number was already taken.
    else if (error?.code !== "23505") break;
  }
  if (!order) return { ok: false, error: "We couldn't place your order. Please try again." };

  const { error: itemsError } = await db
    .from("order_items")
    .insert(lines.map((line) => ({ ...line, order_id: order.id })));
  if (itemsError) {
    await db.from("orders").delete().eq("id", order.id);
    return { ok: false, error: "We couldn't place your order. Please try again." };
  }

  const placed = order;
  after(() =>
    sendOrderAlert({
      orderNumber: placed.order_number,
      customerName: name,
      customerPhone: phone,
      deliveryMethod,
      deliveryAddress: DELIVERY_METHODS[deliveryMethod].needsAddress ? address : null,
      notes: notes || null,
      subtotalKes: subtotal,
      adminUrl: `${process.env.SITE_URL ?? ""}/admin/orders/${placed.id}`,
      items: lines.map((line) => ({ name: line.product_name, qty: line.qty, lineTotalKes: line.line_total_kes })),
    }),
  );

  return { ok: true, token };
}
