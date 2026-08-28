import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

import { strFromU8, unzipSync } from "fflate";

const productRoot = new URL("../", import.meta.url);
const archiveUrl = new URL("release/presentation-template-preflight-v1.0.0.zip", productRoot);

test("release ZIP contains only the hardened self-contained buyer files", async () => {
  const archive = new Uint8Array(await readFile(archiveUrl));
  const files = unzipSync(archive);
  assert.deepEqual(Object.keys(files).sort(), [
    "README.txt",
    "SUPPORT.txt",
    "THIRD_PARTY_NOTICES.txt",
    "app.js",
    "index.html",
    "styles.css",
  ]);
  const html = strFromU8(files["index.html"]);
  const app = strFromU8(files["app.js"]);
  const readme = strFromU8(files["README.txt"]);
  const notices = strFromU8(files["THIRD_PARTY_NOTICES.txt"]);
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /object-src 'none'/);
  assert.match(html, /frame-src 'none'/);
  assert.doesNotMatch(html, /script-src[^;]*'unsafe-(inline|eval)'/);
  assert.match(html, /src="\.\/app\.js"/);
  assert.doesNotMatch(app, /sourceMappingURL/);
  assert.doesNotMatch(app, /\bfetch\s*\(|XMLHttpRequest|WebSocket/);
  assert.match(readme, /100 MB/);
  assert.match(readme, /5,000 package parts/);
  assert.match(readme, /250 MB/);
  assert.match(notices, /JSZip 3\.10\.1/);
  assert.match(notices, /Saxes 6\.0\.0/);
  assert.ok((await stat(archiveUrl)).size < 2 * 1024 * 1024, "release ZIP should stay below 2 MB");
});
