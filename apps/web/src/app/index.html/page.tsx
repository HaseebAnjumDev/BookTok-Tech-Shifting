import Script from "next/script";

import { loadLegacyBodyHtml } from "@/lib/legacyHtml";

export const metadata = {
  title: "BookTok",
};

export default function LegacyHomePage() {
  const bodyHtml = loadLegacyBodyHtml("legacy/index.html");

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <Script src="/frontend/js/home-data.js" strategy="beforeInteractive" />
    </>
  );
}
