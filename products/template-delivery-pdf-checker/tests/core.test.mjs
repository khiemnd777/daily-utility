import assert from "node:assert/strict";
import test from "node:test";

import {
  auditLinks,
  createCsvReport,
  createMarkdownReport,
  normalizeViewportRect,
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

test("normalizes every detected rectangle for overlay placement", () => {
  const viewport = { width: 600, height: 800 };
  const boxes = records.map((record) => normalizeViewportRect(record.rect, viewport));
  assert.equal(boxes.length, records.length);
  assert.ok(boxes.every((box) => box && box.width > 0 && box.height > 0));
});

test("exports complete Markdown and CSV reports", () => {
  const audit = auditLinks(records, { filename: "fixture.pdf", pageCount: 2 });
  const markdown = createMarkdownReport(audit);
  const csv = createCsvReport(audit);
  for (const expected of ["fixture.pdf", "Pages: 2", "Clickable links: 3", records[1].target, "verify that buyers"]) {
    assert.ok(markdown.includes(expected), `Markdown report should include ${expected}`);
  }
  for (const expected of ["fixture.pdf", "Canva non-template", records[2].target]) {
    assert.ok(csv.includes(expected), `CSV report should include ${expected}`);
  }

  const formulaAudit = auditLinks([{ page: 1, target: "=2+2" }], {
    filename: "formula.pdf",
    pageCount: 1,
  });
  assert.ok(createCsvReport(formulaAudit).includes("\"'=2+2\""));
});
