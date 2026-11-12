const STEPS = ["Shopping cart", "Checkout", "Order completed"];
const SHORT = ["Cart", "Checkout", "Done"];
const ARROW = "polygon(0 0, calc(100% - 26px) 0, 100% 50%, calc(100% - 26px) 100%, 0 100%, 26px 50%)";
const ARROW_SM = "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%)";

/** The arrow-shaped progress bar. `current` is 0, 1 or 2. Phones get one short row of three
    arrows instead of three stacked full-width ones. */
export function CheckoutSteps({ current }: { current: number }) {
  return (
    <ol aria-label="Checkout steps" className="flex gap-1">
      {STEPS.map((step, i) => (
        <li
          key={step}
          aria-current={i === current ? "step" : undefined}
          style={{ "--arrow": ARROW, "--arrow-sm": ARROW_SM } as React.CSSProperties}
          className={`relative flex h-[58px] min-w-0 flex-1 items-center justify-center overflow-hidden [clip-path:var(--arrow)] max-sm:h-10 max-sm:[clip-path:var(--arrow-sm)] ${i === current ? "bg-brand text-white" : "bg-[#f2f4f8]"}`}
        >
          <span aria-hidden="true" className={`absolute top-1/2 left-1/2 -translate-y-1/2 translate-x-[10%] text-[46px] font-bold max-sm:hidden ${i === current ? "text-white/20" : "text-text/10"}`}>
            0{i + 1}
          </span>
          <span className="relative text-base font-medium uppercase max-md:text-sm max-sm:hidden">{step}</span>
          <span className="relative text-xs font-medium uppercase sm:hidden">
            {i + 1}. {SHORT[i]}
          </span>
        </li>
      ))}
    </ol>
  );
}
