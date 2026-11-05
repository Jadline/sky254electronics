"use client";

import Link from "next/link";
import { useShop } from "@/lib/shop-store";
import { formatKes } from "@/lib/types";
import { BagIcon, HeartIcon } from "@/components/icons";

function Count({ value }: { value: number }) {
  return (
    <span className="pop absolute top-1 right-0.5 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-text">
      {value}
    </span>
  );
}

export function HeaderCounts() {
  const { cart, wishlist } = useShop();
  const items = cart.reduce((sum, line) => sum + line.qty, 0);
  const total = cart.reduce((sum, line) => sum + line.priceKes * line.qty, 0);

  return (
    <>
      <Link
        href="/wishlist"
        aria-label={`Wishlist, ${wishlist.length} ${wishlist.length === 1 ? "item" : "items"}`}
        className="relative flex size-11 items-center justify-center transition-colors hover:text-brand"
      >
        <HeartIcon className="size-6" strokeWidth={1.5} />
        <Count value={wishlist.length} />
      </Link>
      <Link
        href="/cart"
        aria-label={`Cart, ${items} ${items === 1 ? "item" : "items"}, ${formatKes(total)}`}
        className="inline-flex items-center gap-2.5 transition-colors hover:text-brand"
      >
        <span className="relative flex size-11 items-center justify-center">
          <BagIcon className="size-6" strokeWidth={1.5} />
          <Count value={items} />
        </span>
        <span className="text-[15px] font-medium whitespace-nowrap">{formatKes(total)}</span>
      </Link>
    </>
  );
}
