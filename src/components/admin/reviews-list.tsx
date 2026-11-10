"use client";

import { ArrowTopRightOnSquareIcon, CheckIcon, EyeSlashIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { deleteReview, setReviewStatus } from "@/app/admin/review-actions";
import { paginate, Pager } from "@/components/admin/pager";
import { Badge, buttonClass, formatDateTime, plural, type Tone } from "@/components/admin/ui";
import { ActionNotice, useAdminAction } from "@/components/admin/use-admin-action";
import { formatPhone } from "@/lib/order-labels";

export type ReviewRow = {
  id: string;
  name: string;
  rating: number;
  title: string | null;
  body: string;
  phone: string;
  verified: boolean;
  status: "pending" | "approved" | "hidden";
  created_at: string;
  products: { name: string; slug: string } | null;
};

const PAGE = 20;
const TABS = [
  { value: "pending", label: "Waiting" },
  { value: "approved", label: "Approved" },
  { value: "hidden", label: "Hidden" },
] as const;
const STATUS: Record<ReviewRow["status"], { label: string; tone: Tone }> = {
  pending: { label: "Waiting", tone: "amber" },
  approved: { label: "Approved", tone: "green" },
  hidden: { label: "Hidden", tone: "gray" },
};

export function ReviewsList({ rows }: { rows: ReviewRow[] }) {
  const [tab, setTab] = useState<ReviewRow["status"]>("pending");
  const [page, setPage] = useState(1);
  const [confirming, setConfirming] = useState<string | null>(null);
  const status = useAdminAction(setReviewStatus);
  const remove = useAdminAction(deleteReview);
  const notice = remove.notice ?? status.notice;

  const visible = useMemo(() => rows.filter((r) => r.status === tab), [rows, tab]);
  const { pages, current, shown, summary } = paginate(visible, page, PAGE);

  return (
    <section aria-labelledby="rev-h" className="max-w-5xl rounded-[20px] border border-adm-line bg-white">
      <h2 id="rev-h" className="sr-only">Reviews</h2>
      <div role="tablist" aria-label="Show" className="flex flex-wrap gap-1.5 border-b border-adm-line-soft px-[18px] py-4">
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
            {t.label} <span className="font-normal opacity-80">({rows.filter((r) => r.status === t.value).length})</span>
          </button>
        ))}
      </div>

      {notice && (
        <div className="px-[18px] pt-3">
          <ActionNotice notice={notice} />
        </div>
      )}

      {shown.length === 0 ? (
        <p className="px-[18px] py-10 text-center text-adm-muted">
          {tab === "pending" ? "No reviews waiting. New ones appear here when customers write them on a product page." : "None here."}
        </p>
      ) : (
        <ul className="divide-y divide-adm-line-soft">
          {shown.map((r) => (
            <li key={r.id} className="flex flex-col gap-2.5 px-[18px] py-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-adm-coral" aria-label={`${r.rating} out of 5 stars`}>
                  {"★".repeat(r.rating)}
                  <span className="text-adm-line-strong">{"★".repeat(5 - r.rating)}</span>
                </span>
                <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                {r.verified && <Badge tone="teal">Verified buyer</Badge>}
                <span className="ml-auto text-[13px] text-adm-muted">{formatDateTime(r.created_at)}</span>
              </div>
              <p className="text-[13px] text-adm-muted">
                {r.products ? (
                  <a href={`/products/${r.products.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-adm-ink hover:text-adm-primary">
                    {r.products.name} <ArrowTopRightOnSquareIcon className="size-3.5" aria-hidden />
                  </a>
                ) : (
                  "Deleted product"
                )}
                {" · "}
                {r.name} · {formatPhone(r.phone)}
              </p>
              {r.title && <p className="font-semibold">{r.title}</p>}
              <p className="text-sm whitespace-pre-wrap text-adm-ink">{r.body}</p>
              <div className="flex flex-wrap gap-2">
                {r.status !== "approved" && (
                  <button type="button" disabled={status.pending} onClick={() => status.run(r.id, "approved")} className={buttonClass.small}>
                    <CheckIcon className="size-4" aria-hidden /> Approve
                  </button>
                )}
                {r.status !== "hidden" && (
                  <button type="button" disabled={status.pending} onClick={() => status.run(r.id, "hidden")} className={buttonClass.smallOutline}>
                    <EyeSlashIcon className="size-4" aria-hidden /> Hide
                  </button>
                )}
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
          ))}
        </ul>
      )}
      <Pager page={current} pages={pages} onPage={setPage}>
        {summary || plural(visible.length, "review")}
      </Pager>
    </section>
  );
}
