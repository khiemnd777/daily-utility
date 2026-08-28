import { build } from "esbuild";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const productRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(productRoot, "src");
const distRoot = join(productRoot, "dist");

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
  copyFile(join(productRoot, "support", "SUPPORT.txt"), join(distRoot, "SUPPORT.txt")),
]);

const jsZipLicense = await readFile(join(productRoot, "node_modules", "jszip", "LICENSE.markdown"), "utf8");
const xmlCharsLicense = await readFile(join(productRoot, "node_modules", "xmlchars", "LICENSE"), "utf8");
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
    "Presentation Template Preflight bundles JSZip 3.10.1.",
    "License: MIT OR GPL-3.0-or-later",
    "Source: https://github.com/Stuk/jszip",
    "",
    jsZipLicense,
    "",
    "Presentation Template Preflight bundles Saxes 6.0.0.",
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
    "PRESENTATION TEMPLATE PREFLIGHT 1.0.0",
    "",
    "Open index.html in a current desktop browser.",
    "Choose one final .pptx or .potx file, review every blocker and warning,",
    "then export the CSV and self-contained HTML release reports.",
    "",
    "All parsing and SHA-256 hashing happen locally. The app has no account,",
    "upload, analytics, telemetry, remote fetch, or persistent storage.",
    "",
    "Safety limits:",
    "- One presentation up to 100 MB",
    "- Up to 5,000 package parts",
    "- Up to 250 MB declared expanded content",
    "- Up to 5 MB per XML or relationships part",
    "- Package paths up to 260 characters",
    "",
    "This utility does not render or repair slides, prove font licensing,",
    "certify accessibility, execute macros or embedded objects, or guarantee",
    "PowerPoint compatibility. Perform a visual delivery check before release.",
    "",
    "Not affiliated with or endorsed by Microsoft.",
    "",
  ].join("\n"),
  "utf8",
);

console.log(`Built offline app in ${distRoot}`);
