import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import { strFromU8, unzipSync } from "fflate";

const productRoot = new URL("../", import.meta.url);
const archiveUrl = new URL("release/svg-bundle-preflight-v1.0.0.zip", productRoot);

test("release ZIP contains only intended offline buyer assets", async () => {
  const archive = new Uint8Array(await readFile(archiveUrl));
  const files = unzipSync(archive);
  assert.deepEqual(Object.keys(files).sort(), [
    "README.txt",
    "THIRD_PARTY_NOTICES.txt",
    "app.js",
    "index.html",
    "styles.css",
  ]);

  for (const name of Object.keys(files)) {
    assert.deepEqual(
      files[name],
      new Uint8Array(await readFile(new URL(`dist/${name}`, productRoot))),
      `${name} in the release ZIP must match the browser-tested dist file byte for byte`,
    );
  }

  const html = strFromU8(files["index.html"]);
  const app = strFromU8(files["app.js"]);
  const readme = strFromU8(files["README.txt"]);
  const notices = strFromU8(files["THIRD_PARTY_NOTICES.txt"]);

  assert.match(html, /connect-src 'none'/);
  assert.match(html, /object-src 'none'/);
  assert.match(html, /script-src 'self'/);
  assert.doesNotMatch(html, /script-src[^;]*'unsafe-(inline|eval)'/);
  assert.match(html, /src="\.\/app\.js"/);
  assert.match(html, /href="\.\/styles\.css"/);
  assert.doesNotMatch(app, /sourceMappingURL/);
  assert.doesNotMatch(app, /https?:\/\/[^"']+\.(?:js|css)/i);
  for (const expected of ["50 MB", "100 MB", "500 SVG", "2 MB per SVG", "does not replace"] ) {
    assert.ok(readme.includes(expected), expected);
  }
  assert.match(notices, /JSZip 3\.10\.1/);
  assert.match(notices, /MIT OR GPL-3\.0-or-later/);
  assert.match(notices, /Saxes 6\.0\.0/);
  assert.match(notices, /License: ISC/);
  assert.match(notices, /xmlchars 2\.2\.0/);
  assert.ok((await stat(archiveUrl)).size < 2 * 1024 * 1024, "release ZIP should stay below 2 MB");
});
