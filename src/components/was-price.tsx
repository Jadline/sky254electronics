import { formatKes, type Product } from "@/lib/types";

/** The old price crossed out and the saving, for products on offer. Renders nothing otherwise. */
export function WasPrice({ product, className = "" }: { product: Pick<Product, "priceKes" | "wasPriceKes">; className?: string }) {
  const { priceKes, wasPriceKes } = product;
  if (priceKes == null || wasPriceKes == null || wasPriceKes <= priceKes) return null;
  const off = Math.round(((wasPriceKes - priceKes) / wasPriceKes) * 100);
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-2 text-[13px] font-normal ${className}`}>
      <s className="text-muted">
        <span className="sr-only">Was </span>
        {formatKes(wasPriceKes)}
      </s>
      {off > 0 && <span className="rounded-full bg-[#fdecec] px-1.5 py-px text-xs font-medium text-[#b42318]">−{off}%</span>}
    </span>
  );
}
