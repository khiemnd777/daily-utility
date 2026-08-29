import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

import { CLEAN_LUTS, MALFORMED_LUTS, cube1d, cube3d, zipFromMap } from "./fixtures.mjs";

const productRoot = new URL("../", import.meta.url);
const appUrl = pathToFileURL(new URL("dist/index.html", productRoot).pathname).href;
const screenshotPath = new URL("tests/fixtures/browser-acceptance.png", productRoot).pathname;
const requestedMatrix = process.env.BROWSER_MATRIX || "chrome";
const executablePath =
  requestedMatrix === "ci"
    ? chromium.executablePath()
    : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

await Promise.all([access(new URL("dist/app.js", productRoot)), access(executablePath)]);

function upload(name, bytes, mimeType = "application/zip") {
  return { name, mimeType, buffer: Buffer.from(bytes) };
}

async function readDownload(download) {
  const path = await download.path();
  assert.ok(path, `${download.suggestedFilename()} should have a local path`);
  return readFile(path, "utf8");
}

const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({ acceptDownloads: true, serviceWorkers: "block" });
const outboundRequests = [];
await context.route(/https?:\/\//, async (route) => {
  outboundRequests.push(route.request().url());
  await route.abort("blockedbyclient");
});
const page = await context.newPage();
const pageErrors = [];
const consoleErrors = [];
page.on("pageerror", (error) => pageErrors.push(String(error)));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push({ text: message.text(), location: message.location() });
});

