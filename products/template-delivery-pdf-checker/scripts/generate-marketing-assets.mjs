import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

import { PDFDocument, PDFName, PDFString, StandardFonts, rgb } from "pdf-lib";
import { chromium } from "playwright-core";
import { unzipSync } from "fflate";

const productRoot = new URL("../", import.meta.url);
const marketingDirectory = new URL("marketing/", productRoot);
const workDirectory = new URL(".work/marketing/", productRoot);
const fixturePath = fileURLToPath(new URL("sample-delivery.pdf", workDirectory));
const appUrl = pathToFileURL(fileURLToPath(new URL("dist/index.html", productRoot))).href;
const releasePath = fileURLToPath(
  new URL("release/template-delivery-pdf-checker-v1.0.0.zip", productRoot),
);
const chromeExecutable =
  process.env.CHROME_EXECUTABLE || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const fixedTime = "2026-08-27T08:00:00.000Z";

await Promise.all([
  mkdir(marketingDirectory, { recursive: true }),
  mkdir(workDirectory, { recursive: true }),
  access(new URL("dist/app.js", productRoot)),
  access(chromeExecutable),
]);

function addLinkAnnotation(document, page, target, rect) {
  const annotation = document.context.register(
    document.context.obj({
      Type: PDFName.of("Annot"),
      Subtype: PDFName.of("Link"),
      Rect: document.context.obj(rect),
      Border: document.context.obj([0, 0, 0]),
      A: document.context.obj({ S: PDFName.of("URI"), URI: PDFString.of(target) }),
    }),
  );
  page.node.addAnnot(annotation);
}

