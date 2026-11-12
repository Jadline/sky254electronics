"use client";

import { ArrowUturnLeftIcon, ChatBubbleLeftRightIcon, CheckIcon, EnvelopeIcon, MagnifyingGlassIcon, PhoneIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { deleteEnquiry, setEnquiryStatus } from "@/app/admin/enquiry-actions";
import { paginate, Pager } from "@/components/admin/pager";
import { Badge, buttonClass, formatDateTime, plural, SEARCH_BOX } from "@/components/admin/ui";
import { ActionNotice, useAdminAction } from "@/components/admin/use-admin-action";
import { ENQUIRY_TOPICS, isEnquiryTopic } from "@/lib/enquiries";
import { formatPhone } from "@/lib/order-labels";

export type EnquiryRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  topic: string;
  message: string;
  status: "new" | "done";
  created_at: string;
};

const PAGE = 20;
const TABS = [
  { value: "new", label: "New" },
  { value: "done", label: "Done" },
  { value: "all", label: "All" },
] as const;

export function EnquiriesList({ rows }: { rows: EnquiryRow[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("new");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [confirming, setConfirming] = useState<string | null>(null);
  const status = useAdminAction(setEnquiryStatus);
  const remove = useAdminAction(deleteEnquiry);
  const notice = remove.notice ?? status.notice;

  const counts = { new: rows.filter((r) => r.status === "new").length, done: rows.filter((r) => r.status === "done").length, all: rows.length };
  const visible = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (tab === "all" || r.status === tab) &&
        (!t || `${r.name} ${r.phone ?? ""} ${r.email ?? ""} ${r.message}`.toLowerCase().includes(t)),
    );
  }, [rows, tab, q]);
  const { pages, current, shown, summary } = paginate(visible, page, PAGE);

  return (
    <section aria-labelledby="enq-h" className="rounded-[20px] border border-adm-line bg-white">
      <h2 id="enq-h" className="sr-only">Messages</h2>
      <div className="flex flex-wrap items-center gap-3 border-b border-adm-line-soft px-[18px] py-4">
        <div role="tablist" aria-label="Show" className="flex gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => {
                setTab(t.value);
                setPage(1);
              }}
              className={`min-h-9 cursor-pointer rounded-full px-3.5 text-sm font-semibold ${tab === t.value ? "bg-adm-primary text-white" : "text-adm-body hover:bg-adm-surface"}`}
            >
              {t.label} <span className="font-normal opacity-80">({counts[t.value]})</span>
            </button>
          ))}
        </div>
        <div className={`${SEARCH_BOX} ml-auto flex-[0_1_300px]`}>
          <MagnifyingGlassIcon className="size-[18px] text-adm-muted" aria-hidden />
          <label htmlFor="e-q" className="sr-only">Search messages</label>
          <input
            id="e-q"
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search messages…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-0 placeholder:text-adm-faint"
          />
        </div>
      </div>

      {notice && (
        <div className="px-[18px] pt-3">
          <ActionNotice notice={notice} />
        </div>
      )}

      {shown.length === 0 ? (
        <p className="px-[18px] py-10 text-center text-adm-muted">
          {rows.length === 0 ? "No messages yet. They appear here when someone uses the form on the Contact page." : tab === "new" && !q ? "All caught up. No new messages." : "No messages match."}
        </p>
      ) : (
        <ul className="divide-y divide-adm-line-soft">
          {shown.map((r) => {
            const topic = isEnquiryTopic(r.topic) ? ENQUIRY_TOPICS[r.topic] : r.topic;
            const firstName = r.name.split(" ")[0];
            return (
              <li key={r.id} className="flex flex-col gap-3 px-[18px] py-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold">{r.name}</span>
                  <Badge tone={r.status === "new" ? "blue" : "gray"} dot={r.status === "new"}>{r.status === "new" ? "New" : "Done"}</Badge>
                  <Badge tone="indigo">{topic}</Badge>
                  <span className="ml-auto text-[13px] text-adm-muted">{formatDateTime(r.created_at)}</span>
                </div>
                <p className="text-[13px] text-adm-muted">{[r.phone && formatPhone(r.phone), r.email].filter(Boolean).join(" · ")}</p>
                <p className="text-sm whitespace-pre-wrap text-adm-ink">{r.message}</p>
                <div className="flex flex-wrap gap-2">
                  {r.phone && (
                    <>
                      <a href={`https://wa.me/${r.phone}?text=${encodeURIComponent(`Hi ${firstName}, this is Sky254 Electronics replying to your message.`)}`} target="_blank" rel="noreferrer" className={buttonClass.small}>
                        <ChatBubbleLeftRightIcon className="size-4" aria-hidden /> WhatsApp
                      </a>
                      <a href={`tel:+${r.phone}`} className={buttonClass.smallOutline}>
                        <PhoneIcon className="size-4" aria-hidden /> Call
                      </a>
                    </>
                  )}
                  {r.email && (
                    <a href={`mailto:${r.email}?subject=${encodeURIComponent("Your message to Sky254 Electronics")}`} className={r.phone ? buttonClass.smallOutline : buttonClass.small}>
                      <EnvelopeIcon className="size-4" aria-hidden /> Email
                    </a>
                  )}
                  <button
                    type="button"
                    disabled={status.pending}
                    onClick={() => status.run(r.id, r.status === "new" ? "done" : "new")}
                    className={buttonClass.smallOutline}
                  >
                    {r.status === "new" ? <CheckIcon className="size-4" aria-hidden /> : <ArrowUturnLeftIcon className="size-4" aria-hidden />}
                    {r.status === "new" ? "Mark done" : "Move to new"}
                  </button>
                  <button
                    type="button"
                    disabled={remove.pending}
                    onClick={() => {
                      if (confirming !== r.id) return setConfirming(r.id);
                      setConfirming(null);
                      remove.run(r.id);
                    }}
                    onBlur={() => setConfirming(null)}
                    className={`${buttonClass.smallOutline} text-[#b42318]`}
                  >
                    <TrashIcon className="size-4" aria-hidden />
                    {confirming === r.id ? "Click again to delete" : "Delete"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Pager page={current} pages={pages} onPage={setPage}>
        {summary || plural(visible.length, "message")}
      </Pager>
    </section>
  );
}
