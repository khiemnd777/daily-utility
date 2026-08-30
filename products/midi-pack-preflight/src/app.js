import { auditRelease, reportBaseName, toCsv, toHtml } from "./core.js";
import { readSources, SourceError } from "./file-source.js";
import { parseMidi } from "./midi-parser.js";

const runtime = { audit: null, errorCode: null };
window.__MIDI_PACK_PREFLIGHT__ = runtime;

const elements = {
  input: document.querySelector("#release-files"),
  dropzone: document.querySelector("#dropzone"),
  status: document.querySelector("#status"),
  results: document.querySelector("#results"),
  summary: document.querySelector("#summary"),
  tableBody: document.querySelector("#results-body"),
  otherFiles: document.querySelector("#other-files"),
  otherFilesList: document.querySelector("#other-files-list"),
  exportCsv: document.querySelector("#export-csv"),
  exportHtml: document.querySelector("#export-html"),
  clear: document.querySelector("#clear"),
};

function node(name, { className, text } = {}) {
  const element = document.createElement(name);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function setStatus(message, tone = "neutral") {
  elements.status.textContent = message;
  elements.status.dataset.tone = tone;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function valueOrDash(value) {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

function appendFact(parent, label, value) {
  const wrapper = node("div", { className: "fact" });
  wrapper.append(node("dt", { text: label }), node("dd", { text: valueOrDash(value) }));
  parent.append(wrapper);
}

function summaryCard(label, value, tone) {
  const card = node("article", { className: `summary-card ${tone || ""}`.trim() });
  card.append(node("span", { text: label }), node("strong", { text: value }));
  return card;
}

function renderFindings(result) {
  if (!result.findings.length) return node("span", { className: "badge passed", text: "passed" });
  const list = node("ul", { className: "finding-list" });
  for (const finding of result.findings) {
    const item = node("li");
    const heading = node("div", { className: "finding-heading" });
    heading.append(
      node("span", { className: `badge ${finding.severity}`, text: finding.severity }),
      node("code", { text: finding.id }),
    );
    item.append(heading, node("p", { text: finding.evidence }));
    if (finding.track !== null || finding.offset !== null) {
      item.append(node("small", {
        text: [
          finding.track !== null ? `Track ${finding.track + 1}` : null,
          finding.offset !== null ? `byte ${finding.offset}` : null,
        ].filter(Boolean).join(" · "),
      }));
    }
    list.append(item);
  }
  return list;
}

function renderAudit(audit) {
  elements.summary.replaceChildren(
    summaryCard("MIDI files", String(audit.summary.midiFileCount)),
    summaryCard("Blockers", String(audit.summary.blockerCount), audit.summary.blockerCount ? "danger" : ""),
    summaryCard("Review", String(audit.summary.reviewCount), audit.summary.reviewCount ? "warning" : ""),
    summaryCard("Passed files", String(audit.summary.passedCount), "success"),
  );
  elements.tableBody.replaceChildren();

  for (const result of audit.results) {
    const row = node("tr");
    const fileCell = node("td");
    fileCell.append(
      node("strong", { className: "path", text: result.path }),
      node("span", { className: "muted", text: formatBytes(result.size) }),
      node("code", { className: "hash", text: result.hash }),
    );

    const structureCell = node("td");
    const structure = node("dl", { className: "fact-list" });
    appendFact(structure, "Format", result.format === null ? "Unavailable" : `SMF ${result.format}`);
    appendFact(structure, "Timing", result.timingLabel);
    appendFact(structure, "Tracks", `${result.parsedTrackCount} parsed / ${valueOrDash(result.declaredTrackCount)} declared`);
    appendFact(structure, "Channels", result.channels.length ? result.channels.join(", ") : "None");
    structureCell.append(structure);

    const musicalCell = node("td");
    const musical = node("dl", { className: "fact-list" });
    appendFact(musical, "Note-on", result.noteOnCount);
    appendFact(musical, "Pitch", result.pitchMin === null ? "None" : `${result.pitchMin}–${result.pitchMax}`);
    appendFact(musical, "Velocity", result.velocityMin === null ? "None" : `${result.velocityMin}–${result.velocityMax}`);
    appendFact(musical, "Length", `${result.tickLength} ticks`);
    appendFact(musical, "Duration", result.durationSeconds === null ? "Unavailable" : `${result.durationSeconds.toFixed(3)} s`);
    appendFact(musical, "Tempo", result.tempos.length ? result.tempos.map((item) => `${item.bpm.toFixed(2)} BPM`).join(", ") : "Default 120 BPM");
    musicalCell.append(musical);

    const findingsCell = node("td");
    findingsCell.append(renderFindings(result));
    row.append(fileCell, structureCell, musicalCell, findingsCell);
    elements.tableBody.append(row);
  }

  elements.otherFilesList.replaceChildren();
  elements.otherFiles.hidden = audit.nonMidiFindings.length === 0;
  for (const item of audit.nonMidiFindings) {
    const entry = node("li");
    entry.append(node("strong", { text: item.path }), node("span", { text: item.evidence }));
    elements.otherFilesList.append(entry);
  }

  elements.results.hidden = false;
  elements.exportCsv.disabled = false;
  elements.exportHtml.disabled = false;
  elements.clear.disabled = false;
  const tone = audit.status === "blocked" ? "danger" : audit.status === "review" ? "warning" : "success";
  setStatus(
    `${audit.releaseName}: ${audit.summary.blockerCount} blocker(s), ${audit.summary.reviewCount} review finding(s), ${audit.summary.midiFileCount} MIDI file(s).`,
    tone,
  );
}

async function runScan(fileList) {
  runtime.audit = null;
  runtime.errorCode = null;
  elements.results.hidden = true;
  elements.exportCsv.disabled = true;
  elements.exportHtml.disabled = true;
  elements.clear.disabled = true;
  setStatus("Reading release files locally…", "working");
  try {
    const source = await readSources(fileList);
    setStatus(`Auditing ${source.entries.length} MIDI file(s)…`, "working");
    const audit = await auditRelease(source, { parse: parseMidi });
    runtime.audit = audit;
    renderAudit(audit);
  } catch (error) {
    runtime.errorCode = error instanceof SourceError ? error.code : "UNEXPECTED_ERROR";
    setStatus(error instanceof SourceError ? error.message : "The release could not be scanned. Try a smaller, supported selection.", "danger");
    elements.clear.disabled = false;
    if (!(error instanceof SourceError)) console.error(error);
  }
}

function download(name, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

elements.input.addEventListener("change", () => {
  if (elements.input.files.length) runScan(elements.input.files);
});
elements.dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  elements.dropzone.dataset.dragging = "true";
});
elements.dropzone.addEventListener("dragleave", () => delete elements.dropzone.dataset.dragging);
elements.dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  delete elements.dropzone.dataset.dragging;
  if (event.dataTransfer?.files?.length) runScan(event.dataTransfer.files);
});
elements.exportCsv.addEventListener("click", () => {
  if (!runtime.audit) return;
  download(`${reportBaseName(runtime.audit.releaseName)}.csv`, "text/csv;charset=utf-8", toCsv(runtime.audit));
});
elements.exportHtml.addEventListener("click", () => {
  if (!runtime.audit) return;
  download(`${reportBaseName(runtime.audit.releaseName)}.html`, "text/html;charset=utf-8", toHtml(runtime.audit));
});
elements.clear.addEventListener("click", () => {
  runtime.audit = null;
  runtime.errorCode = null;
  elements.input.value = "";
  elements.results.hidden = true;
  elements.summary.replaceChildren();
  elements.tableBody.replaceChildren();
  elements.exportCsv.disabled = true;
  elements.exportHtml.disabled = true;
  elements.clear.disabled = true;
  setStatus("No release selected. Your files stay on this device.");
});
