"use client";

import { useState } from "react";

/** Long enough that four lines won't hold it at the panel's width. */
const LONG_TEXT = 320;

/** Keeps the description short: four lines, with a toggle for the rest. */
export function ReadMore({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > LONG_TEXT;

  return (
    <div className="flex flex-col items-start gap-2">
      <p className={`text-sm leading-[1.8] whitespace-pre-line text-body ${long && !open ? "line-clamp-4" : ""}`}>{text}</p>
      {long && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="cursor-pointer text-[13px] font-medium text-brand hover:underline"
        >
          {open ? "Show less" : "Read more »"}
        </button>
      )}
    </div>
  );
}
