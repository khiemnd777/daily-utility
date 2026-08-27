import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const productRoot = new URL("../", import.meta.url);
const marketingRoot = new URL("marketing/", productRoot);
const imageNames = [
  "gumroad-workflow.png",
  "gumroad-results.png",
  "gumroad-report-preview.png",
  "gumroad-contents.png",
];

function pngDimensions(bytes) {
  assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test("ships deterministic, legible Gumroad evidence assets", async () => {
  for (const name of imageNames) {
    const image = await readFile(new URL(name, marketingRoot));
    assert.deepEqual(pngDimensions(image), { width: 1600, height: 900 }, name);
  }

  const [markdown, csv, listing] = await Promise.all([
    readFile(new URL("sample-report.md", marketingRoot), "utf8"),
    readFile(new URL("sample-report.csv", marketingRoot), "utf8"),
    readFile(new URL("gumroad-listing.md", marketingRoot), "utf8"),
  ]);
  assert.match(markdown, /fictional|sample-delivery/i);
  assert.match(markdown, /Canva likely non-template/);
  assert.match(csv, /"Canva template-like"/);
  assert.doesNotMatch(`${markdown}\n${csv}`, /khiemnd|gmail|payment data|customer data/i);
  assert.match(listing, /Version 1\.0\.0 · 754\.8 KB ZIP/);
  assert.match(listing, /you will receive a full refund/);
  assert.match(listing, /raw\.githubusercontent\.com/);
});

test("preserves the published buyer ZIP bytes in the committed artifact", () => {
  const release = execFileSync(
    "git",
    [
      "show",
      "HEAD:products/template-delivery-pdf-checker/release/template-delivery-pdf-checker-v1.0.0.zip",
    ],
    { cwd: fileURLToPath(new URL("../../", productRoot)), maxBuffer: 10 * 1024 * 1024 },
  );
  assert.equal(
    createHash("sha256").update(release).digest("hex"),
    "a035efc717ff96bfed1071adae526d48fad5ffb448edbfdaa8d7584053106221",
  );
});
