import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import test from "node:test";

import { PDFDocument, PDFHexString, PDFName, PDFString, rgb } from "pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import { PRODUCT_LIMITS, auditLinks, friendlyAnalysisError, validateDocumentLimits } from "../src/core.js";
import { extractLinkAnnotations } from "../src/pdf-analysis.js";

const targets = [
  "https://www.canva.com/design/ABC123/view?mode=preview",
  "https://www.canva.com/design/MASTER/edit",
  "https://example.com/help",
];

function addLinkAnnotation(document, page, target, rect, { hex = false, destination = null } = {}) {
  const dictionary = {
    Type: PDFName.of("Annot"),
    Subtype: PDFName.of("Link"),
    Rect: document.context.obj(rect),
    Border: document.context.obj([0, 0, 0]),
  };
  if (destination) {
    dictionary.Dest = PDFString.of(destination);
  } else {
    dictionary.A = document.context.obj({
      S: PDFName.of("URI"),
      URI: hex ? PDFHexString.of(Buffer.from(target, "utf8").toString("hex")) : PDFString.of(target),
    });
  }
  const annotation = document.context.register(document.context.obj(dictionary));
  page.node.addAnnot(annotation);
}

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
    addLinkAnnotation(document, placement.page, placement.target, placement.rect);
  }
  return document.save({ useObjectStreams: false });
}

async function loadAndExtract(bytes, options = {}) {
  const loadingTask = getDocument({ data: new Uint8Array(bytes), isEvalSupported: false });
  const pdf = await loadingTask.promise;
  try {
    validateDocumentLimits({ pageCount: pdf.numPages });
    return {
      pageCount: pdf.numPages,
      records: await extractLinkAnnotations(pdf, {
        maxLinks: PRODUCT_LIMITS.maxLinks,
        ...options,
      }),
    };
  } finally {
    await loadingTask.destroy();
  }
}

test("extracts and classifies the deterministic three-link PDF fixture", async () => {
  const bytes = await createFixturePdf();
  const fixtureDirectory = new URL("./fixtures/", import.meta.url);
  await mkdir(fixtureDirectory, { recursive: true });
  await writeFile(new URL("three-links.pdf", fixtureDirectory), bytes);
  const { pageCount, records } = await loadAndExtract(bytes);
  const audit = auditLinks(records, { filename: "three-links.pdf", pageCount });
  assert.equal(pageCount, 2);
  assert.equal(records.length, 3);
  assert.deepEqual(records.map((record) => record.page), [1, 1, 2]);
  assert.deepEqual(records.map((record) => record.target), targets);
  assert.deepEqual(audit.rows.map((row) => row.category), [
    "canva-template",
    "canva-risky",
    "external-https",
  ]);
  assert.ok(records.every((record) => Array.isArray(record.rect) && record.rect.length === 4));
});

test("handles an 18-profile PDF annotation compatibility and security corpus", async () => {
  const profiles = [
    { name: "template path", target: "https://www.canva.com/template/TEMPLATE01", category: "canva-template" },
    { name: "preview mode", target: "https://www.canva.com/design/DESIGN01/view?mode=preview", category: "canva-template" },
    { name: "preview with tracking", target: "https://www.canva.com/design/DESIGN02/view?utm_source=pdf&mode=preview", category: "canva-template" },
    { name: "hex URI string", target: "https://example.com/hex", category: "external-https", hex: true },
    { name: "edit link", target: "https://www.canva.com/design/MASTER/edit", category: "canva-risky" },
    { name: "view link", target: "https://www.canva.com/design/MASTER/view", category: "canva-risky" },
    { name: "share link", target: "https://www.canva.com/design/MASTER/share", category: "canva-risky" },
    { name: "unknown Canva", target: "https://www.canva.com/folder/FOLDER01", category: "canva-unknown" },
    { name: "external HTTPS", target: "https://example.com/download", category: "external-https" },
    { name: "subdomain HTTPS", target: "https://files.example.com/download", category: "external-https" },
    { name: "http", target: "http://example.com/download", category: "other-target" },
    { name: "mailto", target: "mailto:support@example.com", category: "other-target" },
    { name: "javascript", target: "javascript:alert(1)", category: "invalid" },
    { name: "data", target: "data:text/plain,hello", category: "invalid" },
    { name: "fragment", target: "https://example.com/help#start", category: "external-https" },
    { name: "encoded path", target: "https://example.com/a%20b", category: "external-https" },
    { name: "embedded credentials", target: "https://user:pass@example.com/private", category: "external-https" },
    { name: "internal destination", destination: "chapter-2", category: "invalid" },
  ];
  const document = await PDFDocument.create();
  const page = document.addPage([612, 792]);
  profiles.forEach((profile, index) => {
    const y = 760 - index * 36;
    addLinkAnnotation(document, page, profile.target || "", [36, y - 20, 300, y], profile);
  });
  const { records } = await loadAndExtract(await document.save({ useObjectStreams: false }));
  const audit = auditLinks(records, { filename: "compatibility-corpus.pdf", pageCount: 1 });
  assert.equal(records.length, profiles.length);
  assert.deepEqual(
    audit.rows.map((row) => row.category),
    profiles.map((profile) => profile.category),
  );
  assert.ok(audit.rows[12].warnings.some((item) => item.code === "unsafe-target"));
  assert.ok(audit.rows[13].warnings.some((item) => item.code === "unsafe-target"));
  assert.ok(audit.rows[16].warnings.some((item) => item.code === "embedded-credentials"));
  assert.ok(audit.rows[17].warnings.some((item) => item.code === "missing-target"));
});

