// Loads the catalogue and compressed photos into Supabase:  npm run seed
// Run the SQL in supabase/migrations first. Safe to re-run: existing products,
// including any prices edited since, are left as they are.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = "products";
const SEED = "supabase/seed/";
const { categories, products } = JSON.parse(fs.readFileSync(SEED + "catalog.json", "utf8"));
const manifest = JSON.parse(fs.readFileSync(SEED + "images/manifest.json", "utf8"));

function must({ data, error }, step) {
  if (error) throw new Error(`${step}: ${error.message}`);
  return data;
}

// Categories
must(await supabase.from("categories").upsert(categories, { onConflict: "slug", ignoreDuplicates: true }), "categories");
const cats = must(await supabase.from("categories").select("id, name"), "read categories");
const catId = Object.fromEntries(cats.map((c) => [c.name, c.id]));

// Products
const rows = products.map(({ slug, name, brand, category, price_kes, warranty, badge }) => ({
  slug, name, brand, category_id: catId[category], price_kes, warranty, badge,
}));
must(await supabase.from("products").upsert(rows, { onConflict: "slug", ignoreDuplicates: true }), "products");
const saved = must(await supabase.from("products").select("id, slug"), "read products");
const productId = Object.fromEntries(saved.map((p) => [p.slug, p.id]));

// Photos: stored as <slug>/<kind>.webp
const jobs = products.flatMap((p) =>
  Object.entries(manifest[p.key]).map(([kind, m]) => ({ p, kind, m })),
);
const imageRows = [];
async function worker() {
  for (let job = jobs.pop(); job; job = jobs.pop()) {
    const { p, kind, m } = job;
    const path = `${p.slug}/${kind}.webp`;
    const body = fs.readFileSync(`${SEED}images/${p.key}_${kind}.webp`);
    must(
      await supabase.storage.from(BUCKET).upload(path, body, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      }),
      `upload ${path}`,
    );
    imageRows.push({
      product_id: productId[p.slug],
      kind,
      storage_path: path,
      alt: kind === "box" ? `${p.name} in its box` : p.name,
      width: m.width,
      height: m.height,
      bytes: m.bytes,
      sort_order: kind === "product" ? 0 : 1,
    });
    if (imageRows.length % 20 === 0) console.log(`  ${imageRows.length} photos uploaded`);
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
must(await supabase.from("product_images").upsert(imageRows, { onConflict: "storage_path" }), "product_images");

for (const t of ["categories", "products", "product_images"]) {
  const { count: n, error } = await supabase.from(t).select("*", { count: "exact", head: true });
  if (error) throw new Error(`${t}: ${error.message}`);
  console.log(`${t}: ${n}`);
}
