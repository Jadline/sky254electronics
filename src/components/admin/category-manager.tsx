"use client";

import { ArrowTopRightOnSquareIcon, MagnifyingGlassIcon, PencilIcon, PlusIcon, Squares2X2Icon, TrashIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { deleteCategory, saveCategory } from "@/app/admin/actions";
import { ConfirmDialog, FormDialog } from "@/components/admin/dialogs";
import { RowMenu } from "@/components/admin/row-menu";
import { Badge, buttonClass, FIELD, plural, SEARCH_BOX, SELECT_PILL } from "@/components/admin/ui";
import { ActionNotice, useAdminAction } from "@/components/admin/use-admin-action";

type Row = { id: string; name: string; slug: string; description: string; count: number; live: number; visible: number };

const DOTS = ["#0669d6", "#5b4fa8", "#0f9488", "#f0643c", "#d97706", "#b4475a", "#5b6b80"];

export function CategoryManager({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("shop");
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const save = useAdminAction((form: FormData) => saveCategory({}, form));
  const remove = useAdminAction((form: FormData) => deleteCategory({}, form));
  const notice = save.notice?.tone === "ok" ? save.notice : remove.notice;

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = rows.map((c, i) => ({ ...c, order: i })).filter((c) => !t || c.name.toLowerCase().includes(t));
    if (sort === "products") list.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [rows, q, sort]);

  const close = () => {
    setEditing(null);
    setFormError(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="cats-h" className="rounded-[20px] border border-adm-line bg-white">
        <h2 id="cats-h" className="sr-only">
          All categories
        </h2>
        <div className="flex flex-wrap items-center gap-3 border-b border-adm-line-soft px-[18px] py-4">
          <div className={`${SEARCH_BOX} flex-[1_1_260px]`}>
            <MagnifyingGlassIcon className="size-[18px] text-adm-muted" aria-hidden />
            <label htmlFor="c-q" className="sr-only">
              Search categories
            </label>
            <input
              id="c-q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search categories…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-0 placeholder:text-adm-faint"
            />
          </div>
          <label htmlFor="c-sort" className="sr-only">
            Sort categories
          </label>
          <select id="c-sort" value={sort} onChange={(e) => setSort(e.target.value)} className={SELECT_PILL}>
            <option value="shop">Shop order</option>
            <option value="products">Most products first</option>
            <option value="name">Name: A to Z</option>
          </select>
          <button type="button" onClick={() => setEditing("new")} className={`${buttonClass.primary} ml-auto`}>
            <PlusIcon className="size-[18px] stroke-[2.4]" aria-hidden />
            Add category
          </button>
        </div>

        {notice && (
          <div className="px-[18px] pt-3">
            <ActionNotice notice={notice} />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#f8fafd] text-xs tracking-[0.6px] text-adm-muted uppercase">
              <tr>
                <th scope="col" className="py-3 pr-3 pl-[18px] font-semibold">
                  Category
                </th>
                <th scope="col" className="w-[120px] px-3 py-3 text-center font-semibold">
                  Products
                </th>
                <th scope="col" className="w-[120px] px-3 py-3 text-center font-semibold">
                  Published
                </th>
                <th scope="col" className="w-[60px] py-3 pr-[18px] pl-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id} className="border-t border-adm-line-soft hover:bg-[#f8fafd]">
                  <td className="py-3 pr-3 pl-[18px]">
                    <span className="flex items-center gap-3">
                      <span aria-hidden className="size-3 shrink-0 rounded-[4px]" style={{ background: DOTS[c.order % DOTS.length] }} />
                      <span className="flex min-w-0 flex-col leading-snug">
                        <button type="button" onClick={() => setEditing(c)} className="cursor-pointer text-left font-semibold hover:text-adm-primary">
                          {c.name}
                        </button>
                        {c.description ? (
                          <span className="line-clamp-1 max-w-[520px] text-[13px] text-adm-muted">{c.description}</span>
                        ) : (
                          <span className="text-[13px] text-adm-faint">No description</span>
                        )}
                      </span>
                      {c.live === 0 && c.count > 0 && (
                        <Badge tone="gray" dot>
                          {c.visible === 0 ? "Not in the shop" : "Not in the shop · all sold out"}
                        </Badge>
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center tabular-nums">{c.count}</td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`inline-block min-w-9 rounded-full px-2.5 py-0.5 font-semibold tabular-nums ${c.visible > 0 ? "bg-[#e7f6ec] text-[#116632]" : "bg-adm-line-soft text-adm-faint"}`}
                    >
                      {c.visible}
                    </span>
                  </td>
                  <td className="py-2 pr-[18px] pl-3 text-right">
                    <RowMenu
                      label={`Actions for ${c.name}`}
                      items={[
                        { label: "Edit", icon: PencilIcon, onSelect: () => setEditing(c) },
                        c.live > 0 && { label: "View in the shop", icon: ArrowTopRightOnSquareIcon, href: `/shop/${c.slug}`, external: true },
                        { label: "Delete category", icon: TrashIcon, danger: true, onSelect: () => setDeleting(c) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {shown.length === 0 && <p className="px-[18px] py-10 text-center text-adm-muted">{rows.length ? "No categories match." : "No categories yet."}</p>}
        <p className="border-t border-adm-line-soft px-[18px] py-3.5 text-sm text-adm-body">{plural(rows.length, "category", "categories")}</p>
      </section>

      {editing && (
        <FormDialog
          title={editing === "new" ? "Add category" : "Edit category"}
          icon={Squares2X2Icon}
          adding={editing === "new"}
          submitLabel={editing === "new" ? "Add category" : "Save changes"}
          pending={save.pending}
          onClose={close}
          onSubmit={async (form) => {
            const result = await save.run(form);
            if (result.error) setFormError(result.error);
            else close();
          }}
        >
          {editing !== "new" && <input type="hidden" name="id" value={editing.id} />}
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            <span>
              Category name <span className="text-[#b42318]">*</span>
            </span>
            <input
              name="name"
              required
              maxLength={60}
              autoFocus
              placeholder="e.g. Smart TVs"
              defaultValue={editing === "new" ? "" : editing.name}
              aria-invalid={formError ? true : undefined}
              className={`${FIELD} font-normal`}
            />
            {editing !== "new" && <span className="text-[13px] font-normal text-adm-muted">The link in the shop stays the same if you rename it.</span>}
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Description
            <textarea
              name="description"
              rows={4}
              maxLength={300}
              placeholder="e.g. Smart TVs from Hisense, TCL and LG, with delivery across Kenya."
              defaultValue={editing === "new" ? "" : editing.description}
              className={`${FIELD} resize-y font-normal`}
            />
            <span className="text-[13px] font-normal text-adm-muted">
              Shown at the top of the category page and in Google results. One or two sentences is enough.
            </span>
          </label>
          {formError && <p className="text-[13px] text-[#b42318]">{formError}</p>}
        </FormDialog>
      )}

      <ConfirmDialog
        open={deleting != null}
        title={`Delete ${deleting?.name ?? "this category"}?`}
        confirmLabel="Delete category"
        pending={remove.pending}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) {
            const form = new FormData();
            form.set("id", deleting.id);
            await remove.run(form);
          }
          setDeleting(null);
        }}
      >
        {deleting && deleting.count > 0
          ? `It still has ${plural(deleting.count, "product")}. Move ${deleting.count === 1 ? "it" : "them"} to another category first, or the delete will be refused.`
          : "This can't be undone."}
      </ConfirmDialog>
    </div>
  );
}
