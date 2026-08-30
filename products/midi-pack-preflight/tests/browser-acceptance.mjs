import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright-core";

import { cleanFormat0, cleanFormat1, distinctPerformance, MALFORMED_MIDI, zipFromMap } from "./fixtures.mjs";

const productRoot = new URL("../", import.meta.url);
const appUrl = pathToFileURL(new URL("dist/index.html", productRoot).pathname).href;
const screenshotPath = new URL("tests/fixtures/browser-acceptance.png", productRoot).pathname;
const requestedMatrix = process.env.BROWSER_MATRIX || "chrome";
const executablePath = requestedMatrix === "ci"
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
    "clips/lead.mid": cleanFormat0(),
    "clips/bass.midi": cleanFormat1(),
  });
  await page.locator('input[type="file"]').setInputFiles(upload("clean-midi-release.zip", cleanZip));
  await page.waitForFunction(
    () => window.__MIDI_PACK_PREFLIGHT__?.audit?.releaseName === "clean-midi-release.zip",
    null,
    { timeout: 20_000 },
  );
  const cleanAudit = await page.evaluate(() => window.__MIDI_PACK_PREFLIGHT__.audit);
  assert.equal(cleanAudit.summary.midiFileCount, 2);
  assert.equal(cleanAudit.summary.blockerCount, 0);
  assert.equal(cleanAudit.summary.reviewCount, 0);
  assert.equal(await page.locator("tbody tr").count(), 2);
  assert.equal(await page.getByText("passed", { exact: true }).count(), 2);

  const malformedZip = zipFromMap(MALFORMED_MIDI);
  await page.locator('input[type="file"]').setInputFiles(upload("malformed-midi-release.zip", malformedZip));
  await page.waitForFunction(
    () => window.__MIDI_PACK_PREFLIGHT__?.audit?.releaseName === "malformed-midi-release.zip",
    null,
    { timeout: 20_000 },
  );
  const malformedAudit = await page.evaluate(() => window.__MIDI_PACK_PREFLIGHT__.audit);
  const checkIds = new Set(malformedAudit.results.flatMap((result) => result.findings.map((item) => item.id)));
  for (const expected of [
    "invalid-header-id", "invalid-header-length", "invalid-format", "format-zero-track-count",
    "track-count-mismatch", "truncated-track-chunk", "overlong-variable-length", "illegal-running-status",
    "invalid-data-byte", "truncated-meta-event", "truncated-system-event", "missing-end-of-track",
  ]) assert.ok(checkIds.has(expected), expected);

  const csvDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const csvDownload = await csvDownloadPromise;
  assert.equal(csvDownload.suggestedFilename(), "malformed-midi-release-preflight-report.csv");
  const csv = await readDownload(csvDownload);
  assert.match(csv, /"release_name","scan_timestamp","configured_limits"/);
  assert.match(csv, /"invalid-data-byte","blocker"/);

  const htmlDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export HTML report" }).click();
  const htmlDownload = await htmlDownloadPromise;
  assert.equal(htmlDownload.suggestedFilename(), "malformed-midi-release-preflight-report.html");
  const html = await readDownload(htmlDownload);
  assert.match(html, /MIDI Pack Preflight report/);
  assert.match(html, /truncated-system-event/);

  const exact = cleanFormat0("Exact bytes");
  const bundleZip = zipFromMap({
    "exact/a.mid": exact,
    "exact/b.mid": exact,
    "performance/one.mid": cleanFormat0("One label"),
    "performance/two.mid": cleanFormat0("Another label"),
    "Case/Clip.mid": cleanFormat0("Upper"),
    "case/clip.mid": distinctPerformance(),
    "README.txt": "Fictional buyer guide.",
    "extras/nested.zip": Uint8Array.from([1, 2, 3]),
    "<img src=x onerror=alert(1)>.txt": "hostile path fixture",
  });
  await page.locator('input[type="file"]').setInputFiles(upload("bundle-hygiene.zip", bundleZip));
  await page.waitForFunction(
    () => window.__MIDI_PACK_PREFLIGHT__?.audit?.releaseName === "bundle-hygiene.zip",
    null,
    { timeout: 20_000 },
  );
  const bundleAudit = await page.evaluate(() => window.__MIDI_PACK_PREFLIGHT__.audit);
  assert.equal(bundleAudit.exactDuplicateGroups.length, 1);
  assert.ok(bundleAudit.performanceDuplicateGroups.length >= 1);
  assert.equal(bundleAudit.caseCollisionGroups.length, 1);
  assert.equal(bundleAudit.summary.nonMidiFileCount, 3);
  assert.equal(await page.locator("tbody img").count(), 0, "hostile paths must render as text");

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
    name: "oversized.mid",
    mimeType: "audio/midi",
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
  });
  await page.waitForFunction(() => window.__MIDI_PACK_PREFLIGHT__?.errorCode === "MIDI_TOO_LARGE");
  assert.match(await page.locator("#status").textContent(), /larger than the 10 MB/);

  await page.locator('input[type="file"]').setInputFiles(upload("single.mid", cleanFormat0(), "audio/midi"));
  await page.waitForFunction(
    () => window.__MIDI_PACK_PREFLIGHT__?.audit?.releaseName === "single.mid",
    null,
    { timeout: 20_000 },
  );
  assert.equal(await page.evaluate(() => window.__MIDI_PACK_PREFLIGHT__.audit.summary.blockerCount), 0);

  console.log("Chromium: offline file:// ZIP/direct scans, SMF rules, duplicate groups, reports, limits, storage, CSP, and XSS rendering passed");
} catch (error) {
  const diagnostics = await page.evaluate(() => ({
    runtime: window.__MIDI_PACK_PREFLIGHT__,
    status: document.querySelector("#status")?.textContent,
    body: document.body?.innerText.slice(0, 1800),
  }));
  console.error(JSON.stringify({ diagnostics, outboundRequests, pageErrors, consoleErrors }, null, 2));
  throw error;
} finally {
  await browser.close();
}
