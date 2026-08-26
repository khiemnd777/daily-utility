import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

import {
  CATEGORY_META,
  auditLinks,
  createCsvReport,
  createMarkdownReport,
  normalizeViewportRect,
} from "./core.js";
import { extractLinkAnnotations } from "./pdf-analysis.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = __PDF_WORKER_DATA_URL__;

const elements = {
  fileInput: document.querySelector("#pdf-file"),
  dropzone: document.querySelector("#dropzone"),
  chooseButton: document.querySelector("#choose-file"),
  resetButton: document.querySelector("#reset-file"),
  status: document.querySelector("#status"),
  workspace: document.querySelector("#workspace"),
  filename: document.querySelector("#filename"),
  pageCount: document.querySelector("#page-count"),
  linkCount: document.querySelector("#link-count"),
  warningCount: document.querySelector("#warning-count"),
  warningPanel: document.querySelector("#warning-panel"),
  warningList: document.querySelector("#warning-list"),
  resultsBody: document.querySelector("#results-body"),
  previewStage: document.querySelector("#preview-stage"),
  previewCanvas: document.querySelector("#preview-canvas"),
  overlayLayer: document.querySelector("#overlay-layer"),
  pagePicker: document.querySelector("#page-picker"),
  emptyPreview: document.querySelector("#empty-preview"),
  exportMarkdown: document.querySelector("#export-markdown"),
  exportCsv: document.querySelector("#export-csv"),
};

let activePdf = null;
let activeLoadingTask = null;
let activeAudit = null;
let activeRecords = [];
let activePage = 1;

function setStatus(message, tone = "neutral") {
  elements.status.textContent = message;
  elements.status.dataset.tone = tone;
}

function safeFilename(filename) {
  return filename.replace(/\.pdf$/i, "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "pdf-check";
}

function triggerDownload(contents, mime, suffix) {
  if (!activeAudit) return;
  const blob = new Blob([contents], { type: mime });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `${safeFilename(activeAudit.filename)}-qa-report.${suffix}`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 500);
}

function renderWarnings() {
  const warningRows = [
    ...activeAudit.documentWarnings.map((item) => ({ ...item, scope: "Document" })),
    ...activeAudit.rows.flatMap((row) =>
      row.warnings.map((item) => ({ ...item, scope: `Page ${row.page}` })),
    ),
  ];
  elements.warningPanel.hidden = warningRows.length === 0;
  elements.warningList.replaceChildren();
  for (const item of warningRows) {
    const li = document.createElement("li");
    li.dataset.severity = item.severity;
    const scope = document.createElement("strong");
    scope.textContent = item.scope;
    const message = document.createElement("span");
    message.textContent = item.message;
    li.append(scope, message);
    elements.warningList.append(li);
  }
}

function categoryPill(category) {
  const pill = document.createElement("span");
  pill.className = "category-pill";
  pill.dataset.tone = CATEGORY_META[category].tone;
  pill.textContent = CATEGORY_META[category].label;
  return pill;
}

function renderRows() {
  elements.resultsBody.replaceChildren();
  if (activeAudit.rows.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 4;
    td.className = "empty-row";
    td.textContent = "No clickable annotations found in this PDF.";
    tr.append(td);
    elements.resultsBody.append(tr);
    return;
  }

  for (const row of activeAudit.rows) {
    const tr = document.createElement("tr");
    const pageCell = document.createElement("td");
    const pageButton = document.createElement("button");
    pageButton.type = "button";
    pageButton.className = "page-link";
    pageButton.textContent = `Page ${row.page}`;
    pageButton.addEventListener("click", () => selectPage(row.page));
    pageCell.append(pageButton);

    const targetCell = document.createElement("td");
    const target = document.createElement("span");
    target.className = "target-text";
    target.textContent = row.target || "Missing external URL";
    target.title = row.target || "Missing external URL";
    targetCell.append(target);

    const categoryCell = document.createElement("td");
    categoryCell.append(categoryPill(row.category));

    const warningCell = document.createElement("td");
    warningCell.textContent = row.warnings.map((item) => item.message).join(" ") || "None";
    warningCell.className = row.warnings.length ? "warning-copy" : "muted-copy";
    tr.append(pageCell, targetCell, categoryCell, warningCell);
    elements.resultsBody.append(tr);
  }
}

function renderPagePicker() {
  elements.pagePicker.replaceChildren();
  if (!activePdf) return;
  for (let pageNumber = 1; pageNumber <= activePdf.numPages; pageNumber += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(pageNumber);
    button.setAttribute("aria-label", `Preview page ${pageNumber}`);
    button.dataset.active = String(pageNumber === activePage);
    button.addEventListener("click", () => selectPage(pageNumber));
    elements.pagePicker.append(button);
  }
}

