import { analyzeEntries, createCsvReport, createHtmlReport, PRODUCT_LIMITS } from "./core.js";
import { readSources } from "./file-source.js";
import { parseSvgSource } from "./svg-parser.js";

const elements = {
  input: document.querySelector("#file-input"),
  dropZone: document.querySelector("#drop-zone"),
  status: document.querySelector("#status"),
  results: document.querySelector("#results"),
  bundleMeta: document.querySelector("#bundle-meta"),
  fileCount: document.querySelector("#file-count"),
  blockerCount: document.querySelector("#blocker-count"),
  warningCount: document.querySelector("#warning-count"),
  duplicateCount: document.querySelector("#duplicate-count"),
  rows: document.querySelector("#result-rows"),
  exportCsv: document.querySelector("#export-csv"),
  exportHtml: document.querySelector("#export-html"),
};

let currentAudit = null;

function setStatus(message, kind = "") {
  elements.status.textContent = message;
  elements.status.className = `status${kind ? ` ${kind}` : ""}`;
}

function text(element, value) {
  element.textContent = String(value);
}

function findingNode(item) {
  const wrapper = document.createElement("div");
  wrapper.className = `finding ${item.severity}`;
  const id = document.createElement("strong");
  id.textContent = `${item.severity.toUpperCase()} · ${item.id}`;
  const evidence = document.createElement("span");
  evidence.textContent = item.evidence;
  wrapper.append(id, evidence);
  return wrapper;
}

function renderAudit(audit) {
  currentAudit = audit;
  elements.rows.replaceChildren();
  for (const result of audit.results) {
    const row = document.createElement("tr");
    const statusCell = document.createElement("td");
    const pill = document.createElement("span");
    pill.className = `status-pill ${result.status}`;
    pill.textContent = result.status;
    statusCell.append(pill);

    const pathCell = document.createElement("td");
    pathCell.textContent = result.path;
    const findingCell = document.createElement("td");
    if (!result.findings.length) {
      const passed = document.createElement("span");
      passed.className = "passed-copy";
      passed.textContent = "No static findings.";
      findingCell.append(passed);
    } else {
      const list = document.createElement("div");
      list.className = "finding-list";
      list.append(...result.findings.map(findingNode));
      findingCell.append(list);
    }
    row.append(statusCell, pathCell, findingCell);
    elements.rows.append(row);
  }

  text(elements.fileCount, audit.summary.fileCount);
  text(elements.blockerCount, audit.summary.blockerCount);
  text(elements.warningCount, audit.summary.warningCount);
  text(elements.duplicateCount, audit.summary.duplicateGroupCount);
  text(
    elements.bundleMeta,
    `${audit.bundleName} · scanned ${new Date(audit.scannedAt).toLocaleString()} · ${audit.ignoredFileCount} non-SVG file(s) ignored`,
  );
  elements.results.hidden = false;
  elements.results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function reportFilename(extension) {
  const base = (currentAudit?.bundleName || "svg-bundle")
    .replace(/\.(zip|svg)$/i, "")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "svg-bundle";
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

async function scanFiles(fileList) {
  if (!fileList?.length) return;
  elements.results.hidden = true;
  currentAudit = null;
  setStatus("Reading release files locally…");
  window.__SVG_BUNDLE_PREFLIGHT__ = { processing: true, limits: PRODUCT_LIMITS };
  try {
    const source = await readSources(fileList);
    setStatus(`Checking ${source.entries.length} SVG file(s)…`);
    const audit = await analyzeEntries(source.entries, {
      bundleName: source.bundleName,
      ignoredFileCount: source.ignoredFileCount,
      parse: (value) => parseSvgSource(value),
    });
    renderAudit(audit);
    const message = audit.summary.blockerCount
      ? `Scan complete: ${audit.summary.blockerCount} blocker(s) require attention before release.`
      : audit.summary.warningCount
        ? `Scan complete: no compatibility blockers; review ${audit.summary.warningCount} bundle warning(s).`
        : `Scan complete: no findings in ${audit.summary.fileCount} SVG file(s).`;
    setStatus(message, audit.summary.blockerCount ? "error" : "success");
    window.__SVG_BUNDLE_PREFLIGHT__ = { processing: false, audit, limits: PRODUCT_LIMITS };
  } catch (error) {
    const code = error?.code || "SCAN_FAILED";
    const message = error instanceof Error ? error.message : "The scan could not be completed.";
    setStatus(message, "error");
    window.__SVG_BUNDLE_PREFLIGHT__ = { processing: false, errorCode: code, error: message, limits: PRODUCT_LIMITS };
  }
}

elements.input.addEventListener("change", () => scanFiles(elements.input.files));
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
elements.dropZone.addEventListener("drop", (event) => scanFiles(event.dataTransfer?.files));

elements.exportCsv.addEventListener("click", () => {
  if (currentAudit) download(createCsvReport(currentAudit), "text/csv;charset=utf-8", reportFilename("csv"));
});
elements.exportHtml.addEventListener("click", () => {
  if (currentAudit) download(createHtmlReport(currentAudit), "text/html;charset=utf-8", reportFilename("html"));
});
