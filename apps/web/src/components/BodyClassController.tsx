"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const AUTH_PAGE_PATHS = new Set([
  "/frontend/pages/login.html",
  "/frontend/pages/register.html",
]);

export function BodyClassController() {
  const pathname = usePathname();

  useEffect(() => {
    const shouldUseAuthPageClass = AUTH_PAGE_PATHS.has(pathname);

    if (shouldUseAuthPageClass) {
      document.body.classList.add("auth-page");
    } else {
      document.body.classList.remove("auth-page");
    }
  }, [pathname]);

  return null;
}
