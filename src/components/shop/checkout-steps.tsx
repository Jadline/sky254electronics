const STEPS = ["Shopping cart", "Checkout", "Order completed"];
const ARROW = "polygon(0 0, calc(100% - 26px) 0, 100% 50%, calc(100% - 26px) 100%, 0 100%, 26px 50%)";

/** The arrow-shaped progress bar. `current` is 0, 1 or 2. */
export function CheckoutSteps({ current }: { current: number }) {
  return (
    <ol aria-label="Checkout steps" className="flex flex-wrap gap-1">
      {STEPS.map((step, i) => (
        <li
          key={step}
          aria-current={i === current ? "step" : undefined}
          style={{ clipPath: ARROW }}
          className={`relative flex h-[58px] flex-[1_1_200px] items-center justify-center overflow-hidden ${i === current ? "bg-brand text-white" : "bg-[#f2f4f8]"}`}
        >
          <span aria-hidden="true" className={`absolute top-1/2 left-1/2 -translate-y-1/2 translate-x-[10%] text-[46px] font-bold ${i === current ? "text-white/20" : "text-text/10"}`}>
            0{i + 1}
          </span>
          <span className="relative text-base font-medium uppercase">{step}</span>
        </li>
      ))}
    </ol>
  );
}
