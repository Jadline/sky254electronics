import { ChatIcon, PhoneIcon, ShieldIcon, TruckIcon } from "@/components/icons";

const SERVICES = [
  { title: "Same-day delivery", sub: "Within Nairobi", Icon: TruckIcon },
  { title: "Pay with M-Pesa", sub: "Or cash on delivery", Icon: PhoneIcon },
  { title: "Genuine, sealed", sub: "Official warranties", Icon: ShieldIcon },
  { title: "WhatsApp support", sub: "Talk to a real person", Icon: ChatIcon },
];

export function ServiceList() {
  return (
    <div className="border border-b-0 border-line">
      {SERVICES.map(({ title, sub, Icon }) => (
        <div key={title} className="flex items-center gap-4 border-b border-line px-[22px] py-5">
          <Icon className="size-8 flex-none text-brand" strokeWidth={1.3} />
          <span className="flex flex-col gap-1">
            <strong className="text-sm font-medium">{title}</strong>
            <span className="text-xs text-muted">{sub}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
