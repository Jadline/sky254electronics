import type { SupabaseClient } from "@supabase/supabase-js";

// Bucket for product photos (created in supabase/migrations).
export const PRODUCTS_BUCKET = "products";
/** The most photos one product can have. */
export const MAX_PHOTOS = 8;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

// Photos are compressed in the browser before upload, the same recipe the seed
// photos went through: WebP at quality 82, no longer than 1600px on either side.
// Nothing on the site shows a product larger than about 800px, so this stays
// sharp on retina screens at a fraction of a camera original's size.
const MAX_DIMENSION = 1600;
const OUTPUT_QUALITY = 0.82;
const MAX_SOURCE_BYTES = 30 * 1024 * 1024; // refuse before decoding, to protect memory
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // matches the bucket's limit

// Returns a smaller copy of `file`, or `file` itself if shrinking wouldn't help.
async function shrinkImage(file: File): Promise<File> {
  if (typeof createImageBitmap !== "function") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // the browser can't decode it, so let Storage take the original
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, OUTPUT_QUALITY));
  // Browsers without a WebP encoder silently return PNG, so fall back to JPEG.
  let blob = await toBlob("image/webp");
  if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg");
  if (!blob) return file;
  // A small photo that's already well compressed can stay as it is. Anything
  // too large always uses the resized copy.
  if (scale === 1 && blob.size >= file.size) return file;

  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], file.name.replace(/\.[^.]*$/, "") + "." + ext, { type: blob.type });
}

async function measure(file: File) {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return { width: 0, height: 0 };
  }
}

export type UploadedImage = { path: string; width: number; height: number; bytes: number };

/** Compresses and uploads one image from the browser. */
export async function uploadProductImage(
  supabase: SupabaseClient,
  original: File,
  folder: string,
): Promise<UploadedImage> {
  if (!ACCEPTED_IMAGE_TYPES.includes(original.type)) {
    throw new Error("Please choose a JPG, PNG, WebP or AVIF image.");
  }
  if (original.size > MAX_SOURCE_BYTES) throw new Error("Images must be 30 MB or smaller.");

  const file = await shrinkImage(original);
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Images must be 8 MB or smaller.");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(PRODUCTS_BUCKET)
    .upload(path, file, { cacheControl: "31536000", contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);

  return { path, bytes: file.size, ...(await measure(file)) };
}

/** Public URL for a path stored in product_images.storage_path. */
export function productImageUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PRODUCTS_BUCKET}/${path}`;
}
