import assert from "node:assert/strict";
import test from "node:test";

import { PRODUCT_LIMITS } from "../src/core.js";
import { readDirectFiles, readSources, readZipFile, SourceError, validateExpandedBytes, validateSelection } from "../src/file-source.js";
import { cleanPreset, fileLike, zipFromMap } from "./fixtures.mjs";

function code(error) {
  return error instanceof SourceError ? error.code : null;
}

test("reads direct XMP files and one mixed-content ZIP", async () => {
  const direct = await readDirectFiles([
    fileLike("portrait.xmp", cleanPreset()),
    fileLike("landscape.XMP", cleanPreset()),
  ]);
  assert.equal(direct.releaseName, "2-xmp-selection");
  assert.equal(direct.entries.length, 2);

  const archive = fileLike("fictional.zip", zipFromMap({
    "Presets/portrait.xmp": cleanPreset(),
    "README.txt": new TextEncoder().encode("fictional instructions"),
  }));
  const zipped = await readZipFile(archive);
  assert.deepEqual(zipped.entries.map((item) => item.path), ["Presets/portrait.xmp"]);
  assert.deepEqual(zipped.otherPaths, ["README.txt"]);
});

test("selection failures use stable error codes", async () => {
  assert.throws(() => validateSelection([]), (error) => code(error) === "NO_FILES");
  assert.throws(
    () => validateSelection([fileLike("a.zip", new Uint8Array()), fileLike("a.xmp", cleanPreset())]),
    (error) => code(error) === "MIXED_SELECTION",
  );
  assert.throws(
    () => validateSelection([fileLike("notes.txt", new Uint8Array())]),
    (error) => code(error) === "UNSUPPORTED_FILE",
  );
  assert.throws(
    () => validateSelection(Array.from({ length: PRODUCT_LIMITS.maxSelectedFiles + 1 }, (_, index) => fileLike(`${index}.xmp`, cleanPreset()))),
    (error) => code(error) === "TOO_MANY_FILES",
  );
  assert.throws(
    () => validateExpandedBytes(PRODUCT_LIMITS.maxExpandedBytes + 1),
    (error) => code(error) === "EXPANDED_TOO_LARGE",
  );
});

test("rejects oversized inputs, unsafe paths, corrupt ZIPs, and ZIPs without XMP", async () => {
  await assert.rejects(
    () => readDirectFiles([fileLike("huge.xmp", new Uint8Array(1), { size: PRODUCT_LIMITS.maxXmpBytes + 1 })]),
    (error) => code(error) === "XMP_TOO_LARGE",
  );
  await assert.rejects(
    () => readDirectFiles([fileLike("x".repeat(PRODUCT_LIMITS.maxPathLength) + ".xmp", cleanPreset())]),
    (error) => code(error) === "UNSAFE_PATH",
  );
  await assert.rejects(
    () => readZipFile(fileLike("huge.zip", new Uint8Array(1), { size: PRODUCT_LIMITS.maxArchiveBytes + 1 })),
    (error) => code(error) === "ARCHIVE_TOO_LARGE",
  );
  await assert.rejects(
    () => readZipFile(fileLike("corrupt.zip", new TextEncoder().encode("not a zip"))),
    (error) => code(error) === "INVALID_ARCHIVE",
  );
  await assert.rejects(
    () => readZipFile(fileLike("no-xmp.zip", zipFromMap({ "README.txt": new TextEncoder().encode("hello") }))),
    (error) => code(error) === "NO_XMP_FILES",
  );
  await assert.rejects(
    () => readZipFile(fileLike("unsafe.zip", zipFromMap({ "../escape.xmp": cleanPreset() }))),
    (error) => code(error) === "UNSAFE_PATH",
  );
});

test("rejects over-count ZIPs before expanding file payloads", async () => {
  const tooManyXmp = Object.fromEntries(
    Array.from({ length: PRODUCT_LIMITS.maxXmpFiles + 1 }, (_, index) => [`presets/${index}.xmp`, cleanPreset()]),
  );
  await assert.rejects(
    () => readZipFile(fileLike("too-many-xmp.zip", zipFromMap(tooManyXmp))),
    (error) => code(error) === "TOO_MANY_XMP_FILES",
  );

  const tooManyEntries = Object.fromEntries(
    Array.from({ length: PRODUCT_LIMITS.maxArchiveEntries + 1 }, (_, index) => [`inventory/${index}.txt`, new Uint8Array()]),
  );
  await assert.rejects(
    () => readZipFile(fileLike("too-many-entries.zip", zipFromMap(tooManyEntries))),
    (error) => code(error) === "TOO_MANY_ARCHIVE_ENTRIES",
  );
});

test("readSources routes direct and ZIP selections", async () => {
  const direct = await readSources([fileLike("one.xmp", cleanPreset())]);
  const zipped = await readSources([fileLike("one.zip", zipFromMap({ "one.xmp": cleanPreset() }))]);
  assert.equal(direct.releaseName, "one.xmp");
  assert.equal(zipped.releaseName, "one.zip");
});
