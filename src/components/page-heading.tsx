import Link from "next/link";

export function PageHeading({ title }: { title: string }) {
  return (
    <div className="mx-auto w-full max-w-[1860px] px-6">
      <div className="border-b border-line pt-8 pb-[26px] lg:pl-[300px]">
        <h1 className="mb-3 text-[26px] font-normal">{title}</h1>
        <nav aria-label="Breadcrumb" className="flex gap-1.5 text-[13px]">
          <Link href="/" className="hover:text-brand">Home</Link>
          <span aria-hidden="true">&gt;</span>
          <span className="text-muted">{title}</span>
        </nav>
      </div>
    </div>
  );
}
