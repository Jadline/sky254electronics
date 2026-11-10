"use client";

import { ClipboardDocumentIcon, MagnifyingGlassIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { removeSubscriber } from "@/app/admin/actions";
import { paginate, Pager } from "@/components/admin/pager";
import { RowMenu } from "@/components/admin/row-menu";
import { buttonClass, formatDate, plural, SEARCH_BOX } from "@/components/admin/ui";
import { ActionNotice, useAdminAction, type Notice } from "@/components/admin/use-admin-action";

type Row = { id: string; email: string; joined: string };

const PAGE = 25;

export function SubscribersList({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState<Notice>(null);
  const remove = useAdminAction(removeSubscriber);

  const visible = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? rows.filter((r) => r.email.includes(t)) : rows;
  }, [rows, q]);
  const { pages, current, shown, summary } = paginate(visible, page, PAGE);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(rows.map((r) => r.email).join(", "));
      setCopied({ tone: "ok", text: `Copied ${plural(rows.length, "email")}. Paste them into the BCC field of an email.` });
    } catch {
      setCopied({ tone: "error", text: "Couldn't copy. Select the emails in the list instead." });
    }
  }

  const notice = remove.notice ?? copied;

  return (
    <section aria-labelledby="subs-h" className="rounded-[20px] border border-adm-line bg-white">
      <h2 id="subs-h" className="sr-only">
        All subscribers
      </h2>
      <div className="flex flex-wrap items-center gap-3 border-b border-adm-line-soft px-[18px] py-4">
        <div className={`${SEARCH_BOX} flex-[1_1_260px]`}>
          <MagnifyingGlassIcon className="size-[18px] text-adm-muted" aria-hidden />
          <label htmlFor="s-q" className="sr-only">
            Search emails
          </label>
          <input
            id="s-q"
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search emails…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-0 placeholder:text-adm-faint"
          />
        </div>
        <button type="button" onClick={copyAll} disabled={rows.length === 0} className={`${buttonClass.outline} ml-auto`}>
          <ClipboardDocumentIcon className="size-[18px]" aria-hidden />
          Copy all emails
        </button>
      </div>

      {notice && (
        <div className="px-[18px] pt-3">
          <ActionNotice notice={notice} />
        </div>
      )}

      {shown.length === 0 ? (
        <p className="px-[18px] py-10 text-center text-adm-muted">
          {rows.length ? "No emails match." : "No sign-ups yet. They appear here when someone subscribes in the shop's footer."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-[#f8fafd] text-xs tracking-[0.6px] text-adm-muted uppercase">
              <tr>
                <th scope="col" className="py-3 pr-3 pl-[18px] font-semibold">
                  Email
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Signed up
                </th>
                <th scope="col" className="w-[60px] py-3 pr-[18px] pl-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className="border-t border-adm-line-soft hover:bg-[#f8fafd]">
                  <td className="py-3 pr-3 pl-[18px] font-medium">{r.email}</td>
                  <td className="px-3 py-3 text-adm-muted">{formatDate(r.joined)}</td>
                  <td className="py-2 pr-[18px] pl-3 text-right">
                    <RowMenu
                      label={`Actions for ${r.email}`}
                      items={[
                        { label: "Email them", href: `mailto:${r.email}`, external: true },
                        { label: "Remove", icon: TrashIcon, danger: true, confirm: "Click again to remove", onSelect: () => remove.run(r.id) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={current} pages={pages} onPage={setPage}>
        {summary || plural(rows.length, "subscriber")}
      </Pager>
    </section>
  );
}
