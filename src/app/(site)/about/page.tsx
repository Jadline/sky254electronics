import { InfoPage, infoPageMetadata } from "@/components/info-page";

export const generateMetadata = () => infoPageMetadata("about");

export default function Page() {
  return <InfoPage slug="about" />;
}