async function selectPage(pageNumber) {
  if (!activePdf) return;
  activePage = pageNumber;
  renderPagePicker();
  elements.emptyPreview.hidden = true;
  const page = await activePdf.getPage(pageNumber);
  const unscaled = page.getViewport({ scale: 1 });
  const maxWidth = Math.min(760, elements.previewStage.clientWidth - 32 || 720);
  const scale = Math.min(1.55, maxWidth / unscaled.width);
  const viewport = page.getViewport({ scale });
  const canvas = elements.previewCanvas;
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(viewport.width * pixelRatio);
  canvas.height = Math.floor(viewport.height * pixelRatio);
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  const context = canvas.getContext("2d", { alpha: false });
  await page.render({
    canvasContext: context,
    viewport,
    transform: pixelRatio === 1 ? null : [pixelRatio, 0, 0, pixelRatio, 0, 0],
  }).promise;

  elements.overlayLayer.replaceChildren();
  elements.overlayLayer.style.width = `${viewport.width}px`;
  elements.overlayLayer.style.height = `${viewport.height}px`;
  const pageRows = activeAudit.rows.filter((row) => row.page === pageNumber && row.rect);
  for (const row of pageRows) {
    const firstPoint = viewport.convertToViewportPoint(row.rect[0], row.rect[1]);
    const secondPoint = viewport.convertToViewportPoint(row.rect[2], row.rect[3]);
    const percentRect = normalizeViewportRect(
      [...firstPoint, ...secondPoint],
      viewport,
    );
    if (!percentRect) continue;
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = "link-overlay";
    marker.dataset.tone = CATEGORY_META[row.category].tone;
    marker.style.left = `${percentRect.left}%`;
    marker.style.top = `${percentRect.top}%`;
    marker.style.width = `${percentRect.width}%`;
    marker.style.height = `${percentRect.height}%`;
    marker.title = row.target || "Missing external URL";
    marker.setAttribute("aria-label", `${CATEGORY_META[row.category].label}: ${row.target || "missing target"}`);
    elements.overlayLayer.append(marker);
  }
}

function resetWorkspace() {
  if (activeLoadingTask) activeLoadingTask.destroy();
  activePdf = null;
  activeLoadingTask = null;
  activeAudit = null;
  activeRecords = [];
  activePage = 1;
  elements.fileInput.value = "";
  elements.workspace.hidden = true;
  elements.previewCanvas.width = 0;
  elements.previewCanvas.height = 0;
  elements.overlayLayer.replaceChildren();
  setStatus("Choose a delivery PDF to begin.");
  window.__TEMPLATE_DELIVERY_PDF_CHECKER__ = { version: "1.0.0", processing: false };
}

async function analyzeFile(file) {
  if (!file || (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf")) {
    setStatus("Please choose a PDF file.", "danger");
    return;
  }

  setStatus("Reading link annotations locally…", "working");
  elements.chooseButton.disabled = true;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    activeLoadingTask = pdfjsLib.getDocument({ data: bytes });
    activePdf = await activeLoadingTask.promise;
    activeRecords = await extractLinkAnnotations(activePdf);
    activeAudit = auditLinks(activeRecords, {
      filename: file.name,
      pageCount: activePdf.numPages,
    });

    elements.filename.textContent = activeAudit.filename;
    elements.pageCount.textContent = String(activeAudit.pageCount);
    elements.linkCount.textContent = String(activeAudit.rows.length);
    elements.warningCount.textContent = String(activeAudit.warningCount);
    elements.workspace.hidden = false;
    renderWarnings();
    renderRows();
    activePage = 1;
    await selectPage(1);
    setStatus(
      activeAudit.warningCount
        ? `Check complete: ${activeAudit.warningCount} warning${activeAudit.warningCount === 1 ? "" : "s"} need review.`
        : "Check complete: no link warnings found.",
      activeAudit.warningCount ? "warning" : "safe",
    );
    window.__TEMPLATE_DELIVERY_PDF_CHECKER__ = {
      version: "1.0.0",
      processing: false,
      audit: activeAudit,
      overlayCount: elements.overlayLayer.childElementCount,
    };
  } catch (error) {
    if (activeLoadingTask) activeLoadingTask.destroy();
    activePdf = null;
    activeLoadingTask = null;
    const message = error?.name === "PasswordException"
      ? "Password-protected PDFs are not supported. Export an unlocked delivery copy and try again."
      : `Could not read this PDF: ${error?.message || "unknown error"}`;
    setStatus(message, "danger");
    elements.workspace.hidden = true;
    window.__TEMPLATE_DELIVERY_PDF_CHECKER__ = {
      version: "1.0.0",
      processing: false,
      error: message,
    };
  } finally {
    elements.chooseButton.disabled = false;
  }
}

elements.chooseButton.addEventListener("click", () => elements.fileInput.click());
elements.fileInput.addEventListener("change", () => analyzeFile(elements.fileInput.files[0]));
elements.resetButton.addEventListener("click", resetWorkspace);
elements.exportMarkdown.addEventListener("click", () =>
  triggerDownload(createMarkdownReport(activeAudit), "text/markdown;charset=utf-8", "md"),
);
elements.exportCsv.addEventListener("click", () =>
  triggerDownload(createCsvReport(activeAudit), "text/csv;charset=utf-8", "csv"),
);

for (const eventName of ["dragenter", "dragover"]) {
  elements.dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropzone.dataset.dragging = "true";
  });
}
for (const eventName of ["dragleave", "drop"]) {
  elements.dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropzone.dataset.dragging = "false";
  });
}
elements.dropzone.addEventListener("drop", (event) => analyzeFile(event.dataTransfer.files[0]));

window.addEventListener("resize", () => {
  if (activePdf) selectPage(activePage);
});

resetWorkspace();
