"use client";

import { CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { useEffect, useState, useTransition } from "react";
import type { FormState } from "@/app/admin/actions";

export type Notice = { tone: "ok" | "error"; text: string } | null;

/**
 * Runs a server action from a button or switch and reports how it went. The action
 * refreshes the page's data itself, so lists update without a reload.
 */
export function useAdminAction<A extends unknown[]>(action: (...args: A) => Promise<FormState>) {
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<Notice>(null);

  // A success note fades after a few seconds; an error stays until the next action.
  useEffect(() => {
    if (notice?.tone !== "ok") return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function run(...args: A) {
    return new Promise<FormState>((resolve) => {
      startTransition(async () => {
        try {
          const result = await action(...args);
          setNotice(result.error ? { tone: "error", text: result.error } : result.message ? { tone: "ok", text: result.message } : null);
          resolve(result);
        } catch {
          const result = { error: "Something went wrong. Please try again." };
          setNotice({ tone: "error", text: result.error });
          resolve(result);
        }
      });
    });
  }

  return { run, pending, notice, clear: () => setNotice(null) };
}

/** The note an action leaves behind, announced to screen readers. */
export function ActionNotice({ notice }: { notice: Notice }) {
  return (
    <div aria-live="polite" className="empty:hidden">
      {notice && (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          className={`flex items-center gap-2 rounded-[14px] px-3.5 py-2.5 text-sm font-medium ${
            notice.tone === "error" ? "bg-[#fdecec] text-[#b42318]" : "bg-[#e7f6ec] text-[#116632]"
          }`}
        >
          {notice.tone === "error" ? <ExclamationCircleIcon className="size-[18px]" aria-hidden /> : <CheckCircleIcon className="size-[18px]" aria-hidden />}
          {notice.text}
        </p>
      )}
    </div>
  );
}
