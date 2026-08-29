import assert from "node:assert/strict";
import test from "node:test";

import { analyzeEntries, createCsvReport, createHtmlReport } from "../src/core.js";
import { parseCubeSource } from "../src/lut-parser.js";
import { CLEAN_LUTS, MALFORMED_LUTS, cube1d, cube3d, entriesFromMap } from "./fixtures.mjs";

test("clean fixtures inventory exact metadata, hashes, rows, and zero blockers", async () => {
  const audit = await analyzeEntries(entriesFromMap(CLEAN_LUTS), {
    releaseName: "clean-pack.zip",
    scannedAt: "2026-08-29T02:00:00.000Z",
    parse: parseCubeSource,
  });
  assert.equal(audit.summary.fileCount, 2);
  assert.equal(audit.summary.blockerCount, 0);
  assert.equal(audit.summary.reviewCount, 2, "mixed 1D/3D grids are review findings");
  for (const result of audit.results) {
    assert.match(result.hash, /^[a-f0-9]{64}$/);
    assert.equal(result.actualRowCount, result.expectedRowCount);
    assert.ok(["1D", "3D"].includes(result.tableType));
  }
});

test("malformed fixtures retain stable IDs, paths, severities, and line evidence", async () => {
  const audit = await analyzeEntries(entriesFromMap(MALFORMED_LUTS), {
    releaseName: "malformed-pack.zip",
    parse: parseCubeSource,
  });
  for (const result of audit.results) {
    assert.equal(result.status, "blocked", result.path);
    assert.ok(result.findings.some((item) => item.severity === "blocker" && item.path === result.path));
  }
  assert.ok(audit.summary.blockerCount >= 8);
});

test("bundle hygiene groups exact bytes, equivalent payloads, duplicate titles, and case collisions without false grouping", async () => {
  const exact = cube1d(3, { title: "Exact", mapper: (value) => [value, value * value, value] });
  const equivalentOne = cube3d(2, { title: "Equivalent A", comments: ["# first header"] });
  const equivalentTwo = cube3d(2, { title: "Equivalent B", comments: ["# second header"] });
  const entries = entriesFromMap({
    "exact/a.cube": exact,
    "exact/b.cube": exact,
    "equivalent/one.cube": equivalentOne,
    "equivalent/two.cube": equivalentTwo,
    "titles/one.cube": cube1d(4, { title: "Shared title" }),
    "titles/two.cube": cube1d(5, { title: "Shared title" }),
    "case/Look.cube": cube3d(3, { title: "Case A" }),
    "case/look.cube": cube3d(3, { title: "Case B", mapper: (r, g, b) => [1 - r, 1 - g, 1 - b] }),
    "distinct/unique.cube": cube1d(6, { title: "Unique", mapper: (value) => [value, 0, 1 - value] }),
  });
  const audit = await analyzeEntries(entries, { releaseName: "bundle.zip", parse: parseCubeSource });
  assert.deepEqual(audit.exactDuplicateGroups, [["exact/a.cube", "exact/b.cube"]]);
  assert.deepEqual(audit.equivalentPayloadGroups, [["equivalent/one.cube", "equivalent/two.cube"]]);
  assert.deepEqual(audit.duplicateTitleGroups, [["titles/one.cube", "titles/two.cube"]]);
  assert.deepEqual(audit.caseCollisionGroups, [["case/Look.cube", "case/look.cube"]]);
  assert.equal(audit.exactDuplicateGroups.flat().includes("distinct/unique.cube"), false);
});

test("CSV and HTML reports contain complete escaped evidence and input bytes remain unchanged", async () => {
  const entries = entriesFromMap({
    "=formula.cube": MALFORMED_LUTS["04-invalid-triplet.cube"],
    "safe.cube": CLEAN_LUTS["looks/identity-1d.cube"],
  });
  const before = entries.map((entry) => [entry.path, entry.text, new Uint8Array(entry.bytes)]);
  const audit = await analyzeEntries(entries, {
    releaseName: "<release & review>.zip",
    scannedAt: "2026-08-29T02:00:00.000Z",
    nonCubePaths: ["<img src=x onerror=alert(1)>.txt"],
    parse: parseCubeSource,
  });
  const csv = createCsvReport(audit);
  const html = createHtmlReport(audit);
  for (const expected of ["release_name", "lut_byte_total", "sha256", "table_type", "domain_min", "invalid-numeric-triplet", "non-cube-file"]) {
    assert.ok(csv.includes(expected), expected);
  }
  assert.ok(csv.includes("'=formula.cube"), "CSV formula-like paths must be escaped");
  assert.match(html, /&lt;release &amp; review&gt;\.zip/);
  assert.match(html, /2026-08-29T02:00:00\.000Z/);
  assert.match(html, /invalid-numeric-triplet/);
  assert.match(html, /default-src 'none'/);
  assert.doesNotMatch(html, /<img src=x onerror=alert\(1\)>/);
  for (const [index, original] of before.entries()) {
    assert.equal(entries[index].path, original[0]);
    assert.equal(entries[index].text, original[1]);
    assert.deepEqual(entries[index].bytes, original[2]);
  }
});
