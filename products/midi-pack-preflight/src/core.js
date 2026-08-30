export const PRODUCT_LIMITS = Object.freeze({
  maxSelectedFiles: 2000,
  maxArchiveBytes: 100 * 1024 * 1024,
  maxExpandedBytes: 150 * 1024 * 1024,
  maxMidiBytes: 10 * 1024 * 1024,
  maxMidiFiles: 2000,
  maxArchiveEntries: 5000,
  maxPathLength: 240,
});

const LIMITS_TEXT = "100 MB ZIP · 150 MB expanded · 2,000 MIDI files · 10 MB per MIDI · 5,000 entries · 240-character paths";
const LIMITATIONS = [
  "Structural preflight is not MIDI repair, musical review, rights advice, or a universal compatibility guarantee.",
  "Format 2, SMPTE timing, system-exclusive data, non-ASCII text, and unmatched notes are review signals, not automatic proof of failure.",
  "Probable performance duplicates ignore non-performance text labels and serialization differences; they are not proof of copying.",
  "Nested archives and non-MIDI files are inventoried but not opened or scanned.",
  "Test representative files in every DAW, plugin, instrument, or device you claim to support.",
];

function compareText(left, right) {
  return left === right ? 0 : left < right ? -1 : 1;
}

function bundleFinding(id, severity, evidence, path) {
  return { id, severity, evidence, offset: null, track: null, path };
}

function addFinding(result, item) {
  const key = `${item.id}\u0000${item.severity}\u0000${item.evidence}`;
  if (!result.findings.some((entry) => `${entry.id}\u0000${entry.severity}\u0000${entry.evidence}` === key)) {
    result.findings.push(item);
  }
}

function statusFor(findings) {
  if (findings.some((item) => item.severity === "blocker")) return "blocked";
  if (findings.some((item) => item.severity === "review")) return "review";
  return "passed";
}

function groupBy(results, keyFor) {
  const grouped = new Map();
  for (const result of results) {
    const key = keyFor(result);
    if (!key) continue;
    grouped.set(key, [...(grouped.get(key) || []), result]);
  }
  return [...grouped.values()];
}

function paths(group) {
  return group.map((result) => result.path).sort(compareText);
}

