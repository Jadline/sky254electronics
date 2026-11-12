import Link from "next/link";

/** `inset` lines the title up with page content that sits beside a 300px sidebar. */
export function PageHeading({ title, inset = true }: { title: string; inset?: boolean }) {
  return (
    <div className={`mx-auto w-full px-6 max-sm:px-4 ${inset ? "max-w-[1860px]" : "max-w-[1200px]"}`}>
      <div className={`border-b border-line pt-8 pb-[26px] ${inset ? "lg:pl-[300px]" : ""}`}>
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
