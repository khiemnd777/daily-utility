import assert from "node:assert/strict";
import test from "node:test";

import { PRODUCT_LIMITS } from "../src/core.js";
import { readDirectFiles, readSources, readZipFile, SourceError, validateSelection } from "../src/file-source.js";
import { cleanFormat0, fileLike, zipFromMap } from "./fixtures.mjs";

async function rejectsCode(action, code) {
  await assert.rejects(action, (error) => error instanceof SourceError && error.code === code);
}

test("ZIP source inventories MIDI and other release files without opening nested archives", async () => {
  const midi = cleanFormat0();
  const source = await readZipFile(fileLike("pack.zip", zipFromMap({
    "clips/lead.mid": midi,
    "clips/BASS.MIDI": midi,
    "README.txt": "buyer guide",
    "extras/nested.zip": Uint8Array.from([1, 2, 3]),
  })));
  assert.equal(source.releaseName, "pack.zip");
  assert.deepEqual(source.entries.map((entry) => entry.path), ["clips/BASS.MIDI", "clips/lead.mid"]);
  assert.deepEqual(source.nonMidiPaths, ["extras/nested.zip", "README.txt"]);
  assert.deepEqual(Buffer.from(source.entries[0].bytes), Buffer.from(midi));
});

test("direct source accepts only bounded MIDI selections", async () => {
  const midi = cleanFormat0();
  const source = await readDirectFiles([
    fileLike("a.mid", midi),
    fileLike("b.midi", midi, { webkitRelativePath: "folder/b.midi" }),
  ]);
  assert.equal(source.entries.length, 2);
  assert.equal(source.entries[1].path, "folder/b.midi");
  assert.throws(() => validateSelection([fileLike("notes.txt", midi)]), (error) => error.code === "UNSUPPORTED_FILE");
  assert.throws(() => validateSelection([fileLike("pack.zip", midi), fileLike("a.mid", midi)]), (error) => error.code === "MIXED_SELECTION");
});

test("unsafe, damaged, missing, and oversized sources fail with stable customer codes", async () => {
  const midi = cleanFormat0();
  await rejectsCode(() => readSources([]), "NO_FILES");
  await rejectsCode(() => readZipFile(fileLike("bad.zip", Uint8Array.from([1, 2, 3]))), "INVALID_ARCHIVE");
  await rejectsCode(() => readZipFile(fileLike("empty.zip", zipFromMap({ "README.txt": "none" }))), "NO_MIDI_FILES");
  await rejectsCode(
    () => readDirectFiles([fileLike("large.mid", midi, { size: PRODUCT_LIMITS.maxMidiBytes + 1 })]),
    "MIDI_TOO_LARGE",
  );
  await rejectsCode(
    () => readZipFile(fileLike("large.zip", zipFromMap({ "a.mid": midi }), { size: PRODUCT_LIMITS.maxArchiveBytes + 1 })),
    "ARCHIVE_TOO_LARGE",
  );
  await rejectsCode(
    () => readDirectFiles([fileLike("../unsafe.mid", midi, { webkitRelativePath: "../unsafe.mid" })]),
    "UNSAFE_PATH",
  );
});
