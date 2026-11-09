/** Sidebar heading with the short brand underline. */
export function SideTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="relative mb-5 border-b border-line pb-3.5 text-base font-medium after:absolute after:-bottom-px after:left-0 after:h-0.5 after:w-[70px] after:bg-brand">
      {children}
    </h2>
  );
}
