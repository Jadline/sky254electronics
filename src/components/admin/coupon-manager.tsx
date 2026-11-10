"use client";

import { PencilIcon, PlusIcon, PowerIcon, TicketIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { deleteCoupon, saveCoupon, setCouponActive } from "@/app/admin/coupon-actions";
import { ConfirmDialog, FormDialog } from "@/components/admin/dialogs";
import { RowMenu } from "@/components/admin/row-menu";
import { Badge, buttonClass, FIELD, formatDate, ksh, plural, type Tone } from "@/components/admin/ui";
import { ActionNotice, useAdminAction } from "@/components/admin/use-admin-action";
import { couponLabel, type CouponKind } from "@/lib/coupons";

export type CouponRow = {
  id: string;
  code: string;
  kind: CouponKind;
  value: number;
  min_subtotal_kes: number | null;
  max_discount_kes: number | null;
  starts_at: string | null;
  ends_at: string | null;
  max_uses: number | null;
  once_per_customer: boolean;
  is_active: boolean;
  note: string | null;
  uses: number;
  discountKes: number;
};

/** The date part in Nairobi, for a date input. */
const dayOf = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" }) : "");

function state(c: CouponRow): { label: string; tone: Tone } {
  const now = Date.now();
  if (!c.is_active) return { label: "Off", tone: "gray" };
  if (c.ends_at && new Date(c.ends_at).getTime() <= now) return { label: "Expired", tone: "gray" };
  if (c.max_uses != null && c.uses >= c.max_uses) return { label: "Used up", tone: "amber" };
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { label: "Scheduled", tone: "blue" };
  return { label: "Live", tone: "green" };
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold">
      {label}
      {children}
      {hint && <span className="text-[13px] font-normal text-adm-muted">{hint}</span>}
    </label>
  );
}

