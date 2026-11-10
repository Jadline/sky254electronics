"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState, type ComponentType, type SVGProps } from "react";

export type RowMenuItem = {
  label: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  href?: string;
  /** A plain link outside the admin: the live shop, WhatsApp, a phone call or an email. */
  external?: boolean;
  onSelect?: () => void;
  danger?: boolean;
  /** Asks again before running: the item's label becomes this until it is clicked twice. */
  confirm?: string;
};

const itemClass =
  "flex min-h-[42px] w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 text-left text-[15px] data-focus:bg-adm-surface";

/** The ⋮ button at the end of a table row. Floats above the table, so it never gets clipped. */
export function RowMenu({ label, items }: { label: string; items: (RowMenuItem | false | null | undefined)[] }) {
  const [armed, setArmed] = useState<string | null>(null);
  return (
    <Menu>
      <MenuButton
        aria-label={label}
        onClick={() => setArmed(null)}
        className="inline-flex size-[38px] cursor-pointer items-center justify-center rounded-[10px] border border-adm-line bg-white text-adm-ink transition-colors hover:bg-adm-tint data-open:bg-adm-tint"
      >
        <EllipsisVerticalIcon className="size-5" aria-hidden />
      </MenuButton>
      <MenuItems
        anchor={{ to: "bottom end", gap: 4 }}
        className="z-50 w-[230px] rounded-[14px] border border-adm-line bg-white p-1.5 text-adm-ink shadow-[0_18px_40px_rgba(11,27,51,0.14)] outline-none"
      >
        {items.filter(Boolean).map((raw) => {
          const item = raw as RowMenuItem;
          const Icon = item.icon;
          const content = (
            <>
              {Icon && <Icon className="size-[17px] shrink-0" aria-hidden />}
              <span>{armed === item.label && item.confirm ? item.confirm : item.label}</span>
            </>
          );
          const color = item.danger ? "text-[#b42318]" : "";
          if (item.href) {
            return (
              <MenuItem key={item.label}>
                {item.external ? (
                  <a
                    href={item.href}
                    // Web pages open in a new tab; tel: and mailto: hand over to the phone or mail app.
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className={`${itemClass} ${color}`}
                  >
                    {content}
                  </a>
                ) : (
                  <Link href={item.href} className={`${itemClass} ${color}`}>
                    {content}
                  </Link>
                )}
              </MenuItem>
            );
          }
          return (
            <MenuItem key={item.label}>
              <button
                type="button"
                className={`${itemClass} ${color}`}
                onClick={(e) => {
                  if (item.confirm && armed !== item.label) {
                    // Keep the menu open and ask again.
                    e.preventDefault();
                    setArmed(item.label);
                    return;
                  }
                  item.onSelect?.();
                }}
              >
                {content}
              </button>
            </MenuItem>
          );
        })}
      </MenuItems>
    </Menu>
  );
}
