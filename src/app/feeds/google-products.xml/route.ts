import { absoluteUrl, site } from "@/config/site";
import { getDelivery, getProducts } from "@/lib/catalog";
import { shippingRate } from "@/lib/delivery";
import { productHref, type Product } from "@/lib/types";

/**
 * GET /feeds/google-products.xml: the product feed for Google Merchant Center (free
 * listings and Shopping ads). Add this address in Merchant Center under Products >
 * Add products > Add from a file > "Enter a link to your file", fetched daily.
 *
 * Products without a price or a photo are left out, because Google rejects them.
 * It's rebuilt from the cached catalogue, so dashboard changes reach it within minutes.
 */

const xml = (value: string) =>
  value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const money = (kes: number) => `${kes.toFixed(2)} KES`;

function item(product: Product & { priceKes: number }, shippingKes: number | null) {
  const photos = product.photos.map((photo) => absoluteUrl(photo.src));
  const description = (product.description?.replace(/\s+/g, " ").trim() || `${product.name}. ${product.category.name} from ${site.name}, Nairobi.`).slice(0, 5000);
  const onSale = product.wasPriceKes != null && product.wasPriceKes > product.priceKes;
  const fields: [string, string][] = [
    ["g:id", product.slug],
    ["g:title", product.name.slice(0, 150)],
    ["g:description", description],
    ["g:link", absoluteUrl(productHref(product.slug))],
    ["g:image_link", photos[0]],
    ...photos.slice(1, 11).map((url): [string, string] => ["g:additional_image_link", url]),
    ["g:availability", product.inStock ? "in_stock" : "out_of_stock"],
    // With an offer, Google shows the old price crossed out next to the sale price.
    ["g:price", money(onSale ? product.wasPriceKes! : product.priceKes)],
    ...(onSale ? ([["g:sale_price", money(product.priceKes)]] as [string, string][]) : []),
    ["g:condition", "new"],
    ["g:product_type", product.category.name],
    ...(product.brand ? ([["g:brand", product.brand]] as [string, string][]) : []),
    // We don't record barcodes (GTIN) or part numbers, so say so rather than leave them blank.
    ["g:identifier_exists", "no"],
  ];
  const shipping =
    shippingKes == null
      ? ""
      : `\n      <g:shipping><g:country>KE</g:country><g:price>${money(shippingKes)}</g:price></g:shipping>`;
  return `    <item>\n${fields.map(([tag, value]) => `      <${tag}>${xml(value)}</${tag}>`).join("\n")}${shipping}\n    </item>`;
}

export async function GET() {
  const [products, delivery] = await Promise.all([getProducts(), getDelivery()]);
  const listable = products.filter((p): p is Product & { priceKes: number } => p.priceKes != null && p.photos.length > 0);
  const shippingKes = shippingRate(delivery);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xml(site.name)}</title>
    <link>${xml(absoluteUrl("/"))}</link>
    <description>${xml(`Products from ${site.name}, Nairobi`)}</description>
${listable.map((product) => item(product, shippingKes)).join("\n")}
  </channel>
</rss>
`;
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}
