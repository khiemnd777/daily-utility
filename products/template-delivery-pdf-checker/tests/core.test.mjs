import assert from "node:assert/strict";
import test from "node:test";

import {
  PRODUCT_LIMITS,
  auditLinks,
  createCsvReport,
  createMarkdownReport,
  friendlyAnalysisError,
  inspectTarget,
  normalizeViewportRect,
  validateDocumentLimits,
  validateInputFile,
} from "../src/core.js";

const records = [
  {
    id: "template",
    page: 1,
    target: "https://www.canva.com/design/ABC123/view?mode=preview",
    rect: [20, 20, 200, 60],
  },
  {
    id: "edit",
    page: 1,
    target: "https://www.canva.com/design/MASTER/edit",
    rect: [20, 80, 200, 120],
  },
  {
    id: "external",
    page: 2,
    target: "https://example.com/help",
    rect: [20, 20, 200, 60],
  },
];

test("classifies template-like, risky Canva, and external HTTPS links", () => {
  const audit = auditLinks(records, { filename: "fixture.pdf", pageCount: 2 });
  assert.equal(audit.rows.length, 3);
  assert.deepEqual(
    audit.rows.map((row) => [row.page, row.target, row.category]),
    [
      [1, records[0].target, "canva-template"],
      [1, records[1].target, "canva-risky"],
      [2, records[2].target, "external-https"],
    ],
  );
  assert.ok(audit.rows[1].warnings.some((item) => item.code === "canva-non-template"));
});

test("warns for missing links, malformed and non-HTTPS targets, and duplicates", () => {
  const empty = auditLinks([], { filename: "flat.pdf", pageCount: 1 });
  assert.deepEqual(empty.documentWarnings.map((item) => item.code), ["no-clickable-links"]);

  const risky = auditLinks([
    { page: 1, target: "http://example.com/file" },
    { page: 1, target: "http://example.com/file" },
    { page: 1, target: "not a URL" },
  ]);
  assert.ok(risky.rows[0].warnings.some((item) => item.code === "non-https-target"));
  assert.ok(risky.rows[0].warnings.some((item) => item.code === "duplicate-target"));
  assert.ok(risky.rows[2].warnings.some((item) => item.code === "malformed-target"));
});

test("keeps unrecognized Canva URLs out of the safe category", () => {
  const corpus = [
    ["https://www.canva.com/template/ABC123", "canva-template"],
    ["https://www.canva.com/design/ABC123/view?mode=preview&utm_source=seller", "canva-template"],
    ["https://canva.com/design/ABC123/edit", "canva-risky"],
    ["https://www.canva.com/design/ABC123/view", "canva-risky"],
    ["https://www.canva.com/design/ABC123/share", "canva-risky"],
    ["https://www.canva.com/folder/ABC123", "canva-unknown"],
    ["https://canva.com.evil.example/design/ABC123/edit", "external-https"],
  ];
  for (const [target, category] of corpus) {
    assert.equal(inspectTarget(target).category, category, target);
  }
  assert.ok(
    inspectTarget(corpus[5][0]).warnings.some((item) => item.code === "canva-unrecognized"),
  );
});

test("blocks active-content targets and warns about embedded credentials", () => {
  for (const target of ["javascript:alert(1)", "data:text/html,hello", "file:///tmp/private.pdf"]) {
    const result = inspectTarget(target);
    assert.equal(result.category, "invalid");
    assert.ok(result.warnings.some((item) => item.code === "unsafe-target"));
  }
  assert.ok(
    inspectTarget("https://user:pass@example.com/file").warnings.some(
      (item) => item.code === "embedded-credentials",
    ),
  );
});

test("enforces documented file, page, and link safety limits", () => {
  assert.doesNotThrow(() => validateInputFile({ name: "delivery.pdf", type: "", size: PRODUCT_LIMITS.maxFileBytes }));
  assert.throws(
    () => validateInputFile({ name: "delivery.pdf", type: "", size: PRODUCT_LIMITS.maxFileBytes + 1 }),
    (error) => error.code === "FILE_TOO_LARGE",
  );
  assert.throws(
    () => validateDocumentLimits({ pageCount: PRODUCT_LIMITS.maxPages + 1 }),
    (error) => error.code === "TOO_MANY_PAGES",
  );
  assert.throws(
    () => validateDocumentLimits({ pageCount: 1, linkCount: PRODUCT_LIMITS.maxLinks + 1 }),
    (error) => error.code === "TOO_MANY_LINKS",
  );
});

test("maps parser and policy failures to stable customer-facing messages", () => {
  assert.match(friendlyAnalysisError({ name: "PasswordException" }), /Password-protected/);
  assert.match(friendlyAnalysisError({ name: "InvalidPDFException" }), /damaged|valid PDF/);
  assert.doesNotMatch(friendlyAnalysisError(new Error("private parser detail")), /private parser detail/);
});

test("normalizes every detected rectangle for overlay placement", () => {
  const viewport = { width: 600, height: 800 };
  const boxes = records.map((record) => normalizeViewportRect(record.rect, viewport));
  assert.equal(boxes.length, records.length);
  assert.ok(boxes.every((box) => box && box.width > 0 && box.height > 0));
  assert.equal(normalizeViewportRect([Number.NaN, 1, 2, 3], viewport), null);
  assert.equal(normalizeViewportRect([1, 1, 1, 3], viewport), null);
});

test("exports complete Markdown and CSV reports", () => {
  const audit = auditLinks(records, { filename: "fixture.pdf", pageCount: 2 });
  const markdown = createMarkdownReport(audit);
  const csv = createCsvReport(audit);
  for (const expected of ["fixture.pdf", "Pages: 2", "Clickable links: 3", records[1].target, "verify that buyers"]) {
    assert.ok(markdown.includes(expected), `Markdown report should include ${expected}`);
  }
  for (const expected of ["fixture.pdf", "Canva likely non-template", records[2].target]) {
    assert.ok(csv.includes(expected), `CSV report should include ${expected}`);
  }

  const formulaAudit = auditLinks([{ page: 1, target: "=2+2" }], {
    filename: "formula.pdf",
    pageCount: 1,
  });
  assert.ok(createCsvReport(formulaAudit).includes("\"'=2+2\""));
});
