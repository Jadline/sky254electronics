"use client";

import type { ReactNode } from "react";

/** The footer of an admin table: what is showing, and round page buttons. */
export function Pager({ page, pages, onPage, children }: { page: number; pages: number; onPage: (page: number) => void; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-adm-line-soft px-[22px] py-3.5 text-sm text-adm-body">
      <span>{children}</span>
      {pages > 1 && (
        <nav aria-label="Pages" className="flex flex-wrap gap-1.5">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onPage(n)}
              aria-current={n === page ? "page" : undefined}
              aria-label={`Page ${n}`}
              className={`size-[38px] cursor-pointer rounded-full border-[1.5px] font-semibold transition-colors ${
                n === page ? "border-adm-primary bg-adm-primary text-white" : "border-adm-line-strong bg-white text-adm-ink hover:bg-adm-surface"
              }`}
            >
              {n}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

/** Splits a list into pages of `size`, keeping the page in range when the list shrinks. */
export function paginate<T>(rows: T[], page: number, size: number) {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, pages);
  return {
    pages,
    current,
    shown: rows.slice((current - 1) * size, current * size),
    summary: rows.length ? `${(current - 1) * size + 1}–${Math.min(current * size, rows.length)} of ${rows.length}` : "",
  };
}
