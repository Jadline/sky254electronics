"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { removeProduct } from "@/app/admin/actions";
import { ConfirmDialog } from "@/components/admin/dialogs";
import { buttonClass } from "@/components/admin/ui";
import { ActionNotice, useAdminAction } from "@/components/admin/use-admin-action";

/** Deletes the product after a confirm dialog, then goes back to the products list. */
export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const remove = useAdminAction(removeProduct);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${buttonClass.dangerOutline} self-start`}>
        <TrashIcon className="size-[18px]" aria-hidden />
        Delete product
      </button>
      {remove.notice?.tone === "error" && <ActionNotice notice={remove.notice} />}
      <ConfirmDialog
        open={open}
        title={`Delete ${name}?`}
        confirmLabel="Delete product"
        pending={remove.pending}
        onClose={() => setOpen(false)}
        onConfirm={async () => {
          const result = await remove.run(id);
          setOpen(false);
          if (!result.error) router.push("/admin/products");
        }}
      >
        Its photos are deleted too, and this can&apos;t be undone. Past orders keep the product&apos;s name.
      </ConfirmDialog>
    </>
  );
}
