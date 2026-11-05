import Link from "next/link";

export function PageUnavailable() {
  return (
    <main className="mx-auto flex w-full max-w-[1860px] flex-1 flex-col items-center justify-center gap-5 px-6 py-24 text-center">
      <h1 className="text-4xl font-light">
        This page isn&apos;t <strong className="font-semibold">available</strong>
      </h1>
      <p className="max-w-md text-muted">It may still be on the way, or the link may be wrong.</p>
      <Link
        href="/"
        className="btn-lift inline-flex h-10 items-center rounded-full bg-brand px-7 text-[13px] font-medium text-white uppercase"
      >
        Back to home
      </Link>
    </main>
  );
}
