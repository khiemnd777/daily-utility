import { analyzeEntries, createCsvReport, createHtmlReport, PRODUCT_LIMITS } from "./core.js";
import { readSources } from "./file-source.js";
import { parseCubeSource } from "./lut-parser.js";

const elements = {
  input: document.querySelector("#file-input"),
  dropZone: document.querySelector("#drop-zone"),
  status: document.querySelector("#status"),
  results: document.querySelector("#results"),
  releaseMeta: document.querySelector("#release-meta"),
  fileCount: document.querySelector("#file-count"),
  byteCount: document.querySelector("#byte-count"),
  blockerCount: document.querySelector("#blocker-count"),
  reviewCount: document.querySelector("#review-count"),
  duplicateCount: document.querySelector("#duplicate-count"),
  bundleFindings: document.querySelector("#bundle-findings"),
  bundleFindingList: document.querySelector("#bundle-finding-list"),
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

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function findingNode(item) {
  const wrapper = document.createElement("div");
  wrapper.className = `finding ${item.severity}`;
  const id = document.createElement("strong");
  id.textContent = `${item.severity.toUpperCase()} · ${item.id}${item.line ? ` · line ${item.line}` : ""}`;
  const evidence = document.createElement("span");
  evidence.textContent = item.evidence;
  wrapper.append(id, evidence);
  return wrapper;
}

function propertyList(result) {
  const list = document.createElement("dl");
  list.className = "properties";
  const values = [
    ["Type", result.tableType],
    ["Grid", result.gridSize ?? "—"],
    ["Rows", `${result.actualRowCount} / ${result.expectedRowCount ?? "—"}`],
    ["Domain", `${result.domainMin.join(" ")} → ${result.domainMax.join(" ")}`],
    ["Title", result.title || "Not declared"],
    ["Size", formatBytes(result.size)],
  ];
  for (const [label, value] of values) {
    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    description.textContent = String(value);
    list.append(term, description);
  }
  return list;
}

function renderAudit(audit) {
  currentAudit = audit;
  elements.rows.replaceChildren();
  elements.bundleFindingList.replaceChildren();

  for (const item of audit.bundleFindings) {
    const row = document.createElement("li");
    const path = document.createElement("code");
    path.textContent = item.path;
    const evidence = document.createElement("span");
    evidence.textContent = item.evidence;
    row.append(path, evidence);
    elements.bundleFindingList.append(row);
  }
  elements.bundleFindings.hidden = audit.bundleFindings.length === 0;

  for (const result of audit.results) {
    const row = document.createElement("tr");
    const statusCell = document.createElement("td");
    const pill = document.createElement("span");
    pill.className = `status-pill ${result.status}`;
    pill.textContent = result.status;
    statusCell.append(pill);

    const fileCell = document.createElement("td");
    const path = document.createElement("strong");
    path.className = "file-path";
    path.textContent = result.path;
    fileCell.append(path, propertyList(result));

    const hashCell = document.createElement("td");
    const hash = document.createElement("code");
    hash.className = "hash";
    hash.textContent = result.hash;
    hashCell.append(hash);

    const findingCell = document.createElement("td");
    if (!result.findings.length) {
      const passed = document.createElement("span");
      passed.className = "passed-copy";
      passed.textContent = "No structural or bundle findings.";
      findingCell.append(passed);
    } else {
      const list = document.createElement("div");
      list.className = "finding-list";
      list.append(...result.findings.map(findingNode));
      findingCell.append(list);
    }
    row.append(statusCell, fileCell, hashCell, findingCell);
    elements.rows.append(row);
  }

  text(elements.fileCount, audit.summary.fileCount);
  text(elements.byteCount, formatBytes(audit.summary.totalBytes));
  text(elements.blockerCount, audit.summary.blockerCount);
  text(elements.reviewCount, audit.summary.reviewCount);
  text(
    elements.duplicateCount,
    audit.summary.exactDuplicateGroupCount + audit.summary.equivalentPayloadGroupCount,
  );
  text(
    elements.releaseMeta,
    `${audit.releaseName} · scanned ${new Date(audit.scannedAt).toLocaleString()} · ${audit.summary.nonCubeFileCount} non-Cube release file(s)`,
  );
  elements.results.hidden = false;
  elements.results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function reportFilename(extension) {
  const base = (currentAudit?.releaseName || "cube-lut-pack")
    .replace(/\.(zip|cube)$/i, "")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "cube-lut-pack";
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
  window.__CUBE_LUT_PACK_PREFLIGHT__ = { processing: true, limits: PRODUCT_LIMITS };
  try {
    const source = await readSources(fileList);
    setStatus(`Checking ${source.entries.length} CUBE LUT file(s)…`);
    const audit = await analyzeEntries(source.entries, {
      releaseName: source.releaseName,
      nonCubePaths: source.nonCubePaths,
      parse: parseCubeSource,
    });
    renderAudit(audit);
    const message = audit.summary.blockerCount
      ? `Scan complete: ${audit.summary.blockerCount} blocker(s) require attention before release.`
      : audit.summary.reviewCount
        ? `Scan complete: no structural blockers; review ${audit.summary.reviewCount} release finding(s).`
        : `Scan complete: no findings in ${audit.summary.fileCount} CUBE LUT file(s).`;
    setStatus(message, audit.summary.blockerCount ? "error" : "success");
    window.__CUBE_LUT_PACK_PREFLIGHT__ = { processing: false, audit, limits: PRODUCT_LIMITS };
  } catch (error) {
    const code = error?.code || "SCAN_FAILED";
    const message = error instanceof Error ? error.message : "The scan could not be completed.";
    setStatus(message, "error");
    window.__CUBE_LUT_PACK_PREFLIGHT__ = { processing: false, errorCode: code, error: message, limits: PRODUCT_LIMITS };
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
