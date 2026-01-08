import Script from "next/script";

import { loadLegacyBodyHtml } from "@/lib/legacyHtml";

export const metadata = {
  title: "BookTok - Profile",
};

export default function LegacyProfilePage() {
  const bodyHtml = loadLegacyBodyHtml("legacy/frontend/pages/profile.html");

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <Script src="/frontend/js/validation.js" strategy="beforeInteractive" />
    </>
  );
}
