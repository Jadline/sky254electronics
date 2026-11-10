"use client";

import { ArrowPathIcon, ChatBubbleOvalLeftIcon, DocumentTextIcon, EnvelopeIcon, MagnifyingGlassIcon, PhoneIcon, PlusIcon, UsersIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { paginate, Pager } from "@/components/admin/pager";
import { RowMenu } from "@/components/admin/row-menu";
import { Badge, formatDate, initials, ksh, SEARCH_BOX, SELECT_PILL, TINTS } from "@/components/admin/ui";
import { prettyPhone, whatsappLink } from "@/lib/admin/orders";

export type CustomerRow = {
  phone: string;
  name: string;
  email: string;
  address: string;
  orders: number;
  cancelled: number;
  spent: number;
  first: string;
  last: string;
};

const PAGE = 15;
const NEW_DAYS = 30;

const digits = (s: string) => s.replace(/\D/g, "").replace(/^0/, "254");

export function CustomersList({ customers, initialQuery }: { customers: CustomerRow[]; initialQuery: string }) {
  const [view, setView] = useState("all");
  const [sort, setSort] = useState("recent");
  const [q, setQ] = useState(initialQuery);
  const [page, setPage] = useState(1);
  // Fixed when the list opens, so "new this month" doesn't shift while it's open.
  const [since] = useState(() => new Date(Date.now() - NEW_DAYS * 86_400_000).toISOString());

  const views = useMemo<Record<string, (c: CustomerRow) => boolean>>(
    () => ({
      all: () => true,
      fresh: (c) => c.first >= since,
      returning: (c) => c.orders > 1,
      email: (c) => Boolean(c.email),
    }),
    [since],
  );
  const stats = [
    { key: "all", label: "All customers", hint: "Everyone who has ordered", icon: UsersIcon, tint: TINTS[0] },
    { key: "fresh", label: "New this month", hint: `First order in the last ${NEW_DAYS} days`, icon: PlusIcon, tint: TINTS[2] },
    { key: "returning", label: "Returning", hint: "Ordered more than once", icon: ArrowPathIcon, tint: TINTS[3] },
    { key: "email", label: "Gave an email", hint: "Can be reached by email", icon: EnvelopeIcon, tint: TINTS[1] },
  ];

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const tDigits = digits(t);
    const sorters: Record<string, (a: CustomerRow, b: CustomerRow) => number> = {
      recent: (a, b) => b.last.localeCompare(a.last),
      spent: (a, b) => b.spent - a.spent,
      orders: (a, b) => b.orders - a.orders || b.spent - a.spent,
      name: (a, b) => a.name.localeCompare(b.name, "en", { numeric: true }),
    };
    return customers
      .filter(views[view])
      .filter((c) => !t || c.name.toLowerCase().includes(t) || c.email.toLowerCase().includes(t) || (tDigits.length >= 3 && c.phone.includes(tDigits)))
      .sort(sorters[sort]);
  }, [customers, views, view, sort, q]);
  const { pages, current, shown, summary } = paginate(rows, page, PAGE);

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="Customer figures" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
        {stats.map((s, i) => {
          const Icon = s.icon;
          const on = view === s.key;
          return (
            <button
              key={s.key}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setView(s.key);
                setPage(1);
              }}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`fade-up flex cursor-pointer items-center gap-3.5 rounded-[18px] border-[1.5px] bg-white p-[18px] text-left transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(11,27,51,0.08)] ${on ? "border-adm-primary" : "border-adm-line"}`}
            >
              <span aria-hidden className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${s.tint}`}>
                <Icon className="size-[22px]" />
              </span>
              <span className="flex min-w-0 flex-col leading-snug">
                <span className="text-[26px] leading-tight font-semibold">{customers.filter(views[s.key]).length}</span>
                <span className="text-sm font-medium">{s.label}</span>
                <span className="text-[13px] text-adm-muted">{s.hint}</span>
              </span>
            </button>
          );
        })}
      </section>

      <section aria-labelledby="cust-h" className="rounded-[20px] border border-adm-line bg-white">
        <h2 id="cust-h" className="sr-only">
          Customer list
        </h2>
        <div className="flex flex-wrap items-center gap-3 border-b border-adm-line-soft px-[18px] py-4">
          <div className={`${SEARCH_BOX} flex-[1_1_260px]`}>
            <MagnifyingGlassIcon className="size-[18px] text-adm-muted" aria-hidden />
            <label htmlFor="c-q" className="sr-only">
              Search customers
            </label>
            <input
              id="c-q"
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, phone or email…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-0 placeholder:text-adm-faint"
            />
          </div>
          <label htmlFor="c-sort" className="sr-only">
            Sort customers
          </label>
          <select id="c-sort" value={sort} onChange={(e) => setSort(e.target.value)} className={SELECT_PILL}>
            <option value="recent">Latest order first</option>
            <option value="spent">Spent the most</option>
            <option value="orders">Most orders</option>
            <option value="name">Name: A to Z</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#f8fafd] text-xs tracking-[0.6px] text-adm-muted uppercase">
              <tr>
                <th scope="col" className="py-3 pr-3 pl-[18px] font-semibold">
                  Customer
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Phone
                </th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">
                  Orders
                </th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">
                  Spent
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Last order
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Delivery address
                </th>
                <th scope="col" className="w-[50px] py-3 pr-[18px] pl-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c, i) => (
                <tr key={c.phone} className="border-t border-adm-line-soft hover:bg-[#f8fafd]">
                  <td className="py-3 pr-3 pl-[18px]">
                    <span className="flex items-center gap-2.5 whitespace-nowrap">
                      <span aria-hidden className={`flex size-[34px] items-center justify-center rounded-full text-xs font-bold ${TINTS[i % 4]}`}>
                        {initials(c.name)}
                      </span>
                      <span className="flex flex-col leading-snug">
                        <strong className="font-semibold">{c.name}</strong>
                        <span className="text-[13px] text-adm-muted">{c.email || "No email"}</span>
                      </span>
                      {c.orders > 1 && <Badge tone="blue">Returning</Badge>}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-adm-body">{prettyPhone(c.phone)}</td>
                  <td className="px-3 py-3 text-right">
                    {c.orders}
                    {c.cancelled > 0 && <span className="block text-[13px] text-adm-muted">+{c.cancelled} cancelled</span>}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold whitespace-nowrap">{ksh(c.spent)}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-adm-body">{formatDate(c.last)}</td>
                  <td className="max-w-[260px] truncate px-3 py-3 text-adm-body" title={c.address}>
                    {c.address || "—"}
                  </td>
                  <td className="py-2 pr-[18px] pl-3 text-right">
                    <RowMenu
                      label={`Actions for ${c.name}`}
                      items={[
                        { label: "See their orders", icon: DocumentTextIcon, href: `/admin/orders?q=${encodeURIComponent(c.phone)}` },
                        { label: "WhatsApp", icon: ChatBubbleOvalLeftIcon, href: whatsappLink(c.phone, `Hi ${c.name.split(" ")[0]}, this is Sky254.`), external: true },
                        { label: "Call", icon: PhoneIcon, href: `tel:+${c.phone}`, external: true },
                        !!c.email && { label: "Email", icon: EnvelopeIcon, href: `mailto:${c.email}`, external: true },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {shown.length === 0 && (
          <p className="px-[18px] py-10 text-center text-adm-muted">
            {customers.length ? "No customers match. Try another search." : "No customers yet. They appear here after their first order."}
          </p>
        )}
        <Pager page={current} pages={pages} onPage={setPage}>
          {summary || "0 customers"}
        </Pager>
      </section>
    </div>
  );
}
