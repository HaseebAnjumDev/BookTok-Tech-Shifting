import fs from "node:fs";
import path from "node:path";

function extractBodyHtml(fullHtml: string): string {
  const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch?.[1] ?? "";
}

function stripScriptTags(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
}

export type LegacyRewrite = [from: string | RegExp, to: string];

export function loadLegacyBodyHtml(
  legacyFileRelativeToApp: string,
  rewrites: LegacyRewrite[] = []
): string {
  const absolutePath = path.resolve(process.cwd(), legacyFileRelativeToApp);
  const fullHtml = fs.readFileSync(absolutePath, "utf8");

  let bodyHtml = extractBodyHtml(fullHtml);
  bodyHtml = stripScriptTags(bodyHtml);

  for (const [from, to] of rewrites) {
    // eslint-disable-next-line unicorn/prefer-string-replace-all
    bodyHtml = bodyHtml.replace(from as any, to);
  }

  return bodyHtml;
}
