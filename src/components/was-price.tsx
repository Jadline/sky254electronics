import { formatKes, type Product } from "@/lib/types";

/** How much is off, as a whole percentage, for a product on sale. */
export const percentOff = (product: Pick<Product, "priceKes" | "wasPriceKes">) =>
  product.priceKes != null && product.wasPriceKes ? Math.round(((product.wasPriceKes - product.priceKes) / product.wasPriceKes) * 100) : 0;

/**
 * For a product on sale: the original price crossed out, and (unless `badge` is false, as on
 * cards that show the badge on the photo) a red "Sale" label. Renders nothing otherwise.
 */
export function WasPrice({
  product,
  badge = true,
  className = "",
}: {
  product: Pick<Product, "priceKes" | "wasPriceKes">;
  badge?: boolean;
  className?: string;
}) {
  if (product.priceKes == null || product.wasPriceKes == null) return null;
  const off = percentOff(product);
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-normal ${className}`}>
      <s className="text-muted">
        <span className="sr-only">Was </span>
        {formatKes(product.wasPriceKes)}
      </s>
      {badge && (
        <span className="rounded-sm bg-sale px-1.5 py-px text-xs font-medium text-white uppercase">
          Sale{off > 0 && ` −${off}%`}
        </span>
      )}
    </span>
  );
}
