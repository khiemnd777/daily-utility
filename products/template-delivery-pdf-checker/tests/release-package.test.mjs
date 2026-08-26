import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

import { strFromU8, unzipSync } from "fflate";

const productRoot = new URL("../", import.meta.url);
const archiveUrl = new URL("release/template-delivery-pdf-checker-v1.0.0.zip", productRoot);

test("release ZIP is self-contained, bounded, and contains the hardened build", async () => {
  const archive = new Uint8Array(await readFile(archiveUrl));
  const files = unzipSync(archive);
  assert.deepEqual(Object.keys(files).sort(), [
    "README.txt",
    "THIRD_PARTY_NOTICES.txt",
    "app.js",
    "index.html",
    "styles.css",
  ]);

  const html = strFromU8(files["index.html"]);
  const app = strFromU8(files["app.js"]);
  const readme = strFromU8(files["README.txt"]);
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /object-src 'none'/);
  assert.match(html, /script-src 'self' data:/);
  assert.doesNotMatch(html, /script-src[^;]*'unsafe-(inline|eval)'/);
  assert.match(html, /src="\.\/app\.js"/);
  assert.match(html, /href="\.\/styles\.css"/);
  assert.match(app, /isEvalSupported:!1/);
  assert.doesNotMatch(app, /sourceMappingURL/);
  assert.match(readme, /25 MB/);
  assert.match(readme, /200 pages/);
  assert.match(readme, /2,000 clickable links/);
  assert.ok((await stat(archiveUrl)).size < 10 * 1024 * 1024, "release ZIP should stay below 10 MB");
});
