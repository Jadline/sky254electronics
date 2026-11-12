"use client";

import { MapPinIcon, PencilIcon, PlusIcon, TrashIcon, TruckIcon } from "@heroicons/react/24/outline";
import { useOptimistic, useState, useTransition } from "react";
import {
  deleteDeliveryRow,
  saveDeliveryOption,
  saveFreeDelivery,
  savePickupPoint,
  setDeliverySwitch,
} from "@/app/admin/delivery-actions";
import { ConfirmDialog, FormDialog } from "@/components/admin/dialogs";
import { RowMenu } from "@/components/admin/row-menu";
import { buttonClass, FIELD, ksh, plural } from "@/components/admin/ui";
import { ActionNotice, useAdminAction } from "@/components/admin/use-admin-action";

export type OptionRow = {
  id: string;
  name: string;
  areas: string | null;
  town: string | null;
  cost_kes: number | null;
  own_rider: boolean;
  is_active: boolean;
  used: number;
};

export type PointRow = { id: string; name: string; address: string | null; hours: string | null; is_active: boolean; used: number };

type Tab = "options" | "points";
type Deleting = { table: "delivery_options" | "pickup_points"; id: string; name: string };

const TH = "px-3 py-3 font-semibold";

/** An on/off switch that flips at once and saves in the background. */
function Switch({ on, label, onToggle }: { on: boolean; label: string; onToggle: (next: boolean) => Promise<unknown> }) {
  const [shown, setShown] = useOptimistic(on);
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={shown}
      aria-label={label}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setShown(!shown);
          await onToggle(!shown);
        })
      }
      className={`inline-flex h-[26px] w-[46px] cursor-pointer rounded-full p-[3px] align-middle transition-colors disabled:cursor-wait ${shown ? "bg-adm-primary" : "bg-adm-line-strong"}`}
    >
      <span className={`size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(11,27,51,0.25)] transition-transform ${shown ? "translate-x-5" : ""}`} />
    </button>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold">
      <span>
        {label}
        {required && <span className="text-[#b42318]"> *</span>}
      </span>
      {children}
    </label>
  );
}

const usedText = (n: number) => (n ? plural(n, "order") : <span className="text-adm-muted">Not used yet</span>);

