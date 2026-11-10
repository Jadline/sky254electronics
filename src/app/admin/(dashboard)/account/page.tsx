import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import { Suspense } from "react";
import { logout } from "@/app/admin/actions";
import { PasswordForm } from "@/components/admin/password-form";
import { buttonClass, formatDateTime, initials, Loading, PageHeader } from "@/components/admin/ui";
import { adminName, requireAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Account" };

async function Account() {
  const { user } = await requireAdmin();
  const name = adminName(user);
  return (
    <div className="grid max-w-4xl items-start gap-[18px] md:grid-cols-[1fr_1.2fr]">
      <section aria-labelledby="me-h" className="flex flex-col gap-4 rounded-[20px] border border-adm-line bg-white px-[22px] py-5">
        <h2 id="me-h" className="text-lg font-semibold">
          Signed in
        </h2>
        <div className="flex items-center gap-3">
          <span aria-hidden className="flex size-12 items-center justify-center rounded-full bg-adm-primary font-semibold text-white">
            {initials(name)}
          </span>
          <span className="flex min-w-0 flex-col leading-snug">
            <span className="font-semibold">{name}</span>
            <span className="truncate text-sm text-adm-muted">{user.email}</span>
          </span>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-adm-line-soft pt-3.5 text-sm">
          <dt className="text-adm-muted">Role</dt>
          <dd>Shop admin</dd>
          <dt className="text-adm-muted">Last sign-in</dt>
          <dd>{formatDateTime(user.last_sign_in_at)}</dd>
        </dl>
        <form action={logout}>
          <button type="submit" className={buttonClass.outline}>
            <ArrowRightStartOnRectangleIcon className="size-[18px]" aria-hidden />
            Sign out
          </button>
        </form>
      </section>
      <PasswordForm />
    </div>
  );
}

export default function AccountPage() {
  return (
    <>
      <PageHeader title="Account" description="Your sign-in details for this dashboard." />
      <Suspense fallback={<Loading />}>
        <Account />
      </Suspense>
    </>
  );
}
