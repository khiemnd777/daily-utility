import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import { chromium, firefox, webkit } from "playwright-core";

const productRoot = new URL("../", import.meta.url);
const appUrl = pathToFileURL(new URL("dist/index.html", productRoot).pathname).href;
const fixturePath = new URL("tests/fixtures/three-links.pdf", productRoot).pathname;
const tooManyPagesPath = new URL("tests/fixtures/too-many-pages.pdf", productRoot).pathname;
const cancelScanPath = new URL("tests/fixtures/cancel-scan.pdf", productRoot).pathname;
const chromeExportPath = new URL("tests/fixtures/chrome-print-export.pdf", productRoot).pathname;
const screenshotPath = new URL("tests/fixtures/browser-acceptance.png", productRoot).pathname;
const requestedMatrix = process.env.BROWSER_MATRIX || "full";
const isCiMatrix = requestedMatrix === "ci";

const allProfiles = isCiMatrix
  ? [{ name: "Chromium", type: chromium, executablePath: chromium.executablePath() }]
  : [
      {
        name: "Google Chrome",
        type: chromium,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      {
        name: "Microsoft Edge",
        type: chromium,
        executablePath: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      },
      { name: "Firefox", type: firefox, executablePath: firefox.executablePath() },
      { name: "WebKit", type: webkit, executablePath: webkit.executablePath() },
    ];
const singleProfileNames = {
  chrome: "Google Chrome",
  edge: "Microsoft Edge",
  firefox: "Firefox",
  webkit: "WebKit",
};
const profiles = singleProfileNames[requestedMatrix]
  ? allProfiles.filter((profile) => profile.name === singleProfileNames[requestedMatrix])
  : allProfiles;

await Promise.all([
  access(new URL("dist/app.js", productRoot)),
  access(fixturePath),
  access(tooManyPagesPath),
  access(cancelScanPath),
  ...profiles.map((profile) => access(profile.executablePath)),
]);

async function readDownload(download) {
  const path = await download.path();
  assert.ok(path, `${download.suggestedFilename()} should have a local path`);
  return readFile(path, "utf8");
}

async function runProfile(profile, index) {
  const browser = await profile.type.launch({ executablePath: profile.executablePath, headless: true });
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
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  try {
    if (index === 0 && profile.type === chromium) {
      await page.setContent(`<!doctype html><html><body>
        <h1>Template delivery</h1>
        <a href="https://www.canva.com/design/CHROME01/view?mode=preview">Open template</a>
        <a href="https://example.com/instructions">Read instructions</a>
      </body></html>`);
      await page.pdf({ path: chromeExportPath, format: "A4", tagged: true });
    }
    await page.goto(appUrl, { waitUntil: "load" });
    // Playwright WebKit cannot read a user-selected local File while its context is
    // force-offline. CSP plus the aborting route still guarantees zero network I/O.
    if (profile.name !== "WebKit") await context.setOffline(true);
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
    assert.match(csp, /connect-src 'none'/);
    assert.match(csp, /object-src 'none'/);

    await page.locator('input[type="file"]').setInputFiles(fixturePath);
    await page.waitForFunction(
      () => window.__TEMPLATE_DELIVERY_PDF_CHECKER__?.audit?.rows?.length === 3,
      null,
      { timeout: 20_000 },
    );

    const firstPage = await page.evaluate(() => window.__TEMPLATE_DELIVERY_PDF_CHECKER__);
    assert.equal(firstPage.audit.pageCount, 2);
    assert.equal(firstPage.audit.rows.length, 3);
    assert.equal(firstPage.audit.warningCount, 1);
    assert.deepEqual(
      firstPage.audit.rows.map((row) => row.category),
      ["canva-template", "canva-risky", "external-https"],
    );
    assert.deepEqual(firstPage.limits, {
      maxFileBytes: 25 * 1024 * 1024,
      maxPages: 200,
      maxLinks: 2000,
    });
    assert.equal(firstPage.overlayCount, 2);

    await page.getByRole("button", { name: "Preview page 2" }).click();
    await page.waitForFunction(() => document.querySelectorAll(".link-overlay").length === 1);
    assert.equal(await page.locator(".link-overlay").count(), 1);

    assert.equal(await page.getByRole("row").count(), 4);
    assert.equal(await page.getByText("Canva template-like", { exact: true }).count(), 1);
    assert.equal(await page.getByText("Canva likely non-template", { exact: true }).count(), 1);
    assert.equal(await page.getByText("External HTTPS", { exact: true }).count(), 1);

    const markdownDownloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export Markdown" }).click();
    const markdownDownload = await markdownDownloadPromise;
    assert.equal(markdownDownload.suggestedFilename(), "three-links-qa-report.md");
    const markdown = await readDownload(markdownDownload);
    assert.match(markdown, /Pages: 2/);
    assert.match(markdown, /Clickable links: 3/);
    assert.match(markdown, /Canva likely non-template/);

    const csvDownloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV" }).click();
    const csvDownload = await csvDownloadPromise;
    assert.equal(csvDownload.suggestedFilename(), "three-links-qa-report.csv");
    const csv = await readDownload(csvDownload);
    assert.match(csv, /"page","category","target","warnings"/);
    assert.match(csv, /"Canva template-like"/);

    assert.equal(outboundRequests.length, 0);
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(consoleErrors, []);

    if (index === 0) {
      await page.screenshot({ path: screenshotPath, fullPage: true });
      await page.locator('input[type="file"]').setInputFiles(chromeExportPath);
      await page.waitForFunction(
        () => window.__TEMPLATE_DELIVERY_PDF_CHECKER__?.audit?.filename === "chrome-print-export.pdf",
        null,
        { timeout: 20_000 },
      );
      const chromeExportAudit = await page.evaluate(() => window.__TEMPLATE_DELIVERY_PDF_CHECKER__.audit);
      assert.equal(chromeExportAudit.rows.length, 2);
      assert.deepEqual(
        chromeExportAudit.rows.map((row) => row.category),
        ["canva-template", "external-https"],
      );

      await page.locator('input[type="file"]').setInputFiles(cancelScanPath);
      await page.getByRole("button", { name: "Cancel check" }).click();
      await page.waitForFunction(() => window.__TEMPLATE_DELIVERY_PDF_CHECKER__?.cancelled === true);
      assert.match(await page.locator("#status").textContent(), /Check cancelled/);
    }

    await page.locator('input[type="file"]').setInputFiles(tooManyPagesPath);
    await page.waitForFunction(
      () => window.__TEMPLATE_DELIVERY_PDF_CHECKER__?.errorCode === "TOO_MANY_PAGES",
      null,
      { timeout: 20_000 },
    );
    assert.match(await page.locator("#status").textContent(), /safe limit is 200 pages/);

    await page.locator('input[type="file"]').setInputFiles({
      name: "corrupt.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7\ncorrupt"),
    });
    await page.waitForFunction(
      () => window.__TEMPLATE_DELIVERY_PDF_CHECKER__?.errorCode === "InvalidPDFException",
      null,
      { timeout: 20_000 },
    );
    assert.match(await page.locator("#status").textContent(), /damaged|valid PDF/);

    if (index === 0) {
      await page.locator('input[type="file"]').setInputFiles({
        name: "oversized.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.alloc(25 * 1024 * 1024 + 1),
      });
      await page.waitForFunction(() => document.querySelector("#status")?.textContent.includes("larger than 25 MB"));
    }

    console.log(
      `${profile.name}: network-isolated file:// parse, CSP, overlays, downloads, cancellation, limits, and corrupt-PDF handling passed`,
    );
  } catch (error) {
    const diagnostics = await page.evaluate(() => ({
      runtime: {
        processing: window.__TEMPLATE_DELIVERY_PDF_CHECKER__?.processing,
        cancelled: window.__TEMPLATE_DELIVERY_PDF_CHECKER__?.cancelled,
        error: window.__TEMPLATE_DELIVERY_PDF_CHECKER__?.error,
        errorCode: window.__TEMPLATE_DELIVERY_PDF_CHECKER__?.errorCode,
        filename: window.__TEMPLATE_DELIVERY_PDF_CHECKER__?.audit?.filename,
        rows: window.__TEMPLATE_DELIVERY_PDF_CHECKER__?.audit?.rows?.length,
      },
      status: document.querySelector("#status")?.textContent,
      body: document.body?.innerText.slice(0, 1200),
    }));
    console.error(
      JSON.stringify({ profile: profile.name, diagnostics, outboundRequests, pageErrors, consoleErrors }, null, 2),
    );
    throw error;
  } finally {
    await browser.close();
  }
}

for (const [index, profile] of profiles.entries()) {
  await runProfile(profile, index);
}

console.log(`Browser acceptance passed for ${profiles.map((profile) => profile.name).join(", ")}`);