export function CouponManager({ rows }: { rows: CouponRow[] }) {
  const [editing, setEditing] = useState<CouponRow | "new" | null>(null);
  const [kind, setKind] = useState<CouponKind>("percent");
  const [deleting, setDeleting] = useState<CouponRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const save = useAdminAction(saveCoupon);
  const toggle = useAdminAction(setCouponActive);
  const remove = useAdminAction(deleteCoupon);
  const notice = remove.notice ?? toggle.notice ?? (save.notice?.tone === "ok" ? save.notice : null);

  const open = (row: CouponRow | "new") => {
    setEditing(row);
    setKind(row === "new" ? "percent" : row.kind);
    setFormError(null);
  };
  const close = () => {
    setEditing(null);
    setFormError(null);
  };
  const values = editing && editing !== "new" ? editing : null;

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="coupons-h" className="rounded-[20px] border border-adm-line bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-adm-line-soft px-[18px] py-4">
          <h2 id="coupons-h" className="font-semibold">All coupons</h2>
          <button type="button" onClick={() => open("new")} className={`${buttonClass.primary} ml-auto`}>
            <PlusIcon className="size-[18px] stroke-[2.4]" aria-hidden />
            Add coupon
          </button>
        </div>
        {notice && (
          <div className="px-[18px] pt-3">
            <ActionNotice notice={notice} />
          </div>
        )}
        {rows.length === 0 ? (
          <p className="px-[18px] py-10 text-center text-adm-muted">No coupons yet. Add one, then share the code on social media or with customers.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#f8fafd] text-xs tracking-[0.6px] text-adm-muted uppercase">
                <tr>
                  <th scope="col" className="py-3 pr-3 pl-[18px] font-semibold">Code</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Discount</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Dates</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Used</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Given</th>
                  <th scope="col" className="w-[60px] py-3 pr-[18px] pl-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const s = state(c);
                  const rules = [
                    c.min_subtotal_kes != null && `Orders from ${ksh(c.min_subtotal_kes)}`,
                    c.once_per_customer && "Once per customer",
                  ].filter(Boolean);
                  return (
                    <tr key={c.id} className="border-t border-adm-line-soft hover:bg-[#f8fafd]">
                      <td className="py-3 pr-3 pl-[18px]">
                        <span className="flex flex-wrap items-center gap-2">
                          <button type="button" onClick={() => open(c)} className="cursor-pointer font-mono font-semibold hover:text-adm-primary">
                            {c.code}
                          </button>
                          <Badge tone={s.tone} dot>{s.label}</Badge>
                        </span>
                        {c.note && <span className="block text-[13px] text-adm-muted">{c.note}</span>}
                      </td>
                      <td className="px-3 py-3">
                        {couponLabel(c)}
                        {rules.length > 0 && <span className="block text-[13px] text-adm-muted">{rules.join(" · ")}</span>}
                      </td>
                      <td className="px-3 py-3 text-adm-body">
                        {c.starts_at || c.ends_at ? `${c.starts_at ? formatDate(c.starts_at) : "Now"} – ${c.ends_at ? formatDate(c.ends_at) : "no end"}` : "Always"}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {c.uses}
                        {c.max_uses != null && <span className="text-adm-muted"> / {c.max_uses}</span>}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{ksh(c.discountKes)}</td>
                      <td className="py-2 pr-[18px] pl-3 text-right">
                        <RowMenu
                          label={`Actions for ${c.code}`}
                          items={[
                            { label: "Edit", icon: PencilIcon, onSelect: () => open(c) },
                            { label: c.is_active ? "Switch off" : "Switch on", icon: PowerIcon, onSelect: () => toggle.run(c.id, !c.is_active) },
                            { label: "Delete coupon", icon: TrashIcon, danger: true, onSelect: () => setDeleting(c) },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-adm-line-soft px-[18px] py-3.5 text-sm text-adm-body">{plural(rows.length, "coupon")}</p>
      </section>

      {editing && (
        <FormDialog
          title={values ? `Edit ${values.code}` : "Add coupon"}
          icon={TicketIcon}
          adding={!values}
          submitLabel={values ? "Save changes" : "Add coupon"}
          pending={save.pending}
          onClose={close}
          onSubmit={async (form) => {
            const result = await save.run(form);
            if (result.error) setFormError(result.error);
            else close();
          }}
        >
          {values && <input type="hidden" name="id" value={values.id} />}
          <Field label="Code" hint="What customers type. Letters, numbers and dashes. Capitals are added for you.">
            <input name="code" required maxLength={30} autoFocus defaultValue={values?.code ?? ""} placeholder="e.g. KARIBU10" className={`${FIELD} font-mono font-normal uppercase`} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select name="kind" value={kind} onChange={(e) => setKind(e.target.value as CouponKind)} className={`${FIELD} font-normal`}>
                <option value="percent">Percentage off</option>
                <option value="amount">Shillings off</option>
              </select>
            </Field>
            <Field label={kind === "percent" ? "Percent off" : "KSh off"}>
              <input name="value" required inputMode="numeric" defaultValue={values?.value ?? ""} placeholder={kind === "percent" ? "e.g. 10" : "e.g. 500"} className={`${FIELD} font-normal`} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Minimum order (KSh)" hint="Blank for any order.">
              <input name="min_subtotal_kes" inputMode="numeric" defaultValue={values?.min_subtotal_kes ?? ""} className={`${FIELD} font-normal`} />
            </Field>
            {kind === "percent" ? (
              <Field label="Most it can take off (KSh)" hint="Blank for no limit.">
                <input name="max_discount_kes" inputMode="numeric" defaultValue={values?.max_discount_kes ?? ""} className={`${FIELD} font-normal`} />
              </Field>
            ) : (
              <span />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First day" hint="Blank to start now.">
              <input name="starts_on" type="date" defaultValue={dayOf(values?.starts_at ?? null)} className={`${FIELD} font-normal`} />
            </Field>
            <Field label="Last day" hint="Blank for no end.">
              <input name="ends_on" type="date" defaultValue={dayOf(values?.ends_at ?? null)} className={`${FIELD} font-normal`} />
            </Field>
          </div>
          <Field label="Total uses allowed" hint="Across all customers. Blank for no limit.">
            <input name="max_uses" inputMode="numeric" defaultValue={values?.max_uses ?? ""} className={`${FIELD} font-normal`} />
          </Field>
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" name="once_per_customer" defaultChecked={values?.once_per_customer ?? false} className="size-4 accent-adm-primary" />
            Once per customer (by phone number)
          </label>
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={values?.is_active ?? true} className="size-4 accent-adm-primary" />
            Switched on
          </label>
          <Field label="Note" hint="Only you see this.">
            <input name="note" maxLength={200} defaultValue={values?.note ?? ""} placeholder="e.g. Instagram giveaway, November" className={`${FIELD} font-normal`} />
          </Field>
          {formError && <p className="text-[13px] text-[#b42318]">{formError}</p>}
        </FormDialog>
      )}

      <ConfirmDialog
        open={deleting != null}
        title={`Delete ${deleting?.code ?? "this coupon"}?`}
        confirmLabel="Delete coupon"
        pending={remove.pending}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await remove.run(deleting.id);
          setDeleting(null);
        }}
      >
        Customers can&apos;t use it any more. Orders that already used it keep their discount. To pause it instead, switch it off.
      </ConfirmDialog>
    </div>
  );
}