try {
  await page.goto(appUrl, { waitUntil: "load" });
  await context.setOffline(true);
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
  assert.match(csp, /connect-src 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.deepEqual(consoleErrors, [], "page load must not violate CSP");

  const cleanZip = zipFromMap({
    "looks/warm.cube": cube3d(2, { title: "Warm", mapper: (r, g, b) => [r, g * 0.95, b * 0.9] }),
    "looks/cool.cube": cube3d(2, { title: "Cool", mapper: (r, g, b) => [r * 0.9, g * 0.95, b] }),
  });
  await page.locator('input[type="file"]').setInputFiles(upload("clean-fixture.zip", cleanZip));
  await page.waitForFunction(
    () => window.__CUBE_LUT_PACK_PREFLIGHT__?.audit?.releaseName === "clean-fixture.zip",
    null,
    { timeout: 20_000 },
  );
  const cleanAudit = await page.evaluate(() => window.__CUBE_LUT_PACK_PREFLIGHT__.audit);
  assert.equal(cleanAudit.summary.fileCount, 2);
  assert.equal(cleanAudit.summary.blockerCount, 0);
  assert.equal(cleanAudit.summary.reviewCount, 0);
  assert.equal(await page.locator("tbody tr").count(), 2);
  assert.equal(await page.getByText("passed", { exact: true }).count(), 2);

  const malformedZip = zipFromMap(MALFORMED_LUTS);
  await page.locator('input[type="file"]').setInputFiles(upload("malformed-fixture.zip", malformedZip));
  await page.waitForFunction(
    () => window.__CUBE_LUT_PACK_PREFLIGHT__?.audit?.releaseName === "malformed-fixture.zip",
    null,
    { timeout: 20_000 },
  );
  const malformedAudit = await page.evaluate(() => window.__CUBE_LUT_PACK_PREFLIGHT__.audit);
  const checkIds = new Set(malformedAudit.results.flatMap((result) => result.findings.map((item) => item.id)));
  for (const expected of [
    "missing-size-declaration",
    "repeated-keyword",
    "keyword-after-table-data",
    "invalid-numeric-triplet",
    "number-out-of-spec",
    "invalid-domain",
    "short-table-data",
    "extra-table-data",
  ]) {
    assert.ok(checkIds.has(expected), expected);
  }

  const csvDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const csvDownload = await csvDownloadPromise;
  assert.equal(csvDownload.suggestedFilename(), "malformed-fixture-preflight-report.csv");
  const csv = await readDownload(csvDownload);
  assert.match(csv, /"release_name","scan_timestamp","lut_file_total","lut_byte_total","blocker_total","review_total"/);
  assert.match(csv, /"malformed-fixture\.zip"/);
  assert.match(csv, /"invalid-numeric-triplet","blocker"/);

  const htmlDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export HTML report" }).click();
  const htmlDownload = await htmlDownloadPromise;
  assert.equal(htmlDownload.suggestedFilename(), "malformed-fixture-preflight-report.html");
  const html = await readDownload(htmlDownload);
  assert.match(html, /CUBE LUT Pack Preflight report/);
  assert.match(html, /malformed-fixture\.zip/);
  assert.match(html, /number-out-of-spec/);
  assert.deepEqual(consoleErrors, [], "report downloads must not violate CSP");

  const exact = cube1d(3, { title: "Exact" });
  const duplicateZip = zipFromMap({
    "exact/a.cube": exact,
    "exact/b.cube": exact,
    "equivalent/one.cube": cube3d(2, { title: "Equivalent A", comments: ["# first"] }),
    "equivalent/two.cube": cube3d(2, { title: "Equivalent B", comments: ["# second"] }),
    "case/Look.cube": cube1d(4, { title: "Case A" }),
    "case/look.cube": cube1d(5, { title: "Case B" }),
    "README.txt": "intentional buyer guide",
    "<img src=x onerror=alert(1)>.txt": "hostile path fixture",
  });
  await page.locator('input[type="file"]').setInputFiles(upload("duplicates.zip", duplicateZip));
  await page.waitForFunction(
    () => window.__CUBE_LUT_PACK_PREFLIGHT__?.audit?.releaseName === "duplicates.zip",
    null,
    { timeout: 20_000 },
  );
  const duplicateAudit = await page.evaluate(() => window.__CUBE_LUT_PACK_PREFLIGHT__.audit);
  assert.equal(duplicateAudit.exactDuplicateGroups.length, 1);
  assert.equal(duplicateAudit.equivalentPayloadGroups.length, 1);
  assert.equal(duplicateAudit.caseCollisionGroups.length, 1);
  assert.equal(duplicateAudit.summary.nonCubeFileCount, 2);
  assert.equal(await page.locator("tbody img").count(), 0, "hostile release paths must render as text");

  const storage = await page.evaluate(async () => ({
    localStorage: localStorage.length,
    sessionStorage: sessionStorage.length,
    databases: typeof indexedDB.databases === "function" ? (await indexedDB.databases()).length : 0,
  }));
  assert.deepEqual(storage, { localStorage: 0, sessionStorage: 0, databases: 0 });
  assert.equal(outboundRequests.length, 0);
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(consoleErrors, []);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  await page.locator('input[type="file"]').setInputFiles({
    name: "oversized.cube",
    mimeType: "text/plain",
    buffer: Buffer.alloc(20 * 1024 * 1024 + 1),
  });
  await page.waitForFunction(() => window.__CUBE_LUT_PACK_PREFLIGHT__?.errorCode === "LUT_TOO_LARGE");
  assert.match(await page.locator("#status").textContent(), /larger than the 20 MB/);

  const directSource = new TextEncoder().encode(CLEAN_LUTS["looks/identity-1d.cube"]);
  await page.locator('input[type="file"]').setInputFiles(upload("identity.cube", directSource, "text/plain"));
  await page.waitForFunction(
    () => window.__CUBE_LUT_PACK_PREFLIGHT__?.audit?.releaseName === "identity.cube",
    null,
    { timeout: 20_000 },
  );
  assert.equal((await page.evaluate(() => window.__CUBE_LUT_PACK_PREFLIGHT__.audit.summary.blockerCount)), 0);

  console.log("Chromium: offline file:// ZIP/direct scans, Cube rules, duplicate groups, reports, limits, storage, CSP, and XSS rendering passed");
} catch (error) {
  const diagnostics = await page.evaluate(() => ({
    runtime: window.__CUBE_LUT_PACK_PREFLIGHT__,
    status: document.querySelector("#status")?.textContent,
    body: document.body?.innerText.slice(0, 1800),
  }));
  console.error(JSON.stringify({ diagnostics, outboundRequests, pageErrors, consoleErrors }, null, 2));
  throw error;
} finally {
  await browser.close();
}
