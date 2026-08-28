import assert from "node:assert/strict";
import test from "node:test";

import { analyzePresentation, createCsvReport, createHtmlReport, sha256Hex } from "../src/core.js";
import { PackageError, readPresentationPackage } from "../src/package-reader.js";
import {
  cleanPresentationFixture,
  fakeFile,
  hiddenContentFixture,
  malformedXmlFixture,
  relationshipRiskFixture,
} from "./fixtures.mjs";

async function audit(name, bytes, options = {}) {
  const packageData = await readPresentationPackage(fakeFile(name, bytes));
  return analyzePresentation(packageData, { scannedAt: "2026-08-28T02:00:00.000Z", ...options });
}

test("clean PPTX and POTX fixtures inventory structure and resolve every internal target", async () => {
  for (const [name, bytes] of [
    ["clean-deck.pptx", cleanPresentationFixture()],
    ["clean-template.potx", cleanPresentationFixture({ template: true })],
  ]) {
    const result = await audit(name, bytes);
    assert.equal(result.inventory.slideCount, 1, name);
    assert.equal(result.inventory.layoutCount, 1, name);
    assert.equal(result.inventory.masterCount, 1, name);
    assert.deepEqual(result.inventory.dimensions, {
      widthEmu: 12192000,
      heightEmu: 6858000,
      widthInches: 13.33,
      heightInches: 7.5,
      aspectRatio: "16:9",
    });
    assert.equal(result.inventory.internalRelationshipCount, result.inventory.resolvedRelationshipCount);
    assert.equal(result.summary.blockerCount, 0);
    assert.equal(result.summary.warningCount, 0);
    assert.deepEqual(result.fonts.embedded, ["Aptos"]);
    assert.deepEqual(result.fonts.unembedded, []);
  }
});

test("relationship fixture reports missing, local media, data, and HTTPS evidence", async () => {
  const result = await audit("relationship-risks.pptx", relationshipRiskFixture());
  const byId = new Map(result.findings.map((item) => [item.id, item]));
  for (const id of [
    "missing-internal-target",
    "external-local-file",
    "external-data-relationship",
    "external-web-hyperlink",
  ]) {
    assert.ok(byId.has(id), id);
    assert.equal(byId.get(id).part, "ppt/slides/slide1.xml");
    assert.equal(byId.get(id).slide, 1);
  }
  assert.equal(byId.get("missing-internal-target").severity, "blocker");
  assert.equal(byId.get("external-web-hyperlink").severity, "warning");
  assert.match(byId.get("missing-internal-target").evidence, /ppt\/media\/missing\.png/);
  assert.match(byId.get("external-data-relationship").evidence, /forecast\.xlsx/);
  assert.match(byId.get("external-web-hyperlink").evidence, /buyer-guide/);
});

test("hidden-content fixture reports fonts, comments, notes, slides, objects, macros, and metadata", async () => {
  const result = await audit("hidden-content.pptx", hiddenContentFixture());
  const ids = new Set(result.findings.map((item) => item.id));
  for (const id of [
    "unembedded-font",
    "comments-present",
    "speaker-notes-present",
    "hidden-slide",
    "embedded-object",
    "macro-content",
    "personal-metadata",
  ]) assert.ok(ids.has(id), id);
  const font = result.findings.find((item) => item.id === "unembedded-font");
  assert.equal(font.severity, "warning");
  assert.match(font.evidence, /portability warning, not proof/);
  assert.equal(result.findings.find((item) => item.id === "hidden-slide").slide, 1);
  assert.equal(result.findings.find((item) => item.id === "macro-content").severity, "blocker");
  assert.equal(result.hiddenContent.metadata.length, 2);
});

test("reports include complete identity and findings without changing input bytes", async () => {
  const input = relationshipRiskFixture();
  const before = new Uint8Array(input);
  const beforeHash = await sha256Hex(before);
  const result = await audit("=client & release.pptx", input);
  const csv = createCsvReport(result);
  const html = createHtmlReport(result);
  assert.equal(await sha256Hex(input), beforeHash);
  assert.deepEqual(input, before);
  for (const expected of [
    "filename", "file_bytes", "sha256", "scan_timestamp", "slide_total", "layout_total", "master_total",
    "package_part_total", "internal_relationship_total", "resolved_relationship_total", "external_relationship_total",
    "aspect_ratio", "blocker_total", "warning_total", "missing-internal-target", "external-data-relationship", beforeHash,
  ]) assert.ok(csv.includes(expected), expected);
  assert.match(csv, /'=client & release\.pptx/);
  assert.match(html, /Presentation Template Preflight report/);
  assert.match(html, /default-src 'none'/);
  assert.match(html, /missing-internal-target/);
  assert.match(html, /relationship-risks|client &amp; release/);
  assert.doesNotMatch(html, /=client & release\.pptx/);
});

test("malformed XML becomes an inspectable blocker", async () => {
  const result = await audit("malformed.pptx", malformedXmlFixture());
  assert.ok(result.findings.some((item) => item.id === "malformed-xml-part" && item.severity === "blocker"));
});

test("unsupported, oversized, corrupt, and non-presentation inputs fail safely", async () => {
  await assert.rejects(
    readPresentationPackage(fakeFile("legacy.ppt", new Uint8Array([1, 2, 3]))),
    (error) => error instanceof PackageError && error.code === "UNSUPPORTED_FILE",
  );
  await assert.rejects(
    readPresentationPackage(fakeFile("too-large.pptx", new Uint8Array([1]), { size: 100 * 1024 * 1024 + 1 })),
    (error) => error instanceof PackageError && error.code === "FILE_TOO_LARGE",
  );
  await assert.rejects(
    readPresentationPackage(fakeFile("corrupt.pptx", new TextEncoder().encode("not a zip"))),
    (error) => error instanceof PackageError && error.code === "INVALID_PACKAGE",
  );
});
