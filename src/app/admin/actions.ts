"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getAdmin, requireAdmin } from "@/lib/admin-auth";
import { PRODUCTS_BUCKET, type UploadedImage } from "@/lib/storage";
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
function refreshCatalog() {
  updateTag("catalog");
  revalidatePath("/", "layout");
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
  const refused = { error: "That email and password didn't work, or this account isn't an admin." };
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

// ---------- Products ----------

export async function saveProduct(_: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = text(form, "id");

  const name = text(form, "name");
  if (!name) return { error: "Please enter a product name." };
  const categoryId = text(form, "category_id");
  if (!categoryId) return { error: "Please choose a category." };
  const price = parsePrice(text(form, "price_kes"));
  if (price === undefined) return { error: "Price must be a whole number of shillings, like 22500." };

  const values = {
    name,
    short_name: optional(form, "short_name"),
    brand: optional(form, "brand"),
    category_id: categoryId,
    price_kes: price,
    warranty: optional(form, "warranty"),
    badge: optional(form, "badge"),
    description: optional(form, "description"),
    in_stock: checked(form, "in_stock"),
    is_active: checked(form, "is_active"),
    is_featured: checked(form, "is_featured"),
    show_in_hero: checked(form, "show_in_hero"),
    show_in_banner: checked(form, "show_in_banner"),
  };

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

  const { data, error } = await supabase.from("products").insert({ ...values, slug }).select("id").single();
  if (error) return { error: "Couldn't add the product. Please try again." };
  refreshCatalog();
  redirect(`/admin/products/${data.id}?new=1`);
}

/** Price and stock, saved straight from the products list. */
export async function quickUpdate(_: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const price = parsePrice(text(form, "price_kes"));
  if (price === undefined) return { error: "Whole numbers only" };
  const { error } = await supabase
    .from("products")
    .update({ price_kes: price, in_stock: checked(form, "in_stock") })
    .eq("id", text(form, "id"));
  if (error) return { error: "Couldn't save" };
  refreshCatalog();
  return { message: "Saved" };
}

export async function deleteProduct(form: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(form, "id");
  const { data: images } = await supabase.from("product_images").select("storage_path").eq("product_id", id);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error("Couldn't delete the product.");
  const paths = (images ?? []).map((image) => image.storage_path);
  await removeStoredPhotos(paths);
  refreshCatalog();
  redirect("/admin");
}

// ---------- Photos ----------

/** Records a photo the browser just compressed and uploaded, replacing any old one of that kind. */
export async function savePhoto(
  productId: string,
  kind: "product" | "box",
  image: UploadedImage,
): Promise<FormState> {
  const { supabase } = await requireAdmin();
  if (kind !== "product" && kind !== "box") return { error: "Unknown photo type." };

  const { data: product } = await supabase.from("products").select("name, slug").eq("id", productId).single();
  if (!product) return { error: "That product no longer exists." };
  // Only accept photos from this product's own folder.
  if (!image.path.startsWith(`${product.slug}/`) || image.path.includes("..")) {
    return { error: "That photo couldn't be attached." };
  }

  const { data: old } = await supabase
    .from("product_images")
    .select("id, storage_path")
    .eq("product_id", productId)
    .eq("kind", kind);

  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    kind,
    storage_path: image.path,
    alt: kind === "box" ? `${product.name} in its box` : product.name,
    width: Math.round(image.width),
    height: Math.round(image.height),
    bytes: Math.round(image.bytes),
    sort_order: kind === "product" ? 0 : 1,
  });
  if (error) {
    await removeStoredPhotos([image.path]);
    return { error: "Couldn't save the photo. Please try again." };
  }

  if (old?.length) {
    await supabase.from("product_images").delete().in("id", old.map((row) => row.id));
    await removeStoredPhotos(old.map((row) => row.storage_path));
  }
  refreshCatalog();
  return { message: "Photo saved." };
}

export async function deletePhoto(form: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(form, "id");
  const { data: image } = await supabase.from("product_images").select("storage_path").eq("id", id).single();
  if (!image) return;
  const { error } = await supabase.from("product_images").delete().eq("id", id);
  if (error) throw new Error("Couldn't remove the photo.");
  await removeStoredPhotos([image.storage_path]);
  refreshCatalog();
}

// ---------- Categories ----------

export async function saveCategory(_: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = text(form, "id");
  const name = text(form, "name");
  if (!name) return { error: "Please enter a name." };

  if (id) {
    const { error } = await supabase.from("categories").update({ name }).eq("id", id);
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
  const { error } = await supabase.from("categories").insert({ name, slug, sort_order: (last?.sort_order ?? 0) + 1 });
  if (error) return { error: error.code === "23505" ? "That category already exists." : "Couldn't add the category." };
  refreshCatalog();
  return { message: `Added ${name}.` };
}

export async function deleteCategory(_: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("categories").delete().eq("id", text(form, "id"));
  // The database refuses to delete a category that still has products.
  if (error) return { error: error.code === "23503" ? "Move or delete its products first." : "Couldn't delete." };
  refreshCatalog();
  return { message: "Deleted" };
}
