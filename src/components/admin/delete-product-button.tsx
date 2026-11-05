"use client";

import { DANGER_BUTTON } from "@/components/admin/ui";

export function DeleteProductButton({ name }: { name: string }) {
  return (
    <button
      type="submit"
      className={DANGER_BUTTON}
      onClick={(event) => {
        if (!window.confirm(`Delete "${name}" and its photos? This can't be undone.`)) event.preventDefault();
      }}
    >
      Delete product
    </button>
  );
}
