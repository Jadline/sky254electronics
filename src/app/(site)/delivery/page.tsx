import { InfoPage, infoPageMetadata } from "@/components/info-page";

export const generateMetadata = () => infoPageMetadata("delivery");

export default function Page() {
  return <InfoPage slug="delivery" />;
}
