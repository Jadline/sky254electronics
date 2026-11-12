"use server";

import { revalidatePath, updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { siteUrl } from "@/config/site";
import { getAdmin, requireAdmin } from "@/lib/admin-auth";
import { announce, CATALOG_TOPIC, orderTopic } from "@/lib/live";
import { BADGES, MAX_BANNERS, MAX_SLIDER, SHORT_NAME_MAX } from "@/lib/home-rules";
import { isSoldStatus } from "@/lib/inventory";
import { salePrice } from "@/lib/pricing";
import { sendCustomerUpdate } from "@/lib/notify";
import { MAX_PHOTOS, PRODUCTS_BUCKET, type UploadedImage } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; message?: string };

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const optional = (form: FormData, key: string) => text(form, key) || null;
const checked = (form: FormData, key: string) => form.get(key) === "on";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/"/g, " inch ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "item";

/** Blank means "no price yet". Returns undefined when the value isn't a valid price. */
function parsePrice(raw: string): number | null | undefined {
  if (raw === "") return null;
  const cleaned = raw.replace(/[,\s]/g, "");
  if (!/^\d+$/.test(cleaned)) return undefined;
  const price = Number(cleaned);
  return price <= 100_000_000 ? price : undefined;
}

/** Makes a catalogue change show straight away, including on pre-built pages like Home. */
/** Clears the cached catalogue, then tells open shop and dashboard pages to fetch it again. */
function refreshCatalog() {
  updateTag("catalog");
  revalidatePath("/", "layout");
  announce(CATALOG_TOPIC);
}

/**
 * Deletes stored photos. Only called after requireAdmin(). Storage needs read access
 * to find a file before deleting it, and the bucket deliberately has no read rule
 * (it would let anyone list every file), so this uses the server-only key.
 */
async function removeStoredPhotos(paths: string[]) {
  if (paths.length) await createAdminClient().storage.from(PRODUCTS_BUCKET).remove(paths);
}

// ---------- Session ----------

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: text(form, "email"),
    password: String(form.get("password") ?? ""),
  });
  // The same message for every failure, so it doesn't reveal which emails exist.
  const refused = {
    error: "That email and password didn't work, or this account isn't an admin.",
  };
  if (error) return refused;
  if (!(await getAdmin())) {
    await supabase.auth.signOut();
    return refused;
  }
  redirect("/admin");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const password = String(form.get("password") ?? "");
  if (password.length < 10) return { error: "Please use at least 10 characters." };
  if (password !== form.get("confirm")) return { error: "The two passwords don't match." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { message: "Password changed." };
}

/** Whether this email belongs to someone in the admins table. There are only a few admins. */
async function isAdminEmail(email: string) {
  const db = createAdminClient();
  const { data: admins } = await db.from("admins").select("user_id");
  for (const { user_id } of admins ?? []) {
    const { data } = await db.auth.admin.getUserById(user_id);
    if (data.user?.email?.toLowerCase() === email) return true;
  }
  return false;
}

/**
 * Emails a password reset link, but only to admins. The reply is the same either way,
 * so the form can't be used to find out which emails are admins.
 */
