import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

import { analyzePresentation, createCsvReport, createHtmlReport } from "../src/core.js";
import { readPresentationPackage } from "../src/package-reader.js";
import { fakeFile, relationshipRiskFixture } from "../tests/fixtures.mjs";

const productRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const marketingRoot = join(productRoot, "marketing");
const appUrl = pathToFileURL(join(productRoot, "dist", "index.html")).href;
const fixture = relationshipRiskFixture();

await mkdir(marketingRoot, { recursive: true });
const packageData = await readPresentationPackage(fakeFile("fictional-studio-release.pptx", fixture));
const audit = await analyzePresentation(packageData, { scannedAt: "2026-08-28T02:00:00.000Z" });
await Promise.all([
  writeFile(join(marketingRoot, "sample-report.csv"), createCsvReport(audit).replaceAll("\r\n", "\n"), "utf8"),
  writeFile(join(marketingRoot, "sample-report.html"), createHtmlReport(audit), "utf8"),
]);

const executablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
try {
  await page.addInitScript(() => {
    const fixedTimestamp = Date.parse("2026-08-28T02:00:00.000Z");
    const NativeDate = Date;
    globalThis.Date = class FixedDate extends NativeDate {
      constructor(...arguments_) {
        super(...(arguments_.length ? arguments_ : [fixedTimestamp]));
      }

      static now() {
        return fixedTimestamp;
      }
    };
  });
  await page.goto(appUrl, { waitUntil: "load" });
  await page.screenshot({ path: join(marketingRoot, "sales-workflow.png") });

  await page.locator('input[type="file"]').setInputFiles({
    name: "fictional-studio-release.pptx",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    buffer: Buffer.from(fixture),
  });
  await page.waitForFunction(() => window.__PRESENTATION_TEMPLATE_PREFLIGHT__?.audit?.findings?.length === 4);
  await page.locator("#results").scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(marketingRoot, "sales-results.png") });

  await page.goto("about:blank");
  await page.setContent(createHtmlReport(audit), { waitUntil: "load" });
  await page.screenshot({ path: join(marketingRoot, "sales-report-preview.png") });

  await page.goto("about:blank");
  await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
    body{margin:0;background:linear-gradient(140deg,#eef4ff,#f8fbff);font:22px/1.5 system-ui;color:#17233b}
    main{width:1240px;margin:80px auto}.eyebrow{color:#2e65b7;font-size:16px;font-weight:800;letter-spacing:.15em;text-transform:uppercase}
    h1{font:700 64px/1.05 Georgia,serif;margin:12px 0 30px}.grid{display:grid;grid-template-columns:1.15fr .85fr;gap:28px}
    section{background:white;border:1px solid #cfdaea;border-radius:20px;padding:30px 34px;box-shadow:0 20px 50px #17376b17}
    h2{font:700 30px Georgia,serif;margin:0 0 16px}ul{margin:0;padding-left:28px}li{margin:10px 0}.tag{display:inline-block;background:#e9f1ff;color:#17376b;border-radius:999px;padding:7px 12px;margin:6px 6px 0 0;font-size:17px;font-weight:700}
  </style></head><body><main><p class="eyebrow">What buyers receive</p><h1>One offline release checker. Two evidence reports.</h1><div class="grid"><section><h2>Inside the ZIP</h2><ul><li>Offline browser utility</li><li>CSV findings export</li><li>Self-contained HTML report</li><li>Plain-English buyer guide</li><li>Support and third-party notices</li></ul></section><section><h2>Release boundaries</h2><span class="tag">.pptx + .potx</span><span class="tag">100 MB limit</span><span class="tag">No upload</span><span class="tag">No repair</span><span class="tag">No account</span><span class="tag">Version 1.0.0</span></section></div></main></body></html>`, { waitUntil: "load" });
  await page.screenshot({ path: join(marketingRoot, "sales-contents.png") });
} finally {
  await browser.close();
}

console.log(`Generated reviewed marketing assets in ${marketingRoot}`);
