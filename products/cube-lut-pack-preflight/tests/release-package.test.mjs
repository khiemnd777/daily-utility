import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import test from "node:test";
import { strFromU8, unzipSync, zipSync } from "fflate";

const productRoot = new URL("../", import.meta.url);
const archiveUrl = new URL("release/cube-lut-pack-preflight-v1.0.0.zip", productRoot);

test("release ZIP is deterministic and contains only intended offline buyer assets", async () => {
  const archive = new Uint8Array(await readFile(archiveUrl));
  const files = unzipSync(archive);
  const expectedNames = ["README.txt", "THIRD_PARTY_NOTICES.txt", "app.js", "index.html", "styles.css"];
  assert.deepEqual(Object.keys(files).sort(), expectedNames);

  const distEntries = {};
  for (const name of (await readdir(new URL("dist/", productRoot))).sort((left, right) => left.localeCompare(right))) {
    const bytes = new Uint8Array(await readFile(new URL(`dist/${name}`, productRoot)));
    distEntries[name] = bytes;
    assert.deepEqual(files[name], bytes, `${name} in the release ZIP must match browser-tested dist bytes`);
  }
  const rebuilt = zipSync(distEntries, { level: 9, mtime: new Date("2026-08-29T00:00:00Z") });
  assert.deepEqual(archive, rebuilt, "release ZIP must be reproducible from dist with the fixed timestamp");

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
  for (const expected of ["100 MB", "150 MB", "100 .cube", "20 MB", "does not replace"]) {
    assert.ok(readme.includes(expected), expected);
  }
  assert.match(notices, /jszip 3\.10\.1/);
  assert.match(notices, /MIT OR GPL-3\.0-or-later/);
  assert.ok((await stat(archiveUrl)).size < 2 * 1024 * 1024, "release ZIP should stay below 2 MB");
});
