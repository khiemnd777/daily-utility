import { build } from "esbuild";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const productRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(productRoot, "src");
const distRoot = join(productRoot, "dist");
const jsZipLicensePath = join(productRoot, "node_modules", "jszip", "LICENSE.markdown");
const xmlCharsLicensePath = join(productRoot, "node_modules", "xmlchars", "LICENSE");

await rm(distRoot, { recursive: true, force: true });
await mkdir(distRoot, { recursive: true });

await build({
  entryPoints: [join(sourceRoot, "app.js")],
  outfile: join(distRoot, "app.js"),
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2022"],
  minify: true,
  legalComments: "none",
});

await Promise.all([
  copyFile(join(sourceRoot, "index.html"), join(distRoot, "index.html")),
  copyFile(join(sourceRoot, "styles.css"), join(distRoot, "styles.css")),
]);

const jsZipLicense = await readFile(jsZipLicensePath, "utf8");
const xmlCharsLicense = await readFile(xmlCharsLicensePath, "utf8");
const saxesLicense = `Copyright (c) Louis-Dominique Dubeau

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.`;
await writeFile(
  join(distRoot, "THIRD_PARTY_NOTICES.txt"),
  [
    "SVG Bundle Preflight bundles JSZip 3.10.1.",
    "License: MIT OR GPL-3.0-or-later",
    "Source: https://github.com/Stuk/jszip",
    "",
    jsZipLicense,
    "",
    "SVG Bundle Preflight bundles Saxes 6.0.0.",
    "License: ISC",
    "Source: https://github.com/lddubeau/saxes",
    "",
    saxesLicense,
    "",
    "Saxes bundles xmlchars 2.2.0.",
    "License: MIT",
    "Source: https://github.com/lddubeau/xmlchars",
    "",
    xmlCharsLicense,
  ].join("\n"),
  "utf8",
);

await writeFile(
  join(distRoot, "README.txt"),
  [
    "SVG BUNDLE PREFLIGHT 1.0.0",
    "",
    "Open index.html in a current desktop browser.",
    "Choose one ZIP archive or one or more SVG files, review the findings,",
    "then export a CSV or self-contained HTML release report.",
    "",
    "All parsing and hashing happen locally. The app has no account, upload,",
    "analytics, telemetry, or network request.",
    "",
    "Safety limits:",
    "- One ZIP up to 50 MB compressed",
    "- Up to 100 MB expanded SVG content",
    "- Up to 500 SVG files",
    "- Up to 2 MB per SVG",
    "- Paths up to 240 characters",
    "",
    "The utility does not repair files, recurse into nested archives, validate",
    "DXF/EPS/PNG, test physical cuts, or provide licensing advice. A static pass",
    "does not replace a representative import and real test cut.",
    "",
    "Not affiliated with or endorsed by Cricut or Etsy.",
    "",
  ].join("\n"),
  "utf8",
);

console.log(`Built offline app in ${distRoot}`);
