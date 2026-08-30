import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { promisify } from "node:util";

import { unzipSync } from "fflate";

const execFileAsync = promisify(execFile);
const productRoot = new URL("../", import.meta.url);
const releaseUrl = new URL("release/midi-pack-preflight-v1.0.0.zip", productRoot);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("buyer ZIP is deterministic and contains only intended runtime assets", async () => {
  const first = await readFile(releaseUrl);
  await execFileAsync(process.execPath, ["scripts/package.mjs"], { cwd: productRoot });
  const second = await readFile(releaseUrl);
  assert.equal(sha256(first), sha256(second));
  assert.deepEqual(Object.keys(unzipSync(second)).sort(), [
    "README.txt",
    "SUPPORT.txt",
    "THIRD_PARTY_NOTICES.txt",
    "app.js",
    "index.html",
    "styles.css",
  ]);
  const entries = unzipSync(second);
  const html = new TextDecoder().decode(entries["index.html"]);
  const notices = new TextDecoder().decode(entries["THIRD_PARTY_NOTICES.txt"]);
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /object-src 'none'/);
  assert.match(notices, /jszip 3\.10\.1/i);
  assert.doesNotMatch(Object.keys(entries).join("\n"), /node_modules|tests|fixtures|\.map$/);
});
