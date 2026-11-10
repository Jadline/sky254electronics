import { InfoPage, infoPageMetadata } from "@/components/info-page";

export const generateMetadata = () => infoPageMetadata("returns");

export default function Page() {
  return <InfoPage slug="returns" />;
}