export function DeliveryManager({ options, points, freeOver }: { options: OptionRow[]; points: PointRow[]; freeOver: number | null }) {
  const [tab, setTab] = useState<Tab>("options");
  const [editingOption, setEditingOption] = useState<OptionRow | "new" | null>(null);
  const [editingPoint, setEditingPoint] = useState<PointRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<Deleting | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const saveOption = useAdminAction(saveDeliveryOption);
  const savePoint = useAdminAction(savePickupPoint);
  const toggle = useAdminAction(setDeliverySwitch);
  const remove = useAdminAction(deleteDeliveryRow);
  const free = useAdminAction(saveFreeDelivery);
  const notice = remove.notice ?? toggle.notice ?? free.notice ?? saveOption.notice ?? savePoint.notice;

  const close = () => {
    setEditingOption(null);
    setEditingPoint(null);
    setFormError(null);
  };
  const option = editingOption && editingOption !== "new" ? editingOption : null;
  const point = editingPoint && editingPoint !== "new" ? editingPoint : null;

  const tabs: { value: Tab; label: string; count: number; icon: typeof TruckIcon }[] = [
    { value: "options", label: "Delivery options", count: options.length, icon: TruckIcon },
    { value: "points", label: "Pickup points", count: points.length, icon: MapPinIcon },
  ];

  return (
    <div className="flex flex-col gap-4">
      <section aria-label={tab === "options" ? "Delivery options" : "Pickup points"} className="rounded-[20px] border border-adm-line bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-adm-line-soft px-[18px] py-4">
          <div role="tablist" className="flex gap-1 rounded-full bg-adm-surface p-1">
            {tabs.map((t) => (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={tab === t.value}
                onClick={() => setTab(t.value)}
                className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full px-3.5 text-sm font-semibold ${tab === t.value ? "bg-white text-adm-primary shadow-sm" : "text-adm-body hover:text-adm-ink"}`}
              >
                <t.icon className="size-[18px]" aria-hidden />
                {t.label}
                <span className="text-xs font-normal text-adm-muted">{t.count}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => (tab === "options" ? setEditingOption("new") : setEditingPoint("new"))}
            className={`${buttonClass.primary} ml-auto`}
          >
            <PlusIcon className="size-[18px] stroke-[2.4]" aria-hidden />
            {tab === "options" ? "Add delivery option" : "Add pickup point"}
          </button>
        </div>

        {notice && (
          <div className="px-[18px] pt-3">
            <ActionNotice notice={notice} />
          </div>
        )}

        {tab === "options" ? (
          options.length === 0 ? (
            <p className="px-[18px] py-10 text-center text-adm-muted">No delivery options yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-[#f8fafd] text-xs tracking-[0.6px] text-adm-muted uppercase">
                  <tr>
                    <th scope="col" className="py-3 pr-3 pl-[18px] font-semibold">Delivery option</th>
                    <th scope="col" className={TH}>Town</th>
                    <th scope="col" className={`${TH} text-right`}>Cost</th>
                    <th scope="col" className={`${TH} text-right`}>Used by</th>
                    <th scope="col" className={`${TH} text-center`}>Own rider</th>
                    <th scope="col" className={`${TH} text-center`}>At checkout</th>
                    <th scope="col" className="w-[60px] py-3 pr-[18px] pl-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {options.map((o) => (
                    <tr key={o.id} className="border-t border-adm-line-soft hover:bg-[#f8fafd]">
                      <td className="max-w-[420px] py-3 pr-3 pl-[18px]">
                        <button type="button" onClick={() => setEditingOption(o)} className="cursor-pointer text-left font-semibold hover:text-adm-primary">
                          {o.name}
                        </button>
                        <span className="block text-[13px] text-adm-muted">{o.areas || "No areas listed"}</span>
                      </td>
                      <td className="px-3 py-3 text-adm-body">{o.town || "—"}</td>
                      <td className="px-3 py-3 text-right font-semibold whitespace-nowrap tabular-nums">
                        {o.cost_kes == null ? <span className="font-normal text-adm-muted">By phone</span> : o.cost_kes === 0 ? "Free" : ksh(o.cost_kes)}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">{usedText(o.used)}</td>
                      <td className="px-3 py-3 text-center">
                        <Switch on={o.own_rider} label={`${o.name}: our own rider`} onToggle={(on) => toggle.run("delivery_options", o.id, "own_rider", on)} />
                        <span className="block text-xs text-adm-muted">{o.own_rider ? "Pay on delivery" : "M-Pesa first"}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Switch on={o.is_active} label={`${o.name}: shown at checkout`} onToggle={(on) => toggle.run("delivery_options", o.id, "is_active", on)} />
                      </td>
                      <td className="py-2 pr-[18px] pl-3 text-right">
                        <RowMenu
                          label={`Actions for ${o.name}`}
                          items={[
                            { label: "Edit", icon: PencilIcon, onSelect: () => setEditingOption(o) },
                            { label: "Delete", icon: TrashIcon, danger: true, onSelect: () => setDeleting({ table: "delivery_options", id: o.id, name: o.name }) },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : points.length === 0 ? (
          <p className="px-[18px] py-10 text-center text-adm-muted">No pickup points yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#f8fafd] text-xs tracking-[0.6px] text-adm-muted uppercase">
                <tr>
                  <th scope="col" className="py-3 pr-3 pl-[18px] font-semibold">Pickup point</th>
                  <th scope="col" className={TH}>Hours</th>
                  <th scope="col" className={`${TH} text-right`}>Used by</th>
                  <th scope="col" className={`${TH} text-center`}>At checkout</th>
                  <th scope="col" className="w-[60px] py-3 pr-[18px] pl-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.id} className="border-t border-adm-line-soft hover:bg-[#f8fafd]">
                    <td className="max-w-[460px] py-3 pr-3 pl-[18px]">
                      <button type="button" onClick={() => setEditingPoint(p)} className="cursor-pointer text-left font-semibold hover:text-adm-primary">
                        {p.name}
                      </button>
                      <span className="block text-[13px] text-adm-muted">{p.address || "No address"}</span>
                    </td>
                    <td className="px-3 py-3 text-adm-body">{p.hours || "—"}</td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">{usedText(p.used)}</td>
                    <td className="px-3 py-3 text-center">
                      <Switch on={p.is_active} label={`${p.name}: shown at checkout`} onToggle={(on) => toggle.run("pickup_points", p.id, "is_active", on)} />
                    </td>
                    <td className="py-2 pr-[18px] pl-3 text-right">
                      <RowMenu
                        label={`Actions for ${p.name}`}
                        items={[
                          { label: "Edit", icon: PencilIcon, onSelect: () => setEditingPoint(p) },
                          { label: "Delete", icon: TrashIcon, danger: true, onSelect: () => setDeleting({ table: "pickup_points", id: p.id, name: p.name }) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {tab === "options" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            free.run(new FormData(e.currentTarget));
          }}
          className="flex flex-wrap items-end gap-3 rounded-[20px] border border-adm-line bg-white px-[18px] py-4"
        >
          <Field label="Free delivery from (KSh)">
            <input
              name="free_delivery_over_kes"
              inputMode="numeric"
              defaultValue={freeOver ?? ""}
              placeholder="Blank for none"
              className={`${FIELD} w-[200px] font-normal`}
            />
          </Field>
          <button type="submit" disabled={free.pending} className={buttonClass.outline}>
            {free.pending ? "Saving…" : "Save"}
          </button>
        </form>
      )}

      {editingOption && (
        <FormDialog
          title={option ? `Edit ${option.name}` : "Add delivery option"}
          icon={TruckIcon}
          adding={!option}
          submitLabel={option ? "Save changes" : "Add"}
          pending={saveOption.pending}
          onClose={close}
          onSubmit={async (form) => {
            const result = await saveOption.run(form);
            if (result.error) setFormError(result.error);
            else close();
          }}
        >
          {option && <input type="hidden" name="id" value={option.id} />}
          <Field label="Name" required>
            <input name="name" required maxLength={160} autoFocus defaultValue={option?.name ?? ""} placeholder="e.g. Nairobi CBD" className={`${FIELD} font-normal`} />
          </Field>
          <Field label="Areas covered">
            <textarea name="areas" rows={2} maxLength={500} defaultValue={option?.areas ?? ""} placeholder="e.g. Westlands, Parklands, Kileleshwa" className={`${FIELD} font-normal`} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Town">
              <input name="town" maxLength={80} defaultValue={option?.town ?? ""} placeholder="e.g. Nairobi" className={`${FIELD} font-normal`} />
            </Field>
            <Field label="Cost (KSh)">
              <input name="cost_kes" inputMode="numeric" defaultValue={option?.cost_kes ?? ""} placeholder="0 = free, blank = by phone" className={`${FIELD} font-normal`} />
            </Field>
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-[14px] bg-adm-surface px-3.5 py-3 text-sm">
            <input type="checkbox" name="own_rider" defaultChecked={option?.own_rider ?? true} className="mt-0.5 size-4 accent-adm-primary" />
            <span>
              <strong className="font-semibold">Our own rider delivers</strong>
              <span className="block text-[13px] text-adm-muted">Pay on delivery. Untick for a courier: M-Pesa first.</span>
            </span>
          </label>
          {formError && <p className="text-[13px] text-[#b42318]">{formError}</p>}
        </FormDialog>
      )}

      {editingPoint && (
        <FormDialog
          title={point ? `Edit ${point.name}` : "Add pickup point"}
          icon={MapPinIcon}
          adding={!point}
          submitLabel={point ? "Save changes" : "Add"}
          pending={savePoint.pending}
          onClose={close}
          onSubmit={async (form) => {
            const result = await savePoint.run(form);
            if (result.error) setFormError(result.error);
            else close();
          }}
        >
          {point && <input type="hidden" name="id" value={point.id} />}
          <Field label="Name" required>
            <input name="name" required maxLength={160} autoFocus defaultValue={point?.name ?? ""} placeholder="e.g. Our shop" className={`${FIELD} font-normal`} />
          </Field>
          <Field label="Address">
            <textarea name="address" rows={2} maxLength={300} defaultValue={point?.address ?? ""} placeholder="e.g. Shop 12, Luthuli Avenue, Nairobi" className={`${FIELD} font-normal`} />
          </Field>
          <Field label="Hours">
            <input name="hours" maxLength={120} defaultValue={point?.hours ?? ""} placeholder="e.g. Mon–Sat, 8am – 7pm" className={`${FIELD} font-normal`} />
          </Field>
          {formError && <p className="text-[13px] text-[#b42318]">{formError}</p>}
        </FormDialog>
      )}

      <ConfirmDialog
        open={deleting != null}
        title={`Delete ${deleting?.name ?? ""}?`}
        confirmLabel="Delete"
        pending={remove.pending}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await remove.run(deleting.table, deleting.id);
          setDeleting(null);
        }}
      >
        Past orders keep it. To hide it instead, switch off At checkout.
      </ConfirmDialog>
    </div>
  );
}
