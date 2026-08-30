import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const productRoot = new URL("../", import.meta.url);
const names = ["gumroad-workflow.png", "gumroad-results.png", "gumroad-report-preview.png", "gumroad-contents.png"];

function pngDimensions(bytes) {
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

test("release-review images and sample reports are complete and sanitized", async () => {
  for (const name of names) {
    const bytes = new Uint8Array(await readFile(new URL(`marketing/${name}`, productRoot)));
    assert.deepEqual(pngDimensions(bytes), { width: 1600, height: 900 }, name);
  }
  const html = await readFile(new URL("marketing/sample-report.html", productRoot), "utf8");
  const csv = await readFile(new URL("marketing/sample-report.csv", productRoot), "utf8");
  assert.match(html, /fictional-midi-release\.zip/);
  assert.match(csv, /fictional-midi-release\.zip/);
  assert.doesNotMatch(`${html}\n${csv}`, /khiemnd777@gmail\.com|order id|customer|payment data/i);
});
