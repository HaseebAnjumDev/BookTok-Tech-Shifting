import Script from "next/script";

import { loadLegacyBodyHtml } from "@/lib/legacyHtml";

export const metadata = {
  title: "BookTok - Payment",
};

export default function LegacyPaymentPage() {
  const bodyHtml = loadLegacyBodyHtml("legacy/frontend/pages/payment.html");

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <Script src="/frontend/js/payment.js" strategy="beforeInteractive" />
    </>
  );
}
