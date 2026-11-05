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
      <div role="tablist" aria-label={label} className={filled ? "flex flex-wrap bg-tint" : "flex flex-wrap gap-8 border-b border-line"}>
        {tabs.map((tab) => {
          const on = tab.id === active;
          const style = filled
            ? `h-[46px] flex-[1_1_200px] text-[13px] font-medium uppercase ${on ? "bg-brand text-white" : "hover:text-brand"}`
            : `-mb-px border-b-[3px] pb-3.5 text-base ${on ? "border-brand font-medium" : "border-transparent hover:text-brand"}`;
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
