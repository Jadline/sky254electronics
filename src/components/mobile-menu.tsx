"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ChevronRightIcon, CloseIcon, MenuIcon, TruckIcon } from "@/components/icons";

type MenuLink = { label: string; href: string };

/** The phone and tablet menu: a button in the header that opens a side sheet with every link
    the desktop header shows across three rows. */
export function MobileMenu({ main, departments, phone, whatsapp }: { main: MenuLink[]; departments: MenuLink[]; phone: string; whatsapp: string | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  // Following a link closes the menu.
  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  const close = () => dialog.current?.close();
  const row = "flex min-h-12 items-center gap-3 border-b border-line px-5 text-[15px] transition-colors hover:text-brand";

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => dialog.current?.showModal()}
        className="-ml-2.5 flex size-11 cursor-pointer items-center justify-center lg:hidden"
      >
        <MenuIcon className="size-6" />
      </button>

      <dialog
        ref={dialog}
        aria-label="Menu"
        // A tap on the dimmed backdrop (outside the sheet) closes it.
        onClick={(event) => event.target === dialog.current && close()}
        className="m-0 h-dvh max-h-none w-[86vw] max-w-sm overflow-y-auto overscroll-contain bg-white p-0 text-text"
      >
        <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-white pr-2 pl-5">
          <span className="text-2xl leading-none font-bold tracking-tight">
            Sky<span className="text-brand">254</span>
          </span>
          <button type="button" aria-label="Close menu" onClick={close} className="flex size-11 cursor-pointer items-center justify-center">
            <CloseIcon className="size-6" />
          </button>
        </div>

        <nav aria-label="Mobile">
          {main.map((link) => (
            <Link key={link.href} href={link.href} onClick={close} className={`${row} font-medium`}>
              {link.label}
            </Link>
          ))}
          <Link href="/track-order" onClick={close} className={row}>
            <TruckIcon className="size-5 text-brand" strokeWidth={1.6} /> Track your order
          </Link>

          <h2 className="bg-tint px-5 pt-5 pb-2.5 text-xs font-medium tracking-wide text-brand uppercase">All departments</h2>
          {departments.map((link) => (
            <Link key={link.href} href={link.href} onClick={close} className={`${row} justify-between text-sm`}>
              {link.label}
              <ChevronRightIcon className="size-3 text-muted" strokeWidth={2.5} />
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-1.5 px-5 py-6 text-sm text-body">
          <span>Call / WhatsApp</span>
          <a href={`tel:${phone.replace(/\s+/g, "")}`} className="text-lg font-medium text-brand">{phone}</a>
          {whatsapp && (
            <a href={whatsapp} className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-[#15803d] text-[13px] font-medium text-white uppercase">
              Chat on WhatsApp
            </a>
          )}
        </div>
      </dialog>
    </>
  );
}
