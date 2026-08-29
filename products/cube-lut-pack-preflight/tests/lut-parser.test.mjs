import assert from "node:assert/strict";
import test from "node:test";

import { parseCubeSource } from "../src/lut-parser.js";
import { CLEAN_LUTS, MALFORMED_LUTS } from "./fixtures.mjs";

test("clean standalone 1D and 3D fixtures expose exact declared properties", () => {
  const oneDimensional = parseCubeSource(CLEAN_LUTS["looks/identity-1d.cube"]);
  assert.deepEqual(
    {
      type: oneDimensional.tableType,
      size: oneDimensional.size,
      domainMin: oneDimensional.domainMin,
      domainMax: oneDimensional.domainMax,
      expected: oneDimensional.expectedRowCount,
      actual: oneDimensional.actualRowCount,
      findings: oneDimensional.findings,
    },
    { type: "1D", size: 4, domainMin: [0, 0, 0], domainMax: [1, 1, 1], expected: 4, actual: 4, findings: [] },
  );

  const threeDimensional = parseCubeSource(CLEAN_LUTS["looks/identity-3d.cube"]);
  assert.equal(threeDimensional.tableType, "3D");
  assert.equal(threeDimensional.size, 2);
  assert.equal(threeDimensional.expectedRowCount, 8);
  assert.equal(threeDimensional.actualRowCount, 8);
  assert.deepEqual(threeDimensional.findings, []);
});

test("malformed corpus reports stable blocker IDs and evidence lines", () => {
  const expected = new Map([
    ["01-missing-size.cube", "missing-size-declaration"],
    ["02-repeated-keyword.cube", "repeated-keyword"],
    ["03-keyword-after-data.cube", "keyword-after-table-data"],
    ["04-invalid-triplet.cube", "invalid-numeric-triplet"],
    ["05-non-finite.cube", "number-out-of-spec"],
    ["06-invalid-domain.cube", "invalid-domain"],
    ["07-short-data.cube", "short-table-data"],
    ["08-extra-data.cube", "extra-table-data"],
  ]);
  for (const [path, checkId] of expected) {
    const parsed = parseCubeSource(MALFORMED_LUTS[path]);
    const item = parsed.findings.find((finding) => finding.id === checkId);
    assert.ok(item, `${path} should report ${checkId}`);
    assert.equal(item.severity, "blocker");
    if (!["missing-size-declaration", "short-table-data", "extra-table-data"].includes(checkId)) {
      assert.ok(Number.isInteger(item.line), `${checkId} should include an evidence line`);
    }
  }
});

test("output values outside 0–1 are review findings, not blockers", () => {
  const parsed = parseCubeSource("LUT_1D_SIZE 2\n-0.2 0 0\n1.2 1 1\n");
  assert.ok(parsed.findings.some((item) => item.id === "output-outside-unit-range" && item.severity === "review"));
  assert.equal(parsed.findings.some((item) => item.severity === "blocker"), false);
});

test("selected profile rejects combined types, unknown keywords, lone CR separators, and non-Basic-Latin text", () => {
  const parsed = parseCubeSource("TITLE \"LÜT\"\rLUT_1D_SIZE 2\nLUT_3D_SIZE 2\nMYSTERY 1\n0 0 0\n1 1 1\n");
  const ids = new Set(parsed.findings.map((item) => item.id));
  for (const id of ["unsupported-character", "invalid-line-separator", "mixed-table-types", "unknown-keyword"]) {
    assert.ok(ids.has(id), id);
  }
});
