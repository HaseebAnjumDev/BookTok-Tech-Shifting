import Script from "next/script";

import { loadLegacyBodyHtml } from "@/lib/legacyHtml";

export const metadata = {
  title: "BookTok - Book Details",
};

export default function LegacyBookDetailsPage() {
  const bodyHtml = loadLegacyBodyHtml("legacy/frontend/pages/book.html");

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <Script src="/frontend/js/book-details.js" strategy="beforeInteractive" />
    </>
  );
}
