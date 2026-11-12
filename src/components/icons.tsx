import type { SVGProps } from "react";

function Stroke({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

type IconProps = SVGProps<SVGSVGElement>;

export const MenuIcon = (p: IconProps) => <Stroke {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Stroke>;
export const ChevronRightIcon = (p: IconProps) => <Stroke {...p}><path d="m9 6 6 6-6 6" /></Stroke>;
export const ChevronUpIcon = (p: IconProps) => <Stroke {...p}><path d="m6 15 6-6 6 6" /></Stroke>;
export const TruckIcon = (p: IconProps) => (
  <Stroke {...p}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></Stroke>
);
export const HeartIcon = (p: IconProps) => (
  <Stroke {...p}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></Stroke>
);
export const BagIcon = (p: IconProps) => <Stroke {...p}><path d="M5 8h14v12H5z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></Stroke>;
export const ChatIcon = (p: IconProps) => <Stroke {...p}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></Stroke>;
export const PhoneIcon = (p: IconProps) => <Stroke {...p}><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M11 18h2" /></Stroke>;
export const ShieldIcon = (p: IconProps) => <Stroke {...p}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z" /><path d="m9 12 2 2 4-4" /></Stroke>;
export const MapPinIcon = (p: IconProps) => (
  <Stroke {...p}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></Stroke>
);
export const MailIcon = (p: IconProps) => <Stroke {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Stroke>;
export const ClockIcon = (p: IconProps) => <Stroke {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Stroke>;
export const CloseIcon =(p: IconProps) => <Stroke {...p}><path d="M6 6l12 12M18 6 6 18" /></Stroke>;
