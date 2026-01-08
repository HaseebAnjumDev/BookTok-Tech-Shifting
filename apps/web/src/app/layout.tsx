import type { Metadata } from "next";
import Script from "next/script";

import { BodyClassController } from "@/components/BodyClassController";
import { LegacyCartRuntime } from "@/components/LegacyCartRuntime";
import "./globals.css";

export const metadata: Metadata = {
  title: "BookTok",
  description: "BookTok",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.8/css/bootstrap.min.css"
          rel="stylesheet"
        />
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.13.1/font/bootstrap-icons.min.css"
          rel="stylesheet"
        />
        <link href="/frontend/css/style.css" rel="stylesheet" />
      </head>
      <body>
        <BodyClassController />
        <LegacyCartRuntime />
        {children}

        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/js/bootstrap.bundle.min.js"
          strategy="beforeInteractive"
        />

        {/* Keep legacy styling/behaviors that aren't replaced yet. */}
        <Script src="/frontend/js/main.js" strategy="beforeInteractive" />
        <Script src="/frontend/js/auth.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
