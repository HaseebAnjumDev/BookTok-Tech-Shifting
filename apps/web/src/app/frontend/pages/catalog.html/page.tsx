import { loadLegacyBodyHtml } from "@/lib/legacyHtml";
import { LegacyCatalogEnhancer } from "@/features/catalog/LegacyCatalogEnhancer";

export const metadata = {
  title: "BookTok - Catalog",
};

export default function LegacyCatalogPage() {
  const bodyHtml = loadLegacyBodyHtml("legacy/frontend/pages/catalog.html");

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <LegacyCatalogEnhancer />
    </>
  );
}
