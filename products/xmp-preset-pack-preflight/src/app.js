import { auditRelease, reportBaseName, toCsv, toHtml } from "./core.js";
import { readSources, SourceError } from "./file-source.js";
import { parseXmp } from "./xmp-parser.js";

const runtime = { audit: null, errorCode: null };
window.__XMP_PRESET_PACK_PREFLIGHT__ = runtime;

const elements = {
  input: document.querySelector("#release-files"),
  dropZone: document.querySelector("#drop-zone"),
  clear: document.querySelector("#clear-selection"),
  status: document.querySelector("#status"),
  results: document.querySelector("#results"),
  summary: document.querySelector("#summary"),
  rows: document.querySelector("#result-rows"),
  other: document.querySelector("#other-files"),
  csv: document.querySelector("#export-csv"),
  html: document.querySelector("#export-html"),
};

function setStatus(message, state = "idle") {
  elements.status.textContent = message;
  elements.status.dataset.state = state;
}

function node(tag, className, text) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
}

function fact(label, value) {
  const row = node("div", "fact");
  row.append(node("span", "fact-label", label), node("span", "fact-value", value || "—"));
  return row;
}

function summaryCard(label, value) {
  const card = node("div", "summary-card");
  card.append(node("span", "summary-label", label), node("strong", "summary-value", value));
  return card;
}

function findingsCell(result) {
  const cell = node("td", "findings-cell");
  if (!result.findings.length) {
    cell.append(node("span", "pill passed", "passed"));
    return cell;
  }
  for (const item of result.findings) {
    const block = node("div", "finding");
    const heading = node("div", "finding-heading");
    heading.append(node("span", "pill " + item.severity, item.severity), node("strong", "", item.id));
    block.append(heading, node("p", "", item.evidence));
    cell.append(block);
  }
  return cell;
}

function renderResult(result) {
  const row = document.createElement("tr");
  row.dataset.status = result.status;

  const evidence = document.createElement("td");
  evidence.append(node("strong", "path", result.path));
  evidence.append(fact("Bytes", result.size.toLocaleString("en-US")));
  evidence.append(fact("SHA-256", result.hash));

  const identity = document.createElement("td");
  identity.append(fact("Name", result.name));
  identity.append(fact("Group", result.group));
  identity.append(fact("Identifier", result.uuid));
  identity.append(fact("Preset type", result.presetType));

  const presetFacts = document.createElement("td");
  presetFacts.append(fact("Process", result.processVersion));
  presetFacts.append(fact("Profile", result.profileReference));
  presetFacts.append(fact("Active settings", String(result.activeSettingCount)));
  presetFacts.append(fact("Compatibility", Object.entries(result.compatibilityFlags)
    .filter(([, value]) => value !== null)
    .map(([key, value]) => `${key}=${value}`)
    .join(" · ")));

  row.append(evidence, identity, presetFacts, findingsCell(result));
  return row;
}

function render(audit) {
  elements.rows.replaceChildren(...audit.results.map(renderResult));
  elements.summary.replaceChildren(
    summaryCard("XMP files", String(audit.summary.xmpFileCount)),
    summaryCard("Blockers", String(audit.summary.blockerCount)),
    summaryCard("Review", String(audit.summary.reviewCount)),
    summaryCard("Other files", String(audit.summary.otherFileCount)),
  );
  if (audit.otherFindings.length) {
    const heading = node("h3", "", "Other release files");
    const list = node("ul", "other-list");
    for (const item of audit.otherFindings) {
      const entry = document.createElement("li");
      entry.append(node("strong", "", item.path), document.createTextNode(" — " + item.evidence));
      list.append(entry);
    }
    elements.other.replaceChildren(heading, list);
  } else {
    elements.other.replaceChildren();
  }
  elements.results.hidden = false;
  setStatus(
    `${audit.releaseName}: ${audit.summary.blockerCount} blocker(s), ${audit.summary.reviewCount} review finding(s), ${audit.summary.xmpFileCount} XMP file(s).`,
    audit.status,
  );
}

function download(name, contents, type) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([contents], { type }));
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 0);
}

async function runScan(files) {
  runtime.audit = null;
  runtime.errorCode = null;
  elements.results.hidden = true;
  setStatus("Reading the local selection…", "working");
  try {
    const source = await readSources(files);
    setStatus(`Auditing ${source.entries.length} XMP file(s)…`, "working");
    runtime.audit = await auditRelease(source, { parse: parseXmp });
    render(runtime.audit);
  } catch (error) {
    runtime.errorCode = error instanceof SourceError ? error.code : "UNEXPECTED_ERROR";
    setStatus(error.message || "The selection could not be audited.", "error");
  }
}

function clearSelection() {
  elements.input.value = "";
  runtime.audit = null;
  runtime.errorCode = null;
  elements.results.hidden = true;
  setStatus("Choose one ZIP or direct .xmp files to begin.");
}

elements.input.addEventListener("change", () => runScan(elements.input.files));
elements.clear.addEventListener("click", clearSelection);
elements.dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  elements.dropZone.classList.add("dragging");
});
elements.dropZone.addEventListener("dragleave", () => elements.dropZone.classList.remove("dragging"));
elements.dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  elements.dropZone.classList.remove("dragging");
  runScan(event.dataTransfer.files);
});
elements.csv.addEventListener("click", () => {
  if (!runtime.audit) return;
  download(reportBaseName(runtime.audit.releaseName) + ".csv", toCsv(runtime.audit), "text/csv;charset=utf-8");
});
elements.html.addEventListener("click", () => {
  if (!runtime.audit) return;
  download(reportBaseName(runtime.audit.releaseName) + ".html", toHtml(runtime.audit), "text/html;charset=utf-8");
});
