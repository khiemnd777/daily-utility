import { analyzePresentation, createCsvReport, createHtmlReport } from "./core.js";
import { PRODUCT_LIMITS } from "./limits.js";
import { readPresentationPackage } from "./package-reader.js";

const elements = {
  input: document.querySelector("#file-input"),
  dropZone: document.querySelector("#drop-zone"),
  status: document.querySelector("#status"),
  results: document.querySelector("#results"),
  fileMeta: document.querySelector("#file-meta"),
  slideCount: document.querySelector("#slide-count"),
  structureCount: document.querySelector("#structure-count"),
  relationshipCount: document.querySelector("#relationship-count"),
  blockerCount: document.querySelector("#blocker-count"),
  warningCount: document.querySelector("#warning-count"),
  dimensionValue: document.querySelector("#dimension-value"),
  fontSummary: document.querySelector("#font-summary"),
  rows: document.querySelector("#finding-rows"),
  exportCsv: document.querySelector("#export-csv"),
  exportHtml: document.querySelector("#export-html"),
};

let currentAudit = null;

function setStatus(message, kind = "") {
  elements.status.textContent = message;
  elements.status.className = `status${kind ? ` ${kind}` : ""}`;
}

function setText(element, value) {
  element.textContent = String(value);
}

function findingRow(item) {
  const row = document.createElement("tr");
  const severityCell = document.createElement("td");
  const pill = document.createElement("span");
  pill.className = `severity-pill ${item.severity}`;
  pill.textContent = item.severity;
  severityCell.append(pill);

  const checkCell = document.createElement("td");
  const checkId = document.createElement("strong");
  checkId.textContent = item.id;
  const title = document.createElement("span");
  title.textContent = item.title;
  checkCell.append(checkId, title);

  const locationCell = document.createElement("td");
  locationCell.textContent = `${item.slide ? `Slide ${item.slide} · ` : ""}${item.part}`;
  const evidenceCell = document.createElement("td");
  evidenceCell.textContent = item.evidence;
  row.append(severityCell, checkCell, locationCell, evidenceCell);
  return row;
}

function renderAudit(audit) {
  currentAudit = audit;
  elements.rows.replaceChildren();
  const displayFindings = audit.findings.length
    ? audit.findings
    : [{ id: "passed", severity: "info", title: "No static findings", evidence: "Every inspected rule passed.", part: "ppt/presentation.xml", slide: null }];
  elements.rows.append(...displayFindings.map(findingRow));

  const dimensions = audit.inventory.dimensions;
  setText(elements.slideCount, audit.inventory.slideCount);
  setText(elements.structureCount, `${audit.inventory.layoutCount} / ${audit.inventory.masterCount}`);
  setText(elements.relationshipCount, `${audit.inventory.resolvedRelationshipCount} / ${audit.inventory.externalRelationshipCount}`);
  setText(elements.blockerCount, audit.summary.blockerCount);
  setText(elements.warningCount, audit.summary.warningCount);
  setText(
    elements.dimensionValue,
    dimensions ? `${dimensions.aspectRatio} · ${dimensions.widthInches} × ${dimensions.heightInches} in` : "Not declared",
  );
  setText(
    elements.fontSummary,
    `${audit.fonts.referenced.length} referenced · ${audit.fonts.embedded.length} embedded record(s) · ${audit.fonts.unembedded.length} portability warning(s)`,
  );
  setText(
    elements.fileMeta,
    `${audit.file.name} · ${audit.file.size.toLocaleString("en-US")} bytes · SHA-256 ${audit.file.sha256} · scanned ${new Date(audit.file.scannedAt).toLocaleString("en-US")}`,
  );
  elements.results.hidden = false;
  elements.results.focus({ preventScroll: true });
  elements.results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function reportFilename(extension) {
  const base = (currentAudit?.file.name || "presentation-template")
    .replace(/\.(?:pptx|potx)$/i, "")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "presentation-template";
  return `${base}-preflight-report.${extension}`;
}

function download(content, type, filename) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function scanFile(file) {
  if (!file) return;
  elements.results.hidden = true;
  currentAudit = null;
  setStatus("Reading the PowerPoint package locally…");
  window.__PRESENTATION_TEMPLATE_PREFLIGHT__ = { processing: true, limits: PRODUCT_LIMITS };
  try {
    const packageData = await readPresentationPackage(file);
    setStatus(`Inspecting ${packageData.paths.size.toLocaleString("en-US")} package part(s)…`);
    const audit = await analyzePresentation(packageData);
    renderAudit(audit);
    const message = audit.summary.blockerCount
      ? `Preflight complete: ${audit.summary.blockerCount} blocker(s) require attention before delivery.`
      : audit.summary.warningCount
        ? `Preflight complete: no blockers; review ${audit.summary.warningCount} warning(s).`
        : "Preflight complete: every inspected rule passed.";
    setStatus(message, audit.summary.blockerCount ? "error" : "success");
    window.__PRESENTATION_TEMPLATE_PREFLIGHT__ = { processing: false, audit, limits: PRODUCT_LIMITS };
  } catch (error) {
    const code = error?.code || "SCAN_FAILED";
    const message = error instanceof Error ? error.message : "The presentation could not be checked.";
    setStatus(message, "error");
    window.__PRESENTATION_TEMPLATE_PREFLIGHT__ = { processing: false, errorCode: code, error: message, limits: PRODUCT_LIMITS };
  }
}

function scanSelection(fileList) {
  const files = Array.from(fileList || []);
  if (files.length === 1) return scanFile(files[0]);
  const message = "Choose exactly one .pptx or .potx presentation template.";
  setStatus(message, "error");
  window.__PRESENTATION_TEMPLATE_PREFLIGHT__ = {
    processing: false,
    errorCode: "INVALID_SELECTION",
    error: message,
    limits: PRODUCT_LIMITS,
  };
  return Promise.resolve();
}

elements.input.addEventListener("change", () => scanSelection(elements.input.files));
for (const eventName of ["dragenter", "dragover"]) {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.add("is-dragging");
  });
}
for (const eventName of ["dragleave", "drop"]) {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.remove("is-dragging");
  });
}
elements.dropZone.addEventListener("drop", (event) => scanSelection(event.dataTransfer?.files));

elements.exportCsv.addEventListener("click", () => {
  if (currentAudit) download(createCsvReport(currentAudit), "text/csv;charset=utf-8", reportFilename("csv"));
});
elements.exportHtml.addEventListener("click", () => {
  if (currentAudit) download(createHtmlReport(currentAudit), "text/html;charset=utf-8", reportFilename("html"));
});
