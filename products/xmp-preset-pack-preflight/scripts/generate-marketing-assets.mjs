import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

import { chromium } from "playwright-core";
import { unzipSync } from "fflate";

import { cleanPreset, distinctPreset, makeXmp, zipFromMap } from "../tests/fixtures.mjs";

const productRoot = new URL("../", import.meta.url);
const marketingDirectory = new URL("marketing/", productRoot);
const workDirectory = new URL(".work/marketing/", productRoot);
const fixturePath = fileURLToPath(new URL("fictional-xmp-release.zip", workDirectory));
const appUrl = pathToFileURL(fileURLToPath(new URL("dist/index.html", productRoot))).href;
const releasePath = fileURLToPath(new URL("release/xmp-preset-pack-preflight-v1.0.0.zip", productRoot));
const chromeExecutable = process.env.CHROME_EXECUTABLE
  || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const fixedTime = "2026-08-31T05:00:00.000Z";

await Promise.all([
  mkdir(marketingDirectory, { recursive: true }),
  mkdir(workDirectory, { recursive: true }),
  access(new URL("dist/app.js", productRoot)),
  access(chromeExecutable),
]);

const exact = cleanPreset();
const fixture = zipFromMap({
  "Portraits/soft-portrait.xmp": cleanPreset(),
  "Landscapes/crisp-landscape.xmp": distinctPreset(),
  "Duplicates/exact.xmp": exact,
  "Duplicates/exact-copy.xmp": exact,
  "Duplicates/settings-a.xmp": makeXmp({ uuid: "FICTIONAL-A", name: "Settings A" }),
  "Duplicates/settings-b.xmp": makeXmp({ uuid: "FICTIONAL-B", name: "Settings B" }),
  "Profiles/restricted-profile.xmp": makeXmp({
    uuid: "FICTIONAL-PROFILE",
    name: "Profile Review",
    profile: "Fictional Camera Profile",
    compatibility: { SupportsMonochrome: "False" },
  }),
  "README.txt": new TextEncoder().encode("Fictional buyer instructions for deterministic marketing evidence."),
});
await writeFile(fixturePath, fixture);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function contentsSlide({ entries, size, sha256 }) {
  const cards = entries
    .map((entry) => `<li>${escapeHtml(entry)}<small>Included in the verified buyer ZIP</small></li>`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;width:1600px;height:900px;overflow:hidden;background:radial-gradient(circle at 88% 5%,#e5d8f2 0,transparent 34rem),#f7f3fb;color:#21182d;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    main{width:1480px;height:780px;margin:60px;padding:58px 64px;border:1px solid #d9ded7;border-radius:30px;background:rgba(255,255,255,.96);box-shadow:0 24px 80px rgba(31,66,55,.14)}
    .eyebrow{margin:0 0 16px;color:#7040a0;font-weight:800;font-size:18px;letter-spacing:.12em;text-transform:uppercase}h1{margin:0;font:500 58px/1.02 Georgia,serif;letter-spacing:-.04em}.lede{max-width:1100px;margin:18px 0 34px;color:#66596f;font-size:23px;line-height:1.5}
    ul{display:grid;grid-template-columns:1fr 1fr;gap:18px 26px;margin:0;padding:0;list-style:none}li{padding:24px 26px;border:1px solid #dce3de;border-radius:15px;background:#fafcfb;font-size:22px;font-weight:750}small{display:block;margin-top:7px;color:#68736e;font-size:15px;font-weight:500}
    footer{display:flex;justify-content:space-between;gap:30px;margin-top:30px;color:#66596f;font-size:16px}.badge{color:#7040a0;font-weight:800}.hash{max-width:760px;text-align:right;overflow-wrap:anywhere;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
  </style></head><body><main><p class="eyebrow">Buyer delivery</p><h1>One small ZIP. No installer or account.</h1><p class="lede">Version 1.0.0 · ${escapeHtml(size)} · unzip once and open index.html in a current desktop browser.</p><ul>${cards}</ul><footer><span class="badge">LOCAL-ONLY · VERSION 1.0.0</span><span class="hash">SHA-256 ${escapeHtml(sha256)}</span></footer></main></body></html>`;
}

async function saveDownload(page, buttonName, destination) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: buttonName }).click();
  const download = await pending;
  await download.saveAs(fileURLToPath(destination));
}

async function normalizeTextFile(destination) {
  const value = await readFile(destination, "utf8");
  await writeFile(destination, value.replace(/\r\n?/g, "\n").replace(/\n*$/, "\n"));
}

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
    () => window.__XMP_PRESET_PACK_PREFLIGHT__?.audit?.releaseName === "fictional-xmp-release.zip",
    null,
    { timeout: 20_000 },
  );
  await page.evaluate(() => {
    const results = document.querySelector("#results");
    window.scrollTo(0, Math.max(0, results.offsetTop - 18));
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: fileURLToPath(new URL("gumroad-results.png", marketingDirectory)) });

  await saveDownload(page, "Export CSV", new URL("sample-report.csv", marketingDirectory));
  await saveDownload(page, "Export HTML", new URL("sample-report.html", marketingDirectory));
  await normalizeTextFile(new URL("sample-report.csv", marketingDirectory));
  await normalizeTextFile(new URL("sample-report.html", marketingDirectory));

  const reportPage = await context.newPage();
  await reportPage.goto(pathToFileURL(fileURLToPath(new URL("sample-report.html", marketingDirectory))).href, {
    waitUntil: "load",
  });
  await reportPage.screenshot({ path: fileURLToPath(new URL("gumroad-report-preview.png", marketingDirectory)) });

  const releaseBytes = await readFile(releasePath);
  const entries = Object.keys(unzipSync(new Uint8Array(releaseBytes))).sort();
  const sha256 = createHash("sha256").update(releaseBytes).digest("hex");
  await reportPage.setContent(contentsSlide({
    entries,
    size: `${(releaseBytes.length / 1024).toFixed(1)} KB`,
    sha256,
  }));
  await reportPage.screenshot({ path: fileURLToPath(new URL("gumroad-contents.png", marketingDirectory)) });
} finally {
  await browser.close();
}

console.log("Generated deterministic buyer-facing evidence assets for XMP Preset Pack Preflight.");
