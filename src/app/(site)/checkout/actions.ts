"use server";

import { randomBytes, randomInt } from "node:crypto";
import { after } from "next/server";
import { getDelivery } from "@/lib/catalog";
import { choiceFee, choiceMethod, choiceName, findChoice } from "@/lib/delivery";
import { sendCustomerUpdate, sendOrderAlert } from "@/lib/notify";
import { normalisePhone } from "@/lib/order-labels";
import { paymentOptions, type PaymentChoice } from "@/lib/payment-options";
import { pesapalReady } from "@/lib/pesapal";
import { salePrice } from "@/lib/pricing";
import { createAdminClient } from "@/lib/supabase/admin";

export type CheckoutInput = {
  items: { slug: string; qty: number }[];
  /** The total the customer was shown. If it no longer matches, they review it first. */
  expectedSubtotal: number;
  name: string;
  phone: string;
  email: string;
  /** The delivery option or pickup point chosen: "option:<id>" or "pickup:<id>". */
  delivery: string;
  address: string;
  notes: string;
  /** How they'll pay: "mpesa", "cash", "shop" or "online" (only while Pesapal is switched on). */
  paymentMethod: string;
  /** A hidden field people never fill in, to catch simple bots. */
  website: string;
};

export type CheckoutResult = { ok: true; token: string; orderNumber: string } | { ok: false; error: string; field?: string };

const MAX_ORDERS_PER_PHONE = 5;
const RATE_WINDOW_MINUTES = 10;
const ORDER_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O or 1/I/L, easy to read over the phone

const clean = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

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

  // Only options and pickup points switched on under Delivery can be chosen.
  const delivery = await getDelivery();
  const choice = findChoice(delivery, clean(input.delivery, 60));
  if (!choice) return { ok: false, error: "Please choose how you'd like to get your order." };
  const deliveryMethod = choiceMethod(choice);
  const needsAddress = choice.kind === "option";
  const address = clean(input.address, 300);
  if (needsAddress && address.length < 3) {
    return { ok: false, error: "Please tell us where to deliver.", field: "address" };
  }
  // Only a payment choice this delivery allows can be picked. "Pay now" exists only while Pesapal is on.
  const allowedPayments = paymentOptions(choice, pesapalReady());
  const paymentMethod = clean(input.paymentMethod, 20) as PaymentChoice;
  if (!allowedPayments.includes(paymentMethod)) {
    return { ok: false, error: "Please choose how you'd like to pay.", field: "payment" };
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
    .select("id, slug, name, price_kes, discount_type, discount_value, in_stock, is_active, stock_qty, stock_sold")
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
    // Stock is only taken when the shop confirms the order, but don't accept more than remain.
    const remaining = product.stock_qty == null ? null : product.stock_qty - product.stock_sold;
    if (remaining != null && remaining < qty) {
      return { ok: false, error: `Only ${remaining} of ${product.name} left. Please lower the quantity in your cart.` };
    }
    // Discounted products sell at their sale price, worked out here from the database.
    const price = salePrice(product.price_kes, product.discount_type, product.discount_value) ?? product.price_kes;
    lines.push({
      product_id: product.id,
      product_name: product.name,
      price_kes: price,
      qty,
      line_total_kes: price * qty,
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.line_total_kes, 0);
  if (subtotal <= 0) return { ok: false, error: "Your cart is empty." };
  if (subtotal !== input.expectedSubtotal) {
    return { ok: false, error: "A price in your cart has changed. Please check the new total and try again." };
  }

  // The fee comes from the chosen option. null means the shop confirms it when they call.
  const fee = choiceFee(choice, subtotal, delivery.freeOver);
  const deliveryAddress = needsAddress ? address : null;
  const token = randomBytes(24).toString("base64url");
  let order: { id: string; order_number: string } | null = null;
  for (let attempt = 0; attempt < 5 && !order; attempt++) {
    const { data, error } = await db
      .from("orders")
      .insert({
        order_number: orderNumber(),
        access_token: token,
        payment_method: paymentMethod,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || null,
        delivery_method: deliveryMethod,
        delivery_option_id: choice.kind === "option" ? choice.option.id : null,
        pickup_point_id: choice.kind === "pickup" ? choice.point.id : null,
        delivery_option_name: choiceName(choice),
        delivery_address: deliveryAddress,
        notes: notes || null,
        subtotal_kes: subtotal,
        delivery_fee_kes: fee,
        total_kes: subtotal + (fee ?? 0),
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
      deliveryName: choiceName(choice),
      deliveryAddress,
      notes: notes || null,
      subtotalKes: subtotal,
      deliveryFeeKes: fee,
      adminUrl: `${process.env.SITE_URL ?? ""}/admin/orders/${placed.id}`,
      items: lines.map((line) => ({ name: line.product_name, qty: line.qty, lineTotalKes: line.line_total_kes })),
    }),
  );

  // Email the customer (if they gave an address) that the order arrived.
  after(() =>
    sendCustomerUpdate({
      event: "pending",
      orderNumber: placed.order_number,
      customerName: name,
      customerEmail: email || null,
      totalKes: subtotal + (fee ?? 0),
      deliveryConfirmed: fee != null,
      token,
      paymentMethod,
      deliveryMethod,
    }),
  );

  return { ok: true, token, orderNumber: placed.order_number };
}
