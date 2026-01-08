import Script from "next/script";

import { loadLegacyBodyHtml } from "@/lib/legacyHtml";

export const metadata = {
  title: "BookTok - Sign Up",
};

export default function LegacyRegisterPage() {
  const bodyHtml = loadLegacyBodyHtml("legacy/frontend/pages/register.html");

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <Script src="/frontend/js/validation.js" strategy="beforeInteractive" />
    </>
  );
}
