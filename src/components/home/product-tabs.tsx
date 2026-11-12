"use client";

import { useId, useState, type ReactNode } from "react";

export type ProductTab = { id: string; label: string; content: ReactNode };

/** "underline" is the Home page style; "filled" is the full-width Product page bar. */
export function ProductTabs({
  tabs,
  variant = "underline",
  label = "Product lists",
}: {
  tabs: ProductTab[];
  variant?: "underline" | "filled";
  label?: string;
}) {
  const [active, setActive] = useState(tabs[0]?.id);
  const base = useId();
  const filled = variant === "filled";

  return (
    <>
      {/* Phones: the tabs stay on one line and scroll sideways rather than stacking. */}
      <div
        role="tablist"
        aria-label={label}
        className={`flex overflow-x-auto [scrollbar-width:none] ${filled ? "bg-tint" : "gap-8 border-b border-line max-sm:gap-6"}`}
      >
        {tabs.map((tab) => {
          const on = tab.id === active;
          const style = filled
            ? `h-[46px] flex-[1_0_auto] px-5 text-[13px] font-medium whitespace-nowrap uppercase max-sm:h-11 max-sm:px-4 max-sm:text-xs ${on ? "bg-brand text-white" : "hover:text-brand"}`
            : `flex-none border-b-[3px] pb-3.5 text-base whitespace-nowrap max-sm:pb-3 max-sm:text-[15px] ${on ? "border-brand font-medium" : "border-transparent hover:text-brand"}`;
          return (
            <button
              key={tab.id}
              id={`${base}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`${base}-panel-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={`cursor-pointer transition-colors ${style}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {/* Panels stay in the page; showing one replays its entrance animation. */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`${base}-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${tab.id}`}
          hidden={tab.id !== active}
        >
          {tab.content}
        </div>
      ))}
    </>
  );
}
