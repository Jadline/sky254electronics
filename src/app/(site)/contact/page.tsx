import { InfoPage, infoPageMetadata } from "@/components/info-page";

export const generateMetadata = () => infoPageMetadata("contact");

export default function Page() {
  return <InfoPage slug="contact" />;
}
