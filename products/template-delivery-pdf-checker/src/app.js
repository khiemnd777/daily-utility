import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

import {
  CATEGORY_META,
  PRODUCT_LIMITS,
  auditLinks,
  createCsvReport,
  createMarkdownReport,
  friendlyAnalysisError,
  normalizeViewportRect,
  validateDocumentLimits,
  validateInputFile,
} from "./core.js";
import { extractLinkAnnotations } from "./pdf-analysis.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = __PDF_WORKER_DATA_URL__;

const elements = {
  fileInput: document.querySelector("#pdf-file"),
  dropzone: document.querySelector("#dropzone"),
  chooseButton: document.querySelector("#choose-file"),
  cancelButton: document.querySelector("#cancel-analysis"),
  progress: document.querySelector("#analysis-progress"),
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
let activeAnalysisId = 0;
let activeRenderTask = null;
let activePreviewId = 0;
let resizeTimer = null;

function setStatus(message, tone = "neutral") {
  elements.status.textContent = message;
  elements.status.dataset.tone = tone;
}

function setProcessing(processing) {
  elements.chooseButton.disabled = processing;
  elements.cancelButton.hidden = !processing;
  elements.progress.hidden = !processing;
  if (!processing) elements.progress.removeAttribute("value");
}

function updateProgress({ page, pages, links }) {
  elements.progress.max = pages;
  elements.progress.value = page;
  setStatus(
    `Scanning page ${page} of ${pages} locally… ${links} clickable link${links === 1 ? "" : "s"} found.`,
    "working",
  );
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
  const previewId = ++activePreviewId;
  activePage = Math.max(1, Math.min(Number(pageNumber) || 1, activePdf.numPages));
  renderPagePicker();
  elements.emptyPreview.hidden = true;
  if (activeRenderTask) {
    activeRenderTask.cancel();
    activeRenderTask = null;
  }
  const page = await activePdf.getPage(activePage);
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
  activeRenderTask = page.render({
    canvasContext: context,
    viewport,
    transform: pixelRatio === 1 ? null : [pixelRatio, 0, 0, pixelRatio, 0, 0],
  });
  try {
    await activeRenderTask.promise;
  } catch (error) {
    if (error?.name === "RenderingCancelledException") return;
    throw error;
  } finally {
    if (previewId === activePreviewId) activeRenderTask = null;
  }
  if (previewId !== activePreviewId || !activeAudit) return;

  elements.overlayLayer.replaceChildren();
  elements.overlayLayer.style.width = `${viewport.width}px`;
  elements.overlayLayer.style.height = `${viewport.height}px`;
  const pageRows = activeAudit.rows.filter((row) => row.page === activePage && row.rect);
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
  page.cleanup();
}

function resetWorkspace() {
  activeAnalysisId += 1;
  activePreviewId += 1;
  if (activeRenderTask) activeRenderTask.cancel();
  if (activeLoadingTask) activeLoadingTask.destroy();
  activePdf = null;
  activeLoadingTask = null;
  activeRenderTask = null;
  activeAudit = null;
  activeRecords = [];
  activePage = 1;
  elements.fileInput.value = "";
  elements.workspace.hidden = true;
  elements.previewCanvas.width = 0;
  elements.previewCanvas.height = 0;
  elements.overlayLayer.replaceChildren();
  setProcessing(false);
  setStatus("Choose a delivery PDF to begin.");
  window.__TEMPLATE_DELIVERY_PDF_CHECKER__ = {
    version: "1.0.0",
    processing: false,
    limits: PRODUCT_LIMITS,
  };
}

async function analyzeFile(file) {
  try {
    validateInputFile(file);
  } catch (error) {
    setStatus(friendlyAnalysisError(error), "danger");
    return;
  }

  const analysisId = ++activeAnalysisId;
  if (activeRenderTask) activeRenderTask.cancel();
  if (activeLoadingTask) await activeLoadingTask.destroy();
  activeRenderTask = null;
  activeLoadingTask = null;
  activePdf = null;
  activeAudit = null;
  elements.workspace.hidden = true;
  setStatus("Reading link annotations locally…", "working");
  setProcessing(true);
  window.__TEMPLATE_DELIVERY_PDF_CHECKER__ = {
    version: "1.0.0",
    processing: true,
    limits: PRODUCT_LIMITS,
  };
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (analysisId !== activeAnalysisId) return;
    activeLoadingTask = pdfjsLib.getDocument({
      data: bytes,
      isEvalSupported: false,
      useWorkerFetch: false,
    });
    activePdf = await activeLoadingTask.promise;
    if (analysisId !== activeAnalysisId) return;
    validateDocumentLimits({ pageCount: activePdf.numPages });
    activeRecords = await extractLinkAnnotations(activePdf, {
      maxLinks: PRODUCT_LIMITS.maxLinks,
      shouldCancel: () => analysisId !== activeAnalysisId,
      onProgress: updateProgress,
      yieldControl: () => new Promise((resolve) => setTimeout(resolve, 0)),
    });
    if (analysisId !== activeAnalysisId) return;
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
      limits: PRODUCT_LIMITS,
      audit: activeAudit,
      overlayCount: elements.overlayLayer.childElementCount,
    };
  } catch (error) {
    if (analysisId !== activeAnalysisId || error?.code === "ANALYSIS_CANCELLED") return;
    console.error("PDF analysis failed", error);
    if (activeLoadingTask) await activeLoadingTask.destroy();
    activePdf = null;
    activeLoadingTask = null;
    const message = friendlyAnalysisError(error);
    setStatus(message, "danger");
    elements.workspace.hidden = true;
    window.__TEMPLATE_DELIVERY_PDF_CHECKER__ = {
      version: "1.0.0",
      processing: false,
      limits: PRODUCT_LIMITS,
      error: message,
      errorCode: error?.code || error?.name || "UNKNOWN_ERROR",
    };
  } finally {
    if (analysisId === activeAnalysisId) setProcessing(false);
  }
}

async function cancelAnalysis() {
  if (elements.cancelButton.hidden) return;
  activeAnalysisId += 1;
  activePreviewId += 1;
  if (activeRenderTask) activeRenderTask.cancel();
  if (activeLoadingTask) await activeLoadingTask.destroy();
  activeRenderTask = null;
  activeLoadingTask = null;
  activePdf = null;
  activeAudit = null;
  elements.workspace.hidden = true;
  setProcessing(false);
  setStatus("Check cancelled. Your PDF stayed on this device.", "neutral");
  window.__TEMPLATE_DELIVERY_PDF_CHECKER__ = {
    version: "1.0.0",
    processing: false,
    cancelled: true,
    limits: PRODUCT_LIMITS,
  };
}

elements.chooseButton.addEventListener("click", () => elements.fileInput.click());
elements.fileInput.addEventListener("change", () => analyzeFile(elements.fileInput.files[0]));
elements.resetButton.addEventListener("click", resetWorkspace);
elements.cancelButton.addEventListener("click", cancelAnalysis);
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
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (activePdf) selectPage(activePage);
  }, 150);
});

resetWorkspace();
