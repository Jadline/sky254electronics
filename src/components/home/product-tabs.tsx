"use client";

import { useId, useState, type ReactNode } from "react";

export type ProductTab = { id: string; label: string; content: ReactNode };

export function ProductTabs({ tabs }: { tabs: ProductTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const base = useId();

  return (
    <>
      <div role="tablist" aria-label="Product lists" className="flex flex-wrap gap-8 border-b border-line">
        {tabs.map((tab) => {
          const on = tab.id === active;
          return (
            <button
              key={tab.id}
              id={`${base}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`${base}-panel-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={`-mb-px cursor-pointer border-b-[3px] pb-3.5 text-base transition-colors ${on ? "border-brand font-medium" : "border-transparent hover:text-brand"}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {/* Panels stay in the page; showing one replays the card entrance animation. */}
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
