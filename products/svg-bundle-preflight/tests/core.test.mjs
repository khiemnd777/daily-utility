import assert from "node:assert/strict";
import test from "node:test";

import { analyzeEntries, createCsvReport, createHtmlReport, inspectSvgSnapshot } from "../src/core.js";
import { parseSvgSource } from "../src/svg-parser.js";
import { BAD_SVGS, VALID_SVGS, entriesFromMap } from "./fixtures.mjs";

function parse(source) {
  return parseSvgSource(source);
}

test("valid nested SVG fixtures produce four files and zero blockers", async () => {
  const audit = await analyzeEntries(entriesFromMap(VALID_SVGS), {
    bundleName: "valid-fixture.zip",
    scannedAt: "2026-08-27T02:00:00.000Z",
    parse,
  });
  assert.equal(audit.summary.fileCount, 4);
  assert.equal(audit.summary.blockerCount, 0);
  assert.equal(audit.summary.warningCount, 0);
  assert.equal(audit.summary.passedFileCount, 4);
});

test("documented blocker corpus reports stable IDs, paths, and severities", async () => {
  const audit = await analyzeEntries(entriesFromMap(BAD_SVGS), {
    bundleName: "bad-fixture.zip",
    scannedAt: "2026-08-27T02:00:00.000Z",
    parse,
  });
  const expected = new Map([
    ["01-malformed.svg", ["malformed-xml"]],
    ["02-live-text.svg", ["live-text"]],
    ["03-clip.svg", ["clipping-path"]],
    ["04-gradient.svg", ["gradient-fill"]],
    ["05-pattern.svg", ["pattern-fill"]],
    ["06-external.svg", ["external-reference"]],
    ["07-bitmap.svg", ["embedded-bitmap"]],
    ["08-script.svg", ["active-script"]],
    ["09-no-size.svg", ["missing-sizing-metadata"]],
  ]);
  for (const [path, checkIds] of expected) {
    const result = audit.results.find((item) => item.path === path);
    assert.ok(result, path);
    for (const checkId of checkIds) {
      const found = result.findings.find((item) => item.id === checkId);
      assert.ok(found, `${path} should report ${checkId}`);
      assert.equal(found.severity, checkId === "missing-sizing-metadata" ? "warning" : "blocker");
    }
  }
});

test("exact duplicates and case-insensitive path collisions form one correct group each", async () => {
  const shared = VALID_SVGS["letters/a.svg"];
  const entries = entriesFromMap({
    "copies/one.svg": shared,
    "copies/two.svg": shared,
    "case/Logo.svg": VALID_SVGS["animals/bird.svg"],
    "case/logo.svg": VALID_SVGS["animals/fox.svg"],
    "distinct/star.svg": VALID_SVGS["shapes/star.svg"],
  });
  const audit = await analyzeEntries(entries, { bundleName: "duplicates.zip", parse });
  assert.deepEqual(audit.duplicateGroups, [["copies/one.svg", "copies/two.svg"]]);
  assert.deepEqual(audit.caseCollisionGroups, [["case/Logo.svg", "case/logo.svg"]]);
  assert.ok(audit.results.find((item) => item.path === "copies/one.svg").findings.some((item) => item.id === "exact-duplicate"));
  assert.ok(audit.results.find((item) => item.path === "case/logo.svg").findings.some((item) => item.id === "case-path-collision"));
  assert.equal(audit.duplicateGroups.flat().includes("distinct/star.svg"), false);
});

test("CSV and HTML reports include complete escaped evidence without mutating inputs", async () => {
  const entries = entriesFromMap({
    "=formula.svg": BAD_SVGS["02-live-text.svg"],
    "safe.svg": VALID_SVGS["animals/bird.svg"],
  });
  const before = entries.map((entry) => [entry.path, entry.text, new Uint8Array(entry.bytes)]);
  const audit = await analyzeEntries(entries, {
    bundleName: "<release & review>.zip",
    scannedAt: "2026-08-27T02:00:00.000Z",
    parse,
  });
  const csv = createCsvReport(audit);
  const html = createHtmlReport(audit);
  for (const expected of ["bundle_name", "scan_timestamp", "file_total", "blocker_total", "warning_total", "live-text"]) {
    assert.ok(csv.includes(expected), expected);
  }
  assert.ok(csv.includes("'=formula.svg"), "CSV formula-like paths must be escaped");
  assert.match(html, /&lt;release &amp; review&gt;\.zip/);
  assert.match(html, /2026-08-27T02:00:00\.000Z/);
  assert.match(html, /live-text/);
  assert.match(html, /default-src 'none'/);
  assert.doesNotMatch(html, /<release & review>/);
  for (const [index, original] of before.entries()) {
    assert.equal(entries[index].path, original[0]);
    assert.equal(entries[index].text, original[1]);
    assert.deepEqual(entries[index].bytes, original[2]);
  }
});

test("non-SVG roots and invalid viewBox metadata are bounded findings", () => {
  const notSvg = inspectSvgSnapshot(parse("<html><body/></html>"));
  assert.ok(notSvg.some((item) => item.id === "not-svg-root" && item.severity === "blocker"));
  const invalidViewBox = inspectSvgSnapshot(parse('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 nope 10"><path d="M0 0H1"/></svg>'));
  assert.ok(invalidViewBox.some((item) => item.id === "invalid-viewbox" && item.severity === "warning"));
});
