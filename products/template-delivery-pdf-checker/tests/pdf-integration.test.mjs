import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import test from "node:test";

import { PDFDocument, PDFName, PDFString, rgb } from "pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import { auditLinks } from "../src/core.js";
import { extractLinkAnnotations } from "../src/pdf-analysis.js";

const targets = [
  "https://www.canva.com/design/ABC123/view?mode=preview",
  "https://www.canva.com/design/MASTER/edit",
  "https://example.com/help",
];

async function createFixturePdf() {
  const document = await PDFDocument.create();
  const pages = [document.addPage([612, 792]), document.addPage([612, 792])];
  const placements = [
    { page: pages[0], target: targets[0], rect: [72, 650, 300, 690] },
    { page: pages[0], target: targets[1], rect: [72, 580, 300, 620] },
    { page: pages[1], target: targets[2], rect: [72, 650, 300, 690] },
  ];

  for (const [index, placement] of placements.entries()) {
    const [x1, y1, x2, y2] = placement.rect;
    placement.page.drawRectangle({
      x: x1,
      y: y1,
      width: x2 - x1,
      height: y2 - y1,
      color: index === 1 ? rgb(0.85, 0.3, 0.26) : rgb(0.12, 0.52, 0.34),
    });
    const annotation = document.context.register(
      document.context.obj({
        Type: PDFName.of("Annot"),
        Subtype: PDFName.of("Link"),
        Rect: document.context.obj(placement.rect),
        Border: document.context.obj([0, 0, 0]),
        A: document.context.obj({
          S: PDFName.of("URI"),
          URI: PDFString.of(placement.target),
        }),
      }),
    );
    placement.page.node.addAnnot(annotation);
  }
  return document.save({ useObjectStreams: false });
}

test("extracts and classifies the deterministic three-link PDF fixture", async () => {
  const bytes = await createFixturePdf();
  const fixtureDirectory = new URL("./fixtures/", import.meta.url);
  await mkdir(fixtureDirectory, { recursive: true });
  await writeFile(new URL("three-links.pdf", fixtureDirectory), bytes);
  const loadingTask = getDocument({ data: new Uint8Array(bytes) });
  const pdf = await loadingTask.promise;
  try {
    const records = await extractLinkAnnotations(pdf);
    const audit = auditLinks(records, { filename: "three-links.pdf", pageCount: pdf.numPages });
    assert.equal(pdf.numPages, 2);
    assert.equal(records.length, 3);
    assert.deepEqual(records.map((record) => record.page), [1, 1, 2]);
    assert.deepEqual(records.map((record) => record.target), targets);
    assert.deepEqual(audit.rows.map((row) => row.category), [
      "canva-template",
      "canva-risky",
      "external-https",
    ]);
    assert.ok(records.every((record) => Array.isArray(record.rect) && record.rect.length === 4));
  } finally {
    await loadingTask.destroy();
  }
});
