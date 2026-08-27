import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

import { BAD_SVGS, VALID_SVGS, zipFromMap } from "./fixtures.mjs";

const productRoot = new URL("../", import.meta.url);
const appUrl = pathToFileURL(new URL("dist/index.html", productRoot).pathname).href;
const screenshotPath = new URL("tests/fixtures/browser-acceptance.png", productRoot).pathname;
const requestedMatrix = process.env.BROWSER_MATRIX || "chrome";
const executablePath =
  requestedMatrix === "ci"
    ? chromium.executablePath()
    : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

await Promise.all([access(new URL("dist/app.js", productRoot)), access(executablePath)]);

function upload(name, bytes) {
  return { name, mimeType: "application/zip", buffer: Buffer.from(bytes) };
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

  const validZip = zipFromMap(VALID_SVGS, { "README.txt": "ignored" });
  await page.locator('input[type="file"]').setInputFiles(upload("valid-fixture.zip", validZip));
  await page.waitForFunction(
    () => window.__SVG_BUNDLE_PREFLIGHT__?.audit?.bundleName === "valid-fixture.zip",
    null,
    { timeout: 20_000 },
  );
  const validAudit = await page.evaluate(() => window.__SVG_BUNDLE_PREFLIGHT__.audit);
  assert.equal(validAudit.summary.fileCount, 4);
  assert.equal(validAudit.summary.blockerCount, 0);
  assert.equal(validAudit.ignoredFileCount, 1);
  assert.equal(await page.locator("tbody tr").count(), 4);
  assert.equal(await page.getByText("passed", { exact: true }).count(), 4);
  assert.deepEqual(consoleErrors, [], "valid scan must not violate CSP");

  const badZip = zipFromMap(BAD_SVGS);
  await page.locator('input[type="file"]').setInputFiles(upload("bad-fixture.zip", badZip));
  await page.waitForFunction(
    () => window.__SVG_BUNDLE_PREFLIGHT__?.audit?.bundleName === "bad-fixture.zip",
    null,
    { timeout: 20_000 },
  );
  const badAudit = await page.evaluate(() => window.__SVG_BUNDLE_PREFLIGHT__.audit);
  const checkIds = new Set(badAudit.results.flatMap((result) => result.findings.map((item) => item.id)));
  for (const expected of [
    "malformed-xml",
    "live-text",
    "clipping-path",
    "gradient-fill",
    "pattern-fill",
    "external-reference",
    "embedded-bitmap",
    "active-script",
    "missing-sizing-metadata",
  ]) {
    assert.ok(checkIds.has(expected), expected);
  }
  assert.equal(await page.locator("tbody img").count(), 0, "hostile file paths must render as text");
  assert.deepEqual(consoleErrors, [], "bad scan must not violate CSP");

  const csvDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const csvDownload = await csvDownloadPromise;
  assert.equal(csvDownload.suggestedFilename(), "bad-fixture-preflight-report.csv");
  const csv = await readDownload(csvDownload);
  assert.match(csv, /"bundle_name","scan_timestamp","file_total","blocker_total","warning_total"/);
  assert.match(csv, /"bad-fixture\.zip"/);
  assert.match(csv, /"live-text","blocker"/);
  assert.deepEqual(consoleErrors, [], "CSV download must not violate CSP");

  const htmlDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export HTML report" }).click();
  const htmlDownload = await htmlDownloadPromise;
  assert.equal(htmlDownload.suggestedFilename(), "bad-fixture-preflight-report.html");
  const html = await readDownload(htmlDownload);
  assert.match(html, /SVG Bundle Preflight report/);
  assert.match(html, /bad-fixture\.zip/);
  assert.match(html, /embedded-bitmap/);
  assert.doesNotMatch(html, /<img src=x onerror=alert\(1\)>/);
  assert.deepEqual(consoleErrors, [], "HTML download must not violate CSP");

  const shared = VALID_SVGS["letters/a.svg"];
  const duplicateZip = zipFromMap({
    "copies/one.svg": shared,
    "copies/two.svg": shared,
    "case/Logo.svg": VALID_SVGS["animals/bird.svg"],
    "case/logo.svg": VALID_SVGS["animals/fox.svg"],
  });
  await page.locator('input[type="file"]').setInputFiles(upload("duplicates.zip", duplicateZip));
  await page.waitForFunction(
    () => window.__SVG_BUNDLE_PREFLIGHT__?.audit?.bundleName === "duplicates.zip",
    null,
    { timeout: 20_000 },
  );
  const duplicateAudit = await page.evaluate(() => window.__SVG_BUNDLE_PREFLIGHT__.audit);
  assert.equal(duplicateAudit.duplicateGroups.length, 1);
  assert.equal(duplicateAudit.caseCollisionGroups.length, 1);

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
    name: "oversized.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
  });
  await page.waitForFunction(() => window.__SVG_BUNDLE_PREFLIGHT__?.errorCode === "SVG_TOO_LARGE");
  assert.match(await page.locator("#status").textContent(), /larger than the 2 MB/);

  console.log("Chromium: offline file:// ZIP scan, documented corpus, duplicate groups, reports, storage, limits, CSP, and XSS rendering passed");
} catch (error) {
  const diagnostics = await page.evaluate(() => ({
    runtime: window.__SVG_BUNDLE_PREFLIGHT__,
    status: document.querySelector("#status")?.textContent,
    body: document.body?.innerText.slice(0, 1600),
  }));
  console.error(JSON.stringify({ diagnostics, outboundRequests, pageErrors, consoleErrors }, null, 2));
  throw error;
} finally {
  await browser.close();
}
