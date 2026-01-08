import Script from "next/script";

import { loadLegacyBodyHtml } from "@/lib/legacyHtml";

export const metadata = {
  title: "BookTok - Login",
};

export default function LegacyLoginPage() {
  const bodyHtml = loadLegacyBodyHtml("legacy/frontend/pages/login.html");

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <Script src="/frontend/js/validation.js" strategy="beforeInteractive" />
    </>
  );
}