async function createFixturePdf() {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const firstPage = document.addPage([612, 792]);
  const secondPage = document.addPage([612, 792]);

  firstPage.drawText("Fictional template delivery guide", {
    x: 64,
    y: 700,
    size: 24,
    font: bold,
    color: rgb(0.09, 0.28, 0.21),
  });
  firstPage.drawText("Use the green button. Review the red master-edit link before delivery.", {
    x: 64,
    y: 664,
    size: 11,
    font,
    color: rgb(0.31, 0.37, 0.34),
  });
  firstPage.drawRectangle({ x: 64, y: 570, width: 250, height: 54, color: rgb(0.12, 0.52, 0.34) });
  firstPage.drawText("Open buyer-safe template", { x: 86, y: 590, size: 14, font: bold, color: rgb(1, 1, 1) });
  addLinkAnnotation(
    document,
    firstPage,
    "https://www.canva.com/design/FICTIONAL/view?mode=preview",
    [64, 570, 314, 624],
  );
  firstPage.drawRectangle({ x: 64, y: 486, width: 250, height: 54, color: rgb(0.74, 0.24, 0.2) });
  firstPage.drawText("Master edit link — review", { x: 86, y: 506, size: 14, font: bold, color: rgb(1, 1, 1) });
  addLinkAnnotation(
    document,
    firstPage,
    "https://www.canva.com/design/FICTIONAL-MASTER/edit",
    [64, 486, 314, 540],
  );

  secondPage.drawText("Support and instructions", {
    x: 64,
    y: 700,
    size: 24,
    font: bold,
    color: rgb(0.09, 0.28, 0.21),
  });
  secondPage.drawRectangle({ x: 64, y: 590, width: 250, height: 54, color: rgb(0.22, 0.36, 0.47) });
  secondPage.drawText("Read fictional instructions", { x: 86, y: 610, size: 14, font: bold, color: rgb(1, 1, 1) });
  addLinkAnnotation(document, secondPage, "https://example.com/fictional-help", [64, 590, 314, 644]);

  await writeFile(fixturePath, await document.save({ useObjectStreams: false }));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function evidenceSlide({ eyebrow, title, lede, content, footer }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box} body{margin:0;width:1600px;height:900px;overflow:hidden;background:radial-gradient(circle at 10% 5%,#dff2e8 0,transparent 32rem),#fbfaf5;color:#17231d;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    main{width:1480px;height:780px;margin:60px;padding:58px 64px;border:1px solid #cbd8d0;border-radius:30px;background:rgba(255,255,255,.94);box-shadow:0 24px 80px rgba(31,70,52,.12)}
    .eyebrow{margin:0 0 16px;color:#1f6b4d;font-weight:800;font-size:18px;letter-spacing:.12em;text-transform:uppercase}.title{margin:0;font:500 58px/1.02 Georgia,serif;letter-spacing:-.04em}.lede{max-width:1050px;margin:18px 0 30px;color:#637068;font-size:23px;line-height:1.5}
    .content{height:430px;overflow:hidden;border:1px solid #dfe4df;border-radius:18px;background:#f7f9f7;padding:26px 30px}.content pre{margin:0;white-space:pre-wrap;font:17px/1.48 ui-monospace,SFMono-Regular,Menlo,monospace;color:#23352c}.content ul{display:grid;grid-template-columns:1fr 1fr;gap:18px 26px;margin:0;padding:0;list-style:none}.content li{padding:22px 24px;border:1px solid #d9e3dc;border-radius:14px;background:white;font-size:21px;font-weight:700}.content small{display:block;margin-top:7px;color:#637068;font-size:15px;font-weight:500;overflow-wrap:anywhere}
    footer{display:flex;justify-content:space-between;gap:30px;margin-top:22px;color:#637068;font-size:16px}.badge{color:#1f6b4d;font-weight:800}
  </style></head><body><main><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1 class="title">${escapeHtml(title)}</h1><p class="lede">${escapeHtml(lede)}</p><section class="content">${content}</section><footer><span class="badge">LOCAL-ONLY · VERSION 1.0.0</span><span>${escapeHtml(footer)}</span></footer></main></body></html>`;
}

async function saveDownload(page, buttonName, destination) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: buttonName }).click();
  const download = await pending;
  await download.saveAs(fileURLToPath(destination));
}

async function normalizeTextFile(destination) {
  const text = await readFile(destination, "utf8");
  await writeFile(destination, text.replace(/\r\n?/g, "\n").replace(/\n*$/, "\n"));
}

await createFixturePdf();
const browser = await chromium.launch({ executablePath: chromeExecutable, headless: true });
const context = await browser.newContext({
  acceptDownloads: true,
  serviceWorkers: "block",
  timezoneId: "UTC",
  viewport: { width: 1600, height: 900 },
});
await context.addInitScript((timestamp) => {
  const NativeDate = Date;
  const fixed = new NativeDate(timestamp).valueOf();
  Date = class extends NativeDate {
    constructor(...args) { super(...(args.length ? args : [fixed])); }
    static now() { return fixed; }
  };
}, fixedTime);
await context.route(/https?:\/\//, (route) => route.abort("blockedbyclient"));

try {
  const page = await context.newPage();
  await page.goto(appUrl, { waitUntil: "load" });
  await page.screenshot({ path: fileURLToPath(new URL("gumroad-workflow.png", marketingDirectory)) });

  await page.locator('input[type="file"]').setInputFiles(fixturePath);
  await page.waitForFunction(
    () => window.__TEMPLATE_DELIVERY_PDF_CHECKER__?.audit?.rows?.length === 3,
    null,
    { timeout: 20_000 },
  );
  await page.evaluate(() => {
    const workspace = document.querySelector("#workspace");
    window.scrollTo(0, Math.max(0, workspace.offsetTop - 18));
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: fileURLToPath(new URL("gumroad-results.png", marketingDirectory)) });

  await saveDownload(page, "Export Markdown", new URL("sample-report.md", marketingDirectory));
  await saveDownload(page, "Export CSV", new URL("sample-report.csv", marketingDirectory));
  await normalizeTextFile(new URL("sample-report.csv", marketingDirectory));

  const markdown = await readFile(new URL("sample-report.md", marketingDirectory), "utf8");
  const reportPage = await context.newPage();
  await reportPage.setContent(
    evidenceSlide({
      eyebrow: "Real exported evidence",
      title: "A report you can keep with the release.",
      lede: "This preview is rendered from the exact Markdown report exported by the delivered application.",
      content: `<pre>${escapeHtml(markdown.split("\n").slice(0, 20).join("\n"))}</pre>`,
      footer: "Sanitized deterministic sample · no customer data",
    }),
  );
  await reportPage.screenshot({ path: fileURLToPath(new URL("gumroad-report-preview.png", marketingDirectory)) });

  const releaseBytes = await readFile(releasePath);
  const entries = Object.keys(unzipSync(new Uint8Array(releaseBytes))).sort();
  const sha256 = createHash("sha256").update(releaseBytes).digest("hex");
  const entryMarkup = entries
    .map((entry) => `<li>${escapeHtml(entry)}<small>Included in the verified buyer ZIP</small></li>`)
    .join("");
  await reportPage.setContent(
    evidenceSlide({
      eyebrow: "Buyer delivery",
      title: "One small ZIP. No installer or account.",
      lede: `Version 1.0.0 · ${(releaseBytes.length / 1024).toFixed(1)} KB · open index.html in a current desktop browser.`,
      content: `<ul>${entryMarkup}</ul>`,
      footer: `SHA-256 ${sha256}`,
    }),
  );
  await reportPage.screenshot({ path: fileURLToPath(new URL("gumroad-contents.png", marketingDirectory)) });
} finally {
  await browser.close();
}

console.log("Generated deterministic Gumroad evidence assets for Template Delivery PDF Checker.");
