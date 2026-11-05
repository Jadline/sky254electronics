"use client";

import { useActionState, useRef } from "react";
import { deleteCategory, saveCategory, type FormState } from "@/app/admin/actions";
import { FIELD, FormMessage, PRIMARY_BUTTON } from "@/components/admin/ui";
import { useKeepValues } from "@/components/admin/use-keep-values";

type Row = { id: string; name: string; count: number };

function CategoryRow({ row }: { row: Row }) {
  const [saved, save, saving] = useActionState<FormState, FormData>(saveCategory, {});
  const [removed, remove, removing] = useActionState<FormState, FormData>(deleteCategory, {});
  const onSave = useKeepValues(save);

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line bg-white px-4 py-3 last:border-b-0">
      <form action={save} onSubmit={onSave} className="flex min-w-0 flex-[1_1_320px] items-center gap-3">
        <input type="hidden" name="id" value={row.id} />
        <input name="name" required maxLength={60} defaultValue={row.name} aria-label={`Name of ${row.name}`} className={`${FIELD} !h-10 min-w-0 flex-1`} />
        <button type="submit" disabled={saving} className="h-10 cursor-pointer text-sm text-brand disabled:opacity-60">Save</button>
      </form>
      <span className="w-24 text-xs text-muted">{row.count} {row.count === 1 ? "product" : "products"}</span>
      <form action={remove}>
        <input type="hidden" name="id" value={row.id} />
        <button type="submit" disabled={removing} aria-label={`Delete ${row.name}`} className="h-10 cursor-pointer text-sm text-[#b42318] disabled:opacity-60">Delete</button>
      </form>
      <div className="w-full empty:hidden">
        <FormMessage state={saved.error || saved.message ? saved : removed} />
      </div>
    </div>
  );
}

export function CategoryManager({ rows }: { rows: Row[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(async (previous: FormState, form: FormData) => {
    const result = await saveCategory(previous, form);
    if (!result.error) formRef.current?.reset();
    return result;
  }, {});
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <form ref={formRef} action={action} className="flex flex-col gap-3 border border-line bg-white p-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          New category
          <span className="flex flex-wrap gap-3">
            <input name="name" required maxLength={60} className={`${FIELD} !w-auto min-w-0 flex-1`} />
            <button type="submit" disabled={pending} className={PRIMARY_BUTTON}>Add category</button>
          </span>
        </label>
        <FormMessage state={state} />
      </form>
      <div className="border border-line">
        {rows.map((row) => (
          <CategoryRow key={row.id} row={row} />
        ))}
      </div>
    </>
  );
}
