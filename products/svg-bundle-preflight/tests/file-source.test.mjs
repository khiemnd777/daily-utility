import assert from "node:assert/strict";
import test from "node:test";
import { strToU8 } from "fflate";

import { PRODUCT_LIMITS } from "../src/core.js";
import {
  readDirectFiles,
  readSources,
  readZipFile,
  validateExpandedBytes,
  validateSelection,
} from "../src/file-source.js";
import { VALID_SVGS, fakeFile, zipFromMap } from "./fixtures.mjs";

test("reads nested ZIP SVGs and counts ignored non-SVG files", async () => {
  const bytes = zipFromMap(VALID_SVGS, { "README.txt": "buyer instructions" });
  const result = await readZipFile(fakeFile("release.zip", bytes));
  assert.equal(result.bundleName, "release.zip");
  assert.equal(result.entries.length, 4);
  assert.equal(result.ignoredFileCount, 1);
  assert.deepEqual(result.entries.map((entry) => entry.path), Object.keys(VALID_SVGS).sort());
});

test("rejects mixed, unsupported, missing, and over-count direct selections", () => {
  assert.throws(() => validateSelection([]), (error) => error.code === "NO_FILES");
  assert.throws(
    () => validateSelection([fakeFile("one.zip", new Uint8Array()), fakeFile("two.svg", new Uint8Array())]),
    (error) => error.code === "MIXED_SELECTION",
  );
  assert.throws(() => validateSelection([fakeFile("readme.txt", new Uint8Array())]), (error) => error.code === "UNSUPPORTED_FILE");
  assert.throws(
    () => validateSelection(Array.from({ length: PRODUCT_LIMITS.maxSelectedFiles + 1 }, (_, index) => fakeFile(`${index}.svg`, new Uint8Array()))),
    (error) => error.code === "TOO_MANY_FILES",
  );
});

test("rejects unsafe paths, invalid UTF-8, damaged archives, and bounded sizes", async () => {
  const unsafe = zipFromMap({ "../escape.svg": VALID_SVGS["letters/a.svg"] });
  await assert.rejects(() => readZipFile(fakeFile("unsafe.zip", unsafe)), (error) => error.code === "UNSAFE_PATH");
  await assert.rejects(
    () => readDirectFiles([fakeFile("invalid.svg", new Uint8Array([0xff, 0xfe, 0xfd]))]),
    (error) => error.code === "INVALID_ENCODING",
  );
  await assert.rejects(
    () => readZipFile(fakeFile("damaged.zip", strToU8("not a zip"))),
    (error) => error.code === "INVALID_ARCHIVE" && /damaged, encrypted/.test(error.message),
  );
  await assert.rejects(
    () => readDirectFiles([fakeFile("huge.svg", new Uint8Array(PRODUCT_LIMITS.maxSvgBytes + 1))]),
    (error) => error.code === "SVG_TOO_LARGE",
  );
  assert.throws(
    () => validateExpandedBytes(PRODUCT_LIMITS.maxExpandedBytes + 1),
    (error) => error.code === "EXPANDED_TOO_LARGE",
  );
  await assert.rejects(
    () => readZipFile({ name: "large.zip", size: PRODUCT_LIMITS.maxArchiveBytes + 1 }),
    (error) => error.code === "ARCHIVE_TOO_LARGE",
  );
});

test("readSources accepts direct SVG files without changing their bytes", async () => {
  const text = VALID_SVGS["animals/bird.svg"];
  const bytes = strToU8(text);
  const file = fakeFile("bird.svg", bytes);
  const result = await readSources([file]);
  assert.equal(result.entries[0].text, text);
  assert.deepEqual(result.entries[0].bytes, bytes);
});
