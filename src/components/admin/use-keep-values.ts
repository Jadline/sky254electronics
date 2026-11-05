"use client";

import { startTransition, type FormEvent } from "react";

/**
 * Submits a form to a server action without React's automatic reset, which would
 * wipe what was typed whenever the action reports a mistake.
 */
export function useKeepValues(action: (form: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => action(form));
  };
}
