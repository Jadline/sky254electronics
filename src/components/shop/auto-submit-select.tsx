"use client";

import type { ComponentProps } from "react";

/** A select that applies its form as soon as the choice changes. */
export function AutoSubmitSelect(props: ComponentProps<"select">) {
  return <select {...props} onChange={(event) => event.currentTarget.form?.requestSubmit()} />;
}
