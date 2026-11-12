import { CheckoutSteps } from "@/components/shop/checkout-steps";

/** Shown on the cart, checkout and wishlist while the saved cart is fetched. */
export function ShopLoading({ step }: { step?: number }) {
  return (
    <div className="flex max-w-[1000px] flex-col gap-[30px]">
      {step != null && <CheckoutSteps current={step} />}
      <div role="status" className="flex items-center justify-center border border-line px-6 py-20 text-sm text-muted">
        Loading…
      </div>
    </div>
  );
}
