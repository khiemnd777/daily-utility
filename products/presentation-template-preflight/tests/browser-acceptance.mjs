import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

import { relationshipRiskFixture } from "./fixtures.mjs";

const productRoot = new URL("../", import.meta.url);
const appUrl = pathToFileURL(new URL("dist/index.html", productRoot).pathname).href;
const screenshotPath = join(tmpdir(), "presentation-template-preflight-browser-acceptance.png");
const requestedMatrix = process.env.BROWSER_MATRIX || "chrome";
const executablePath = requestedMatrix === "ci"
  ? chromium.executablePath()
  : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

await Promise.all([access(new URL("dist/app.js", productRoot)), access(executablePath)]);

async function readDownload(download) {
  const path = await download.path();
  assert.ok(path, `${download.suggestedFilename()} should have a local path`);
  return readFile(path, "utf8");
}

const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({ acceptDownloads: true, serviceWorkers: "block", viewport: { width: 1600, height: 900 } });
const outboundRequests = [];
await context.route(/https?:\/\//, async (route) => {
  outboundRequests.push(route.request().url());
  await route.abort("blockedbyclient");
});
await context.setOffline(true);
const page = await context.newPage();
const pageErrors = [];
const consoleErrors = [];
page.on("pageerror", (error) => pageErrors.push(String(error)));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

try {
  await page.goto(appUrl, { waitUntil: "load" });
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
  assert.match(csp, /connect-src 'none'/);
  assert.match(csp, /object-src 'none'/);
  await page.locator('input[type="file"]').setInputFiles({
    name: "relationship-risks.pptx",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    buffer: Buffer.from(relationshipRiskFixture()),
  });
  await page.waitForFunction(
    () => window.__PRESENTATION_TEMPLATE_PREFLIGHT__?.audit?.findings?.length >= 4,
    null,
    { timeout: 20_000 },
  );
  const runtime = await page.evaluate(() => window.__PRESENTATION_TEMPLATE_PREFLIGHT__);
  assert.equal(runtime.audit.inventory.slideCount, 1);
  assert.equal(runtime.audit.inventory.layoutCount, 1);
  assert.equal(runtime.audit.inventory.masterCount, 1);
  assert.equal(runtime.audit.inventory.dimensions.aspectRatio, "16:9");
  assert.ok(runtime.audit.findings.some((item) => item.id === "missing-internal-target"));
  assert.ok(runtime.audit.findings.some((item) => item.id === "external-data-relationship"));
  assert.deepEqual(runtime.limits, {
    maxFileBytes: 100 * 1024 * 1024,
    maxEntries: 5000,
    maxExpandedBytes: 250 * 1024 * 1024,
    maxXmlPartBytes: 5 * 1024 * 1024,
    maxPathLength: 260,
  });

  const csvPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const csvDownload = await csvPromise;
  assert.equal(csvDownload.suggestedFilename(), "relationship-risks-preflight-report.csv");
  const csv = await readDownload(csvDownload);
  assert.match(csv, /missing-internal-target/);
  assert.match(csv, /external-data-relationship/);

  const htmlPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export HTML report" }).click();
  const htmlDownload = await htmlPromise;
  assert.equal(htmlDownload.suggestedFilename(), "relationship-risks-preflight-report.html");
  const html = await readDownload(htmlDownload);
  assert.match(html, /default-src 'none'/);
  assert.match(html, /relationship-risks\.pptx/);

  assert.equal(outboundRequests.length, 0);
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(consoleErrors, []);
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage)), []);
  assert.deepEqual(await page.evaluate(() => Object.keys(sessionStorage)), []);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  await page.locator('input[type="file"]').setInputFiles({
    name: "corrupt.pptx",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    buffer: Buffer.from("not a zip"),
  });
  await page.waitForFunction(() => window.__PRESENTATION_TEMPLATE_PREFLIGHT__?.errorCode === "INVALID_PACKAGE");
  assert.match(await page.locator("#status").textContent(), /damaged, encrypted, or not a readable/);
  console.log(`Chromium: offline file:// scan, reports, CSP, storage, limits, and safe failures passed; screenshot ${screenshotPath}`);
} finally {
  await browser.close();
}
