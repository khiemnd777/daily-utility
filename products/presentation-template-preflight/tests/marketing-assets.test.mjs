import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const productRoot = new URL("../", import.meta.url);
const marketingRoot = new URL("marketing/", productRoot);
const imageNames = [
  "sales-workflow.png",
  "sales-results.png",
  "sales-report-preview.png",
  "sales-contents.png",
];

function pngDimensions(bytes) {
  assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test("reviewed sales media and sample reports are deterministic and sanitized", async () => {
  for (const name of imageNames) {
    const image = await readFile(new URL(name, marketingRoot));
    assert.deepEqual(pngDimensions(image), { width: 1600, height: 900 }, name);
  }
  const [html, csv] = await Promise.all([
    readFile(new URL("sample-report.html", marketingRoot), "utf8"),
    readFile(new URL("sample-report.csv", marketingRoot), "utf8"),
  ]);
  assert.match(html, /fictional-studio-release\.pptx/i);
  assert.match(html, /missing-internal-target/);
  assert.match(csv, /external-data-relationship/);
  assert.doesNotMatch(`${html}\n${csv}`, /khiemnd|gmail|payment data|customer data/i);
});

test("all channel sources keep the shared price, version, links, and explicit boundaries", async () => {
  const [gumroad, lemon, kna] = await Promise.all([
    readFile(new URL("gumroad-listing.md", marketingRoot), "utf8"),
    readFile(new URL("lemonsqueezy-listing.md", marketingRoot), "utf8"),
    readFile(new URL("knasoftware-listing.md", marketingRoot), "utf8"),
  ]);
  for (const [name, source] of [["Gumroad", gumroad], ["Lemon Squeezy", lemon], ["KNA", kna]]) {
    assert.match(source, /\$19 USD/, name);
    assert.match(source, /1\.0\.0/, name);
    assert.match(source, /https:\/\/knasoftware\.com\/sources\/presentation-template-preflight/, name);
    assert.match(source, /not affiliated with or endorsed by Microsoft/i, name);
  }
  assert.match(gumroad, /https:\/\/khiemnd2\.gumroad\.com\/l\/presentation-template-preflight/);
  assert.match(gumroad, /66,026/);
  assert.match(gumroad, /720002d28820022b957653fb945ee772162c278b61023d3d9b5d54891266b550/);
  assert.doesNotMatch(`${gumroad}\n${lemon}`, /<FINAL_(?:BYTES|SHA256)>/);
  assert.match(lemon, /<REQUIRED_LEMONSQUEEZY_CHECKOUT_BUY_URL>/);
  assert.match(kna, /Buy Presentation Template Preflight on Gumroad/);
  assert.match(kna, /Buy Presentation Template Preflight on Lemon Squeezy/);
});
