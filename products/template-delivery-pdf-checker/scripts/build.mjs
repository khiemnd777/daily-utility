import { build } from "esbuild";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const productRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(productRoot, "src");
const distRoot = join(productRoot, "dist");
const pdfWorkerPath = join(productRoot, "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.min.mjs");
const pdfLicensePath = join(productRoot, "node_modules", "pdfjs-dist", "LICENSE");

await rm(distRoot, { recursive: true, force: true });
await mkdir(distRoot, { recursive: true });

const workerSource = await readFile(pdfWorkerPath);
const workerDataUrl = `data:text/javascript;base64,${workerSource.toString("base64")}`;

await build({
  entryPoints: [join(sourceRoot, "app.js")],
  outfile: join(distRoot, "app.js"),
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2022"],
  minify: true,
  legalComments: "none",
  define: {
    __PDF_WORKER_DATA_URL__: JSON.stringify(workerDataUrl),
  },
});

await Promise.all([
  copyFile(join(sourceRoot, "index.html"), join(distRoot, "index.html")),
  copyFile(join(sourceRoot, "styles.css"), join(distRoot, "styles.css")),
]);

const pdfLicense = await readFile(pdfLicensePath, "utf8");
await writeFile(
  join(distRoot, "THIRD_PARTY_NOTICES.txt"),
  `Template Delivery PDF Checker bundles PDF.js (pdfjs-dist 6.2.108).\nLicense: Apache-2.0\nSource: https://github.com/mozilla/pdf.js\n\n${pdfLicense}`,
  "utf8",
);

await writeFile(
  join(distRoot, "README.txt"),
  [
    "TEMPLATE DELIVERY PDF CHECKER 1.0.0",
    "",
    "Open index.html in a current desktop browser, then choose or drop a delivery PDF.",
    "The app works offline and does not upload the PDF or extracted URLs.",
    "",
    "Classification is a QA hint. It does not verify live URL access, Canva permissions,",
    "licensing, password-protected PDFs, OCR, or QR codes.",
    "",
  ].join("\n"),
  "utf8",
);

console.log(`Built offline app in ${distRoot}`);