export async function sha256Hex(bytes, cryptoApi = globalThis.crypto) {
  if (!cryptoApi?.subtle) throw new Error("This browser does not support SHA-256 hashing.");
  const view = bytes instanceof Uint8Array ? bytes : new TextEncoder().encode(String(bytes));
  const digest = await cryptoApi.subtle.digest("SHA-256", view);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingLabel(timing) {
  if (!timing) return "unavailable";
  if (timing.mode === "ppq") return `${timing.ticksPerQuarter} PPQ`;
  return `${timing.framesPerSecond ?? "invalid"} fps × ${timing.ticksPerFrame} ticks/frame`;
}

export async function analyzeEntries(entries, { parse, cryptoApi = globalThis.crypto }) {
  const results = [];
  for (const entry of entries) {
    const snapshot = parse(entry.bytes);
    const hash = await sha256Hex(entry.bytes, cryptoApi);
    const performanceHash = snapshot.performancePayload
      ? await sha256Hex(new TextEncoder().encode(snapshot.performancePayload), cryptoApi)
      : null;
    results.push({
      path: entry.path,
      size: entry.bytes.byteLength,
      hash,
      performanceHash,
      format: snapshot.format,
      timing: snapshot.timing,
      timingLabel: timingLabel(snapshot.timing),
      declaredTrackCount: snapshot.declaredTrackCount,
      parsedTrackCount: snapshot.parsedTrackCount,
      trackNames: snapshot.trackNames,
      channels: snapshot.channels,
      noteOnCount: snapshot.noteOnCount,
      pitchMin: snapshot.pitchMin,
      pitchMax: snapshot.pitchMax,
      velocityMin: snapshot.velocityMin,
      velocityMax: snapshot.velocityMax,
      tickLength: snapshot.tickLength,
      durationSeconds: snapshot.durationSeconds,
      tempos: snapshot.tempos,
      keySignatures: snapshot.keySignatures,
      timeSignatures: snapshot.timeSignatures,
      sysexCount: snapshot.sysexCount,
      findings: snapshot.findings.map((item) => ({ ...item, path: entry.path })),
    });
  }

  const exactDuplicateGroups = groupBy(results, (result) => result.hash)
    .filter((group) => group.length > 1)
    .map(paths);
  for (const group of exactDuplicateGroups) {
    for (const path of group) {
      addFinding(
        results.find((result) => result.path === path),
        bundleFinding("exact-duplicate", "review", `Identical bytes also appear at: ${group.filter((item) => item !== path).join(", ")}`, path),
      );
    }
  }

  const performanceDuplicateGroups = groupBy(results, (result) => result.performanceHash)
    .filter((group) => group.length > 1 && new Set(group.map((result) => result.hash)).size > 1)
    .map(paths);
  for (const group of performanceDuplicateGroups) {
    for (const path of group) {
      addFinding(
        results.find((result) => result.path === path),
        bundleFinding(
          "probable-performance-duplicate",
          "review",
          `The normalized performance stream also appears at: ${group.filter((item) => item !== path).join(", ")}`,
          path,
        ),
      );
    }
  }

  const caseCollisionGroups = groupBy(results, (result) => result.path.toLocaleLowerCase("en-US"))
    .filter((group) => new Set(group.map((result) => result.path)).size > 1)
    .map(paths);
  for (const group of caseCollisionGroups) {
    for (const path of group) {
      addFinding(
        results.find((result) => result.path === path),
        bundleFinding("case-insensitive-path-collision", "blocker", `Path collides on case-insensitive systems with: ${group.filter((item) => item !== path).join(", ")}`, path),
      );
    }
  }

  for (const result of results) {
    result.findings.sort((left, right) => left.severity.localeCompare(right.severity) || left.id.localeCompare(right.id));
    result.status = statusFor(result.findings);
  }
  results.sort((left, right) => compareText(left.path, right.path));
  return { results, exactDuplicateGroups, performanceDuplicateGroups, caseCollisionGroups };
}

export async function auditRelease(source, { parse, cryptoApi = globalThis.crypto, scanTimestamp = new Date().toISOString() }) {
  const analyzed = await analyzeEntries(source.entries, { parse, cryptoApi });
  const sortedNonMidiPaths = [...source.nonMidiPaths].sort(compareText);
  const nonMidiFindings = sortedNonMidiPaths.map((path) =>
    bundleFinding(
      path.toLowerCase().endsWith(".zip") ? "nested-archive-not-opened" : "non-midi-release-file",
      "review",
      path.toLowerCase().endsWith(".zip")
        ? "Nested archive is inventoried but not opened."
        : "Confirm this non-MIDI file is intentional buyer content.",
      path,
    ),
  );
  const blockerCount = analyzed.results.reduce(
    (sum, result) => sum + result.findings.filter((item) => item.severity === "blocker").length,
    0,
  );
  const reviewCount = analyzed.results.reduce(
    (sum, result) => sum + result.findings.filter((item) => item.severity === "review").length,
    nonMidiFindings.length,
  );
  const audit = {
    product: "MIDI Pack Preflight",
    version: "1.0.0",
    releaseName: source.releaseName,
    scanTimestamp,
    limits: { ...PRODUCT_LIMITS, display: LIMITS_TEXT },
    limitations: LIMITATIONS,
    ...analyzed,
    nonMidiPaths: sortedNonMidiPaths,
    nonMidiFindings,
    summary: {
      midiFileCount: analyzed.results.length,
      midiByteCount: analyzed.results.reduce((sum, result) => sum + result.size, 0),
      nonMidiFileCount: source.nonMidiPaths.length,
      blockerCount,
      reviewCount,
      passedCount: analyzed.results.filter((result) => result.status === "passed").length,
    },
  };
  audit.status = blockerCount ? "blocked" : reviewCount ? "review" : "passed";
  return audit;
}

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function compactList(values, render) {
  return values.map(render).join(" | ");
}

function factRow(audit, result, item = null) {
  return [
    audit.releaseName,
    audit.scanTimestamp,
    audit.limits.display,
    audit.summary.midiFileCount,
    audit.summary.nonMidiFileCount,
    audit.summary.blockerCount,
    audit.summary.reviewCount,
    result.path,
    result.size,
    result.hash,
    result.format,
    result.timingLabel,
    result.declaredTrackCount,
    result.parsedTrackCount,
    result.trackNames.join(" | "),
    result.channels.join(" | "),
    result.noteOnCount,
    result.pitchMin === null ? "" : `${result.pitchMin}-${result.pitchMax}`,
    result.velocityMin === null ? "" : `${result.velocityMin}-${result.velocityMax}`,
    result.tickLength,
    result.durationSeconds === null ? "" : result.durationSeconds.toFixed(6),
    compactList(result.tempos, (event) => `${event.tick}:${event.bpm.toFixed(3)}bpm`),
    compactList(result.keySignatures, (event) => `${event.tick}:${event.value}`),
    compactList(result.timeSignatures, (event) => `${event.tick}:${event.value}`),
    result.sysexCount,
    result.status,
    item?.id || "",
    item?.severity || "",
    item?.track ?? "",
    item?.offset ?? "",
    item?.evidence || "",
  ];
}

export function toCsv(audit) {
  const header = [
    "release_name", "scan_timestamp", "configured_limits", "midi_file_total", "non_midi_file_total",
    "blocker_total", "review_total", "path", "byte_size", "sha256", "smf_format", "timing",
    "declared_tracks", "parsed_tracks", "track_names", "channels", "note_on_count", "pitch_range",
    "velocity_range", "tick_length", "duration_seconds", "tempo_events", "key_signatures",
    "time_signatures", "sysex_count", "status", "check_id", "severity", "track_index", "byte_offset", "evidence",
  ];
  const rows = [header];
  for (const result of audit.results) {
    if (result.findings.length) for (const item of result.findings) rows.push(factRow(audit, result, item));
    else rows.push(factRow(audit, result));
  }
  for (const item of audit.nonMidiFindings) {
    rows.push([
      audit.releaseName, audit.scanTimestamp, audit.limits.display, audit.summary.midiFileCount,
      audit.summary.nonMidiFileCount, audit.summary.blockerCount, audit.summary.reviewCount,
      item.path, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
      "review", item.id, item.severity, "", "", item.evidence,
    ]);
  }
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function findingMarkup(findings) {
  if (!findings.length) return '<span class="pill passed">passed</span>';
  return `<ul>${findings.map((item) => `<li><strong>${escapeHtml(item.id)}</strong> <span class="pill ${escapeHtml(item.severity)}">${escapeHtml(item.severity)}</span><br>${escapeHtml(item.evidence)}</li>`).join("")}</ul>`;
}

export function toHtml(audit) {
  const rows = audit.results.map((result) => `
    <tr>
      <td><strong>${escapeHtml(result.path)}</strong><br><code>${escapeHtml(result.hash)}</code></td>
      <td>Format ${escapeHtml(result.format ?? "—")}<br>${escapeHtml(result.timingLabel)}<br>${result.parsedTrackCount} track(s)</td>
      <td>${result.noteOnCount} note-on<br>${result.pitchMin === null ? "No pitch range" : `Pitch ${result.pitchMin}–${result.pitchMax}`}<br>${result.durationSeconds === null ? "Duration unavailable" : `${result.durationSeconds.toFixed(3)} seconds`}</td>
      <td>${findingMarkup(result.findings)}</td>
    </tr>`).join("");
  const nonMidi = audit.nonMidiFindings.length
    ? `<h2>Other release files</h2><ul>${audit.nonMidiFindings.map((item) => `<li><strong>${escapeHtml(item.path)}</strong> — ${escapeHtml(item.evidence)}</li>`).join("")}</ul>`
    : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; connect-src 'none'; script-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
<title>${escapeHtml(audit.releaseName)} — MIDI Pack Preflight report</title>
<style>body{max-width:1180px;margin:40px auto;padding:0 24px;color:#17211d;background:#f4f8f5;font:15px/1.5 system-ui,sans-serif}header,section{background:#fff;border:1px solid #cfddd4;border-radius:16px;padding:24px;margin-bottom:18px}h1{margin:0 0 6px;font:700 36px/1.1 Georgia,serif}h2{margin-top:26px}dl{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}dt{color:#5b6a62;font-size:12px;text-transform:uppercase}dd{margin:2px 0 0;font-size:22px;font-weight:700}table{width:100%;border-collapse:collapse}th,td{padding:12px;border-bottom:1px solid #dce6df;text-align:left;vertical-align:top}th{color:#536158;font-size:12px;text-transform:uppercase}code{font-size:11px;overflow-wrap:anywhere}.pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:700}.passed{background:#dff6e8;color:#155d35}.review{background:#fff1c9;color:#765100}.blocker{background:#ffe0dd;color:#862b22}li{margin:7px 0}@media(max-width:760px){dl{grid-template-columns:1fr 1fr}table{display:block;overflow:auto}}</style></head>
<body><header><p>MIDI Pack Preflight 1.0.0</p><h1>${escapeHtml(audit.releaseName)}</h1><p>Scanned ${escapeHtml(audit.scanTimestamp)} · ${escapeHtml(audit.limits.display)}</p><dl><div><dt>MIDI files</dt><dd>${audit.summary.midiFileCount}</dd></div><div><dt>Blockers</dt><dd>${audit.summary.blockerCount}</dd></div><div><dt>Review</dt><dd>${audit.summary.reviewCount}</dd></div><div><dt>Status</dt><dd>${escapeHtml(audit.status)}</dd></div></dl></header>
<section><h2>File evidence</h2><table><thead><tr><th>Path and SHA-256</th><th>Structure</th><th>Musical facts</th><th>Findings</th></tr></thead><tbody>${rows}</tbody></table>${nonMidi}</section>
<section><h2>Important limits</h2><ul>${audit.limitations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul><p>Inputs were read locally and were not modified. This report is evidence from deterministic static checks, not certification.</p></section></body></html>`;
}

export function reportBaseName(releaseName) {
  const base = String(releaseName).replace(/\.(zip|mid|midi)$/i, "").replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "");
  return `${base || "midi-pack"}-preflight-report`;
}