export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter your email address." };

  if (await isAdminEmail(email)) {
    // The link comes back to the address this form was opened on (localhost or the live site).
    // Supabase only sends people to addresses listed under Auth > URL Configuration.
    const origin = (await headers()).get("origin") ?? siteUrl;
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/admin/auth/confirm` });
    if (error) console.error("Password reset email failed:", error.message);
  }
  return { message: email };
}

/** Sets a new password after a reset link signed the admin in, then opens the dashboard. */
export async function resetPassword(state: FormState, form: FormData): Promise<FormState> {
  const result = await changePassword(state, form);
  if (result.error) return result;
  redirect("/admin");
}

// ---------- Products ----------

type HomeValues = {
  short_name: string | null;
  badge: string | null;
  is_active: boolean;
  in_stock: boolean;
  show_in_hero: boolean;
  show_in_banner: boolean;
};

/** Keeps the Home page's layout intact: a known badge, a short title, and room in the slider and banners. */
async function checkHomePage(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  id: string,
  values: HomeValues,
): Promise<string | null> {
  if (values.badge && !(BADGES as readonly string[]).includes(values.badge)) {
    return `Badge must be one of: ${BADGES.join(", ")}.`;
  }
  if (values.short_name && values.short_name.length > SHORT_NAME_MAX) {
    return `Short name must be ${SHORT_NAME_MAX} characters or fewer.`;
  }

  const spots = [
    { field: "show_in_hero", on: values.show_in_hero, max: MAX_SLIDER, where: "the slider" },
    { field: "show_in_banner", on: values.show_in_banner, max: MAX_BANNERS, where: "the promo banners" },
  ] as const;
  for (const spot of spots) {
    if (!spot.on) continue;
    if (!values.short_name) return `Please add a short name to show it in ${spot.where}.`;
    // Only products customers can see take up a place.
    if (!values.is_active || !values.in_stock) continue;
    let query = supabase.from("products").select("name").eq(spot.field, true).eq("is_active", true).eq("in_stock", true);
    if (id) query = query.neq("id", id);
    const { data: taken } = await query;
    if ((taken?.length ?? 0) >= spot.max) {
      const names = taken!.map((p) => p.name).join(", ");
      return `${spot.where[0].toUpperCase()}${spot.where.slice(1)} already has ${spot.max} products (${names}). Switch one off first.`;
    }
  }
  return null;
}

/**
 * A discount from the form: a percentage (1–99) or shillings off, or blank for none.
 * It must leave something to pay, so it needs a price.
 */
function parseDiscount(
  rawType: string,
  rawValue: string,
  price: number | null,
): { discount_type: string | null; discount_value: number | null } | { error: string } {
  const cleaned = rawValue.replace(/[,\s%]/g, "");
  if (cleaned === "") return { discount_type: null, discount_value: null };
  const type = rawType === "amount" ? "amount" : "percent";
  if (!/^\d{1,9}$/.test(cleaned)) return { error: "Discount must be a whole number, like 10 for 10% or 500 for KSh 500 off." };
  const value = Number(cleaned);
  if (price == null) return { error: "Add a price before giving a discount." };
  if (type === "percent" && (value < 1 || value > 99)) return { error: "A percentage discount must be between 1 and 99." };
  if (salePrice(price, type, value) == null) return { error: "That discount is more than the price. Please use a smaller one." };
  return { discount_type: type, discount_value: value };
}

/** What saving a product reports. A new product also returns its id and slug, so its photos can follow. */
export type SavedProduct = FormState & { id?: string; slug?: string };

export async function saveProduct(form: FormData): Promise<SavedProduct> {
  const { supabase } = await requireAdmin();
  const id = text(form, "id");

  const name = text(form, "name");
  if (!name) return { error: "Please enter a product name." };
  const categoryId = text(form, "category_id");
  if (!categoryId) return { error: "Please choose a category." };
  const price = parsePrice(text(form, "price_kes"));
  if (price === undefined) return { error: "Price must be a whole number of shillings, like 22500." };
  const discount = parseDiscount(text(form, "discount_type"), text(form, "discount_value"), price);
  if ("error" in discount) return { error: discount.error };

  const values = {
    name,
    short_name: optional(form, "short_name"),
    brand: optional(form, "brand"),
    category_id: categoryId,
    price_kes: price,
    ...discount,
    warranty: optional(form, "warranty"),
    badge: optional(form, "badge"),
    description: optional(form, "description"),
    in_stock: checked(form, "in_stock"),
    is_active: checked(form, "is_active"),
    is_featured: checked(form, "is_featured"),
    show_in_hero: checked(form, "show_in_hero"),
    show_in_banner: checked(form, "show_in_banner"),
  };

  const homeProblem = await checkHomePage(supabase, id, values);
  if (homeProblem) return { error: homeProblem };
  if (id && values.in_stock && (await hasNoStock(supabase, id))) return { error: NO_STOCK };

  if (id) {
    const { error } = await supabase.from("products").update(values).eq("id", id);
    if (error) return { error: "Couldn't save the product. Please try again." };
    refreshCatalog();
    return { message: "Saved." };
  }

  const base = slugify(name);
  const { data: clash } = await supabase.from("products").select("slug").like("slug", `${base}%`);
  const taken = new Set((clash ?? []).map((row) => row.slug));
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;

  const { data, error } = await supabase
    .from("products")
    .insert({ ...values, slug })
    .select("id")
    .single();
  if (error) return { error: "Couldn't add the product. Please try again." };
  refreshCatalog();
  return { message: "Added.", id: data.id, slug };
}

const PRODUCT_SWITCHES = ["in_stock", "is_active", "is_featured"] as const;
type ProductSwitch = (typeof PRODUCT_SWITCHES)[number];

const NO_STOCK = "None of this product remain. Raise its Stock to put it back in stock.";

/** A counted product with nothing remaining can't be switched back to "In stock" by hand. */
async function hasNoStock(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], id: string) {
  const { data } = await supabase.from("products").select("stock_qty, stock_sold").eq("id", id).maybeSingle();
  return data?.stock_qty != null && data.stock_qty - data.stock_sold <= 0;
}

/** In stock, visible or featured, flipped straight from the products list. */
export async function setProductSwitch(id: string, field: ProductSwitch, on: boolean): Promise<FormState> {
  const { supabase } = await requireAdmin();
  if (!PRODUCT_SWITCHES.includes(field)) return { error: "Unknown setting." };
  if (field === "in_stock" && on && (await hasNoStock(supabase, id))) return { error: NO_STOCK };
  const { error } = await supabase
    .from("products")
    .update({ [field]: on })
    .eq("id", id);
  if (error) return { error: "Couldn't save. Please try again." };
  refreshCatalog();
  return { message: "Saved" };
}

/** A price typed straight into the products list. Blank means "Ask for price". */
export async function setProductPrice(id: string, raw: string): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const price = parsePrice(raw.trim());
  if (price === undefined) return { error: "Whole shillings only, like 22500." };
  const { error } = await supabase.from("products").update({ price_kes: price }).eq("id", id);
  if (error) return { error: "Couldn't save the price." };
  refreshCatalog();
  return { message: "Saved" };
}

/** A discount typed straight into the products list: a percentage or shillings off. Blank removes it. */
export async function setProductDiscount(id: string, type: string, raw: string): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { data: product } = await supabase.from("products").select("price_kes").eq("id", id).maybeSingle();
  if (!product) return { error: "That product no longer exists." };
  const discount = parseDiscount(type, raw.trim(), product.price_kes);
  if ("error" in discount) return { error: discount.error };
  const { error } = await supabase.from("products").update(discount).eq("id", id);
  if (error) return { error: "Couldn't save the discount." };
  refreshCatalog();
  return { message: discount.discount_value == null ? "Discount removed" : "Discount saved" };
}

/** Deletes a product and its photos, from the list or the product's own page. */
export async function removeProduct(id: string): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { data: product } = await supabase.from("products").select("name").eq("id", id).maybeSingle();
  const { data: images } = await supabase.from("product_images").select("storage_path").eq("product_id", id);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: "Couldn't delete the product. Please try again." };
  await removeStoredPhotos((images ?? []).map((image) => image.storage_path));
  refreshCatalog();
  return { message: product ? `Deleted ${product.name}` : "Deleted" };
}

// ---------- Stock ----------

/** The database's own message when there isn't enough stock, or null for any other failure. */
function stockProblem(error: { hint?: string | null; message: string } | null) {
  return error?.hint === "out_of_stock" ? `${error.message}.` : null;
}

/**
 * How many the shop has now, typed into the products list. It starts the count again:
 * Sold goes back to 0 and confirmed orders count from here. Blank stops counting.
 */
export async function setProductStock(id: string, raw: string): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const cleaned = raw.replace(/[,\s]/g, "");
  if (cleaned !== "" && !/^\d{1,6}$/.test(cleaned)) return { error: "Whole numbers only, like 12." };
  const stock = cleaned === "" ? null : Number(cleaned);
  // A new stock_set_at makes the database start again even when the number is the same.
  const { error } = await supabase
    .from("products")
    .update({ stock_qty: stock, stock_set_at: stock == null ? null : new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Couldn't save the stock. Please try again." };
  refreshCatalog();
  return { message: stock == null ? "Stopped counting stock" : `Stock set to ${stock}` };
}

// ---------- Photos ----------

/**
 * Puts a product's photos back in a tidy order: 0, 1, 2… The first is the main photo
 * (kind "product": shown whole on cards, the slider and banners); the rest are extras
 * (kind "box": the card's hover photo and the product page's slideshow).
 */
async function tidyPhotos(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], productId: string, mainId?: string) {
  const [{ data: product }, { data: images }] = await Promise.all([
    supabase.from("products").select("name").eq("id", productId).single(),
    supabase.from("product_images").select("id").eq("product_id", productId).order("sort_order").order("created_at"),
  ]);
  if (!product || !images) return;
  const ordered = mainId ? [...images.filter((i) => i.id === mainId), ...images.filter((i) => i.id !== mainId)] : images;
  await Promise.all(
    ordered.map((image, i) =>
      supabase
        .from("product_images")
        .update({
          sort_order: i,
          kind: i === 0 ? "product" : "box",
          alt: i === 0 ? product.name : `${product.name}, photo ${i + 1}`,
        })
        .eq("id", image.id),
    ),
  );
}

/** Records a photo the browser just compressed and uploaded, after the product's other photos. */
export async function addPhoto(productId: string, image: UploadedImage): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const [{ data: product }, { count }] = await Promise.all([
    supabase.from("products").select("name, slug").eq("id", productId).single(),
    supabase.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId),
  ]);
  if (!product) return { error: "That product no longer exists." };
  // Only accept photos from this product's own folder.
  if (!image.path.startsWith(`${product.slug}/`) || image.path.includes("..")) {
    return { error: "That photo couldn't be attached." };
  }
  if ((count ?? 0) >= MAX_PHOTOS) {
    await removeStoredPhotos([image.path]);
    return { error: `A product can have up to ${MAX_PHOTOS} photos.` };
  }

  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    kind: count ? "box" : "product",
    storage_path: image.path,
    alt: product.name,
    width: Math.round(image.width),
    height: Math.round(image.height),
    bytes: Math.round(image.bytes),
    sort_order: 1000 + (count ?? 0),
  });
  if (error) {
    await removeStoredPhotos([image.path]);
    return { error: "Couldn't save the photo. Please try again." };
  }
  await tidyPhotos(supabase, productId);
  refreshCatalog();
  return { message: "Photo saved." };
}

/** Makes one photo the main one, keeping the others in their order. */
export async function makeMainPhoto(id: string): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { data: image } = await supabase.from("product_images").select("product_id").eq("id", id).single();
  if (!image) return { error: "That photo no longer exists." };
  await tidyPhotos(supabase, image.product_id, id);
  refreshCatalog();
  return { message: "Main photo changed." };
}

export async function deletePhoto(id: string): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { data: image } = await supabase.from("product_images").select("product_id, storage_path").eq("id", id).single();
  if (!image) return { error: "That photo no longer exists." };
  const { error } = await supabase.from("product_images").delete().eq("id", id);
  if (error) return { error: "Couldn't remove the photo." };
  await removeStoredPhotos([image.storage_path]);
  await tidyPhotos(supabase, image.product_id);
  refreshCatalog();
  return { message: "Photo removed." };
}

// ---------- Categories ----------

/** Google shows about 160 characters; the database allows up to 300. */
const CATEGORY_DESCRIPTION_MAX = 300;

export async function saveCategory(_: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = text(form, "id");
  const name = text(form, "name");
  if (!name) return { error: "Please enter a name." };
  const description = optional(form, "description");
  if (description && description.length > CATEGORY_DESCRIPTION_MAX) {
    return { error: `Please keep the description under ${CATEGORY_DESCRIPTION_MAX} characters.` };
  }

  if (id) {
    const { error } = await supabase.from("categories").update({ name, description }).eq("id", id);
    if (error) return { error: "Couldn't save." };
    refreshCatalog();
    return { message: "Saved" };
  }

  const slug = slugify(name);
  const { data: last } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("categories").insert({ name, slug, description, sort_order: (last?.sort_order ?? 0) + 1 });
  if (error)
    return {
      error: error.code === "23505" ? "That category already exists." : "Couldn't add the category.",
    };
  refreshCatalog();
  return { message: `Added ${name}.` };
}

export async function deleteCategory(_: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("categories").delete().eq("id", text(form, "id"));
  // The database refuses to delete a category that still has products.
  if (error)
    return {
      error: error.code === "23503" ? "Move or delete its products first." : "Couldn't delete.",
    };
  refreshCatalog();
  return { message: "Deleted" };
}

// ---------- Orders ----------

const STATUSES = ["pending", "confirmed", "out_for_delivery", "completed", "cancelled"];

/** Confirming an order sells its stock and cancelling gives it back, so the shop refreshes too. */
function afterStatusChange(id: string, before: string, status: string) {
  if (isSoldStatus(before) !== isSoldStatus(status)) refreshCatalog();
  else revalidatePath("/admin", "layout");
  announce(orderTopic(id));
  // Email the customer when it's sent out, after the response so saving never waits on it.
  // Other steps show on their order page and at /track-order.
  if (before !== status && status === "out_for_delivery") {
    after(async () => {
      const { data: order } = await createAdminClient()
        .from("orders")
        .select("order_number, customer_name, customer_email, total_kes, delivery_fee_kes, access_token")
        .eq("id", id)
        .maybeSingle();
      if (!order?.customer_email) return;
      await sendCustomerUpdate({
        event: "out_for_delivery",
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        totalKes: order.total_kes,
        deliveryConfirmed: order.delivery_fee_kes != null,
        token: order.access_token,
      });
    });
  }
}

export async function updateOrder(_: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = text(form, "id");

  const status = text(form, "status");
  if (!STATUSES.includes(status)) return { error: "Please choose a valid status." };
  const fee = parsePrice(text(form, "delivery_fee_kes"));
  if (fee === undefined) return { error: "Delivery fee must be a whole number of shillings." };

  // "*" so this still works before the coupons migration adds discount_kes.
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).single();
  if (!order) return { error: "That order no longer exists." };

  const changes: Record<string, unknown> = {
    status,
    delivery_fee_kes: fee,
    // Keep any coupon discount when the fee changes.
    total_kes: order.subtotal_kes - (order.discount_kes ?? 0) + (fee ?? 0),
  };
  // Cash is always marked by hand. So is M-Pesa paid straight to the shop, unless
  // Safaricom has already sent a payment for this order, which then decides it.
  let byHand = order.payment_method === "cash";
  if (!byHand) {
    const { count } = await supabase.from("mpesa_payments").select("id", { count: "exact", head: true }).eq("order_id", id);
    byHand = (count ?? 0) === 0;
  }
  if (byHand) changes.payment_status = checked(form, "paid") ? "paid" : "unpaid";

  const { error } = await supabase.from("orders").update(changes).eq("id", id);
  if (error) return { error: stockProblem(error) ?? "Couldn't save the order. Please try again." };
  afterStatusChange(id, order.status, status);
  return { message: "Saved." };
}

/** One click from the orders list: confirm, send out, complete or cancel. */
export async function setOrderStatus(id: string, status: string): Promise<FormState> {
  const { supabase } = await requireAdmin();
  if (!STATUSES.includes(status)) return { error: "Please choose a valid status." };
  const { data: order } = await supabase.from("orders").select("status").eq("id", id).single();
  if (!order) return { error: "That order no longer exists." };
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) return { error: stockProblem(error) ?? "Couldn't update the order. Please try again." };
  afterStatusChange(id, order.status, status);
  return { message: "Updated" };
}

// ---------- Shop settings ----------

/** A web link, or blank. Adds https:// when it's missing. Returns undefined when it isn't a link. */
function parseUrl(raw: string): string | null | undefined {
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    return url.hostname.includes(".") ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Shop details and social links, shown around the site. Delivery has its own page. */
export async function saveShopSettings(_: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const email = optional(form, "email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "That email address doesn't look right." };

  const links: Record<string, string | null> = {};
  for (const [key, label] of [
    ["facebook_url", "Facebook"],
    ["instagram_url", "Instagram"],
    ["tiktok_url", "TikTok"],
  ] as const) {
    const url = parseUrl(text(form, key));
    if (url === undefined) return { error: `The ${label} link doesn't look right. Paste the full address of the page.` };
    links[key] = url;
  }

  const { error } = await supabase
    .from("shop_settings")
    .update({
      email,
      address: optional(form, "address"),
      hours: optional(form, "hours"),
      ...links,
    })
    .eq("id", 1);
  if (error) return { error: "Couldn't save the settings. Please try again." };
  refreshCatalog();
  return { message: "Saved" };
}

// ---------- Newsletter ----------

export async function removeSubscriber(id: string): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
  if (error) return { error: "Couldn't remove that email." };
  revalidatePath("/admin/subscribers");
  return { message: "Removed" };
}
