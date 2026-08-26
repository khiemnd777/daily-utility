import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright-core";

const edgeExecutable = "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge";
const productRoot = new URL("../", import.meta.url);
const appUrl = pathToFileURL(new URL("dist/index.html", productRoot).pathname).href;
const fixturePath = new URL("tests/fixtures/three-links.pdf", productRoot).pathname;

await Promise.all([access(edgeExecutable), access(new URL("dist/app.js", productRoot)), access(fixturePath)]);

const browser = await chromium.launch({ executablePath: edgeExecutable, headless: true });
const context = await browser.newContext({ acceptDownloads: true, serviceWorkers: "block" });
const outboundRequests = [];
await context.route(/https?:\/\//, async (route) => {
  outboundRequests.push(route.request().url());
  await route.abort("blockedbyclient");
});
await context.setOffline(true);

const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(String(error)));

try {
  await page.goto(appUrl, { waitUntil: "load" });
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
  await page.waitForFunction(
    () => window.__TEMPLATE_DELIVERY_PDF_CHECKER__?.audit?.rows?.length === 3,
    null,
    { timeout: 15_000 },
  );

  const firstPage = await page.evaluate(() => window.__TEMPLATE_DELIVERY_PDF_CHECKER__);
  assert.equal(firstPage.audit.pageCount, 2);
  assert.equal(firstPage.audit.rows.length, 3);
  assert.equal(firstPage.audit.warningCount, 1);
  assert.deepEqual(
    firstPage.audit.rows.map((row) => row.category),
    ["canva-template", "canva-risky", "external-https"],
  );
  assert.equal(firstPage.overlayCount, 2);

  await page.getByRole("button", { name: "Preview page 2" }).click();
  await page.waitForFunction(() => document.querySelectorAll(".link-overlay").length === 1);
  assert.equal(await page.locator(".link-overlay").count(), 1);

  assert.equal(await page.getByRole("row").count(), 4);
  assert.equal(await page.getByText("Canva template-like", { exact: true }).count(), 1);
  assert.equal(await page.getByText("Canva non-template", { exact: true }).count(), 1);
  assert.equal(await page.getByText("External HTTPS", { exact: true }).count(), 1);
  assert.equal(outboundRequests.length, 0);
  assert.deepEqual(pageErrors, []);

  await page.screenshot({
    path: new URL("tests/fixtures/browser-acceptance.png", productRoot).pathname,
    fullPage: true,
  });

  console.log("Browser acceptance passed: file:// load, offline mode, 3 rows, page overlays 2/1, 0 outbound requests");
} catch (error) {
  const diagnostics = await page.evaluate(() => ({
    runtime: window.__TEMPLATE_DELIVERY_PDF_CHECKER__,
    status: document.querySelector("#status")?.textContent,
    body: document.body?.innerText.slice(0, 1200),
  }));
  console.error(JSON.stringify({ diagnostics, outboundRequests, pageErrors }, null, 2));
  throw error;
} finally {
  await browser.close();
}