test("rejects corrupt and over-limit documents with customer-safe messages", async () => {
  const corruptTask = getDocument({ data: new Uint8Array(Buffer.from("%PDF-1.7\ncorrupt")) });
  await assert.rejects(corruptTask.promise, (error) => {
    assert.match(friendlyAnalysisError(error), /damaged|valid PDF/);
    return true;
  });
  await corruptTask.destroy();

  const manyPages = await PDFDocument.create();
  for (let index = 0; index < PRODUCT_LIMITS.maxPages + 1; index += 1) {
    manyPages.addPage([72, 72]);
  }
  const manyPageBytes = await manyPages.save({ useObjectStreams: false });
  await writeFile(new URL("fixtures/too-many-pages.pdf", import.meta.url), manyPageBytes);
  const loadingTask = getDocument({ data: new Uint8Array(manyPageBytes), isEvalSupported: false });
  const pdf = await loadingTask.promise;
  assert.throws(
    () => validateDocumentLimits({ pageCount: pdf.numPages }),
    (error) => error.code === "TOO_MANY_PAGES",
  );
  await loadingTask.destroy();

  const cancellationDocument = await PDFDocument.create();
  for (let index = 0; index < PRODUCT_LIMITS.maxPages; index += 1) {
    const page = cancellationDocument.addPage([612, 792]);
    for (let linkIndex = 0; linkIndex < 10; linkIndex += 1) {
      const y = 760 - linkIndex * 30;
      addLinkAnnotation(
        cancellationDocument,
        page,
        `https://example.com/page-${index + 1}/link-${linkIndex + 1}`,
        [36, y - 18, 260, y],
      );
    }
  }
  await writeFile(
    new URL("fixtures/cancel-scan.pdf", import.meta.url),
    await cancellationDocument.save({ useObjectStreams: false }),
  );
});

test("stops extraction at the link limit and supports cancellation", async () => {
  const page = {
    async getAnnotations() {
      return Array.from({ length: 4 }, (_, index) => ({
        id: `link-${index}`,
        subtype: "Link",
        url: `https://example.com/${index}`,
        rect: [0, 0, 10, 10],
      }));
    },
    cleanup() {},
  };
  const fakePdf = { numPages: 1, async getPage() { return page; } };
  await assert.rejects(
    extractLinkAnnotations(fakePdf, { maxLinks: 3 }),
    (error) => error.code === "TOO_MANY_LINKS",
  );

  let cancelled = false;
  const cancellablePdf = {
    numPages: 2,
    async getPage() {
      return {
        async getAnnotations() { return []; },
        cleanup() {},
      };
    },
  };
  await assert.rejects(
    extractLinkAnnotations(cancellablePdf, {
      shouldCancel: () => cancelled,
      onProgress: () => { cancelled = true; },
    }),
    (error) => error.code === "ANALYSIS_CANCELLED",
  );
});
