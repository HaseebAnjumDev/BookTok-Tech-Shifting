import { loadLegacyBodyHtml } from "@/lib/legacyHtml";

export const metadata = {
  title: "BookTok - Orders",
};

export default function LegacyOrderPage() {
  const bodyHtml = loadLegacyBodyHtml("legacy/frontend/pages/order.html");

  return <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
}
