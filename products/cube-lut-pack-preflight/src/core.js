export const PRODUCT_LIMITS = Object.freeze({
  maxSelectedFiles: 100,
  maxArchiveBytes: 100 * 1024 * 1024,
  maxExpandedBytes: 150 * 1024 * 1024,
  maxLutBytes: 20 * 1024 * 1024,
  maxLutFiles: 100,
  maxArchiveEntries: 1000,
  maxPathLength: 240,
});

function finding(id, severity, evidence, line = null, path = null) {
  return { id, severity, evidence, line, path };
}

function addFinding(result, item) {
  const key = `${item.id}\u0000${item.severity}\u0000${item.line ?? ""}\u0000${item.evidence}`;
  if (!result.findings.some((entry) => `${entry.id}\u0000${entry.severity}\u0000${entry.line ?? ""}\u0000${entry.evidence}` === key)) {
    result.findings.push(item);
  }
}

function statusFor(findings) {
  if (findings.some((item) => item.severity === "blocker")) return "blocked";
  if (findings.some((item) => item.severity === "review")) return "review";
  return "passed";
}

function compareText(left, right) {
  return left === right ? 0 : left < right ? -1 : 1;
}

export async function sha256Hex(bytes, cryptoApi = globalThis.crypto) {
  if (!cryptoApi?.subtle) throw new Error("This browser does not support SHA-256 hashing.");
  const view = bytes instanceof Uint8Array ? bytes : new TextEncoder().encode(String(bytes));
  const digest = await cryptoApi.subtle.digest("SHA-256", view);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function grouped(results, keyFor) {
  const groups = new Map();
  for (const result of results) {
    const key = keyFor(result);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) || []), result]);
  }
  return [...groups.values()];
}

function pathsFor(group) {
  return group.map((result) => result.path).sort(compareText);
}

export async function analyzeEntries(entries, options) {
  const parse = options.parse;
  const cryptoApi = options.cryptoApi || globalThis.crypto;
  const results = [];

  for (const entry of entries) {
    const snapshot = parse(entry.text);
    const hash = await sha256Hex(entry.bytes, cryptoApi);
    const payloadHash = snapshot.equivalencePayload
      ? await sha256Hex(new TextEncoder().encode(snapshot.equivalencePayload), cryptoApi)
      : null;
    results.push({
      path: entry.path,
      size: entry.bytes.byteLength,
      hash,
      payloadHash,
      title: snapshot.title,
      tableType: snapshot.tableType,
      gridSize: snapshot.size,
      domainMin: snapshot.domainMin,
      domainMax: snapshot.domainMax,
      expectedRowCount: snapshot.expectedRowCount,
      actualRowCount: snapshot.actualRowCount,
      findings: snapshot.findings.map((item) => ({ ...item, path: entry.path })),
    });
  }

  const exactDuplicateGroups = grouped(results, (result) => result.hash)
    .filter((group) => group.length > 1)
    .map(pathsFor);
  for (const paths of exactDuplicateGroups) {
    for (const path of paths) {
      addFinding(
        results.find((result) => result.path === path),
        finding("exact-duplicate", "review", `Identical bytes also appear at: ${paths.filter((item) => item !== path).join(", ")}`, null, path),
      );
    }
  }

  const equivalentPayloadGroups = grouped(results, (result) => result.payloadHash)
    .filter((group) => group.length > 1 && new Set(group.map((result) => result.hash)).size > 1)
    .map(pathsFor);
  for (const paths of equivalentPayloadGroups) {
    for (const path of paths) {
      addFinding(
        results.find((result) => result.path === path),
        finding(
          "equivalent-table-payload",
          "review",
          `The parsed type, domain, and table values also appear at: ${paths.filter((item) => item !== path).join(", ")}`,
          null,
          path,
        ),
      );
    }
  }

  const duplicateTitleGroups = grouped(results, (result) => result.title.trim().toLocaleLowerCase("en-US"))
    .filter((group) => group.length > 1 && new Set(group.map((result) => result.payloadHash || result.hash)).size > 1)
    .map(pathsFor);
  for (const paths of duplicateTitleGroups) {
    for (const path of paths) {
      addFinding(
        results.find((result) => result.path === path),
        finding("duplicate-title", "review", `The same TITLE is used by distinct LUT data at: ${paths.join(", ")}`, null, path),
      );
    }
  }

  const caseCollisionGroups = grouped(results, (result) => result.path.toLocaleLowerCase("en-US"))
    .filter((group) => new Set(group.map((result) => result.path)).size > 1)
    .map(pathsFor);
  for (const paths of caseCollisionGroups) {
    for (const path of paths) {
      addFinding(
        results.find((result) => result.path === path),
        finding("case-path-collision", "review", `Case-insensitive path collision with: ${paths.filter((item) => item !== path).join(", ")}`, null, path),
      );
    }
  }

  const gridSignatures = new Set(
    results.filter((result) => result.gridSize !== null).map((result) => `${result.tableType}:${result.gridSize}`),
  );
  if (gridSignatures.size > 1) {
    const evidence = `Release contains mixed declared grids: ${[...gridSignatures].sort(compareText).join(", ")}.`;
    for (const result of results) addFinding(result, finding("mixed-grid-size", "review", evidence, null, result.path));
  }

  const bundleFindings = (options.nonCubePaths || []).map((path) =>
    finding("non-cube-file", "review", "A non-.cube file is present in the release ZIP; confirm it is intentional buyer content.", null, path),
  );

  results.sort((left, right) => compareText(left.path, right.path));
  for (const result of results) {
    result.findings.sort((left, right) => (left.line ?? Number.MAX_SAFE_INTEGER) - (right.line ?? Number.MAX_SAFE_INTEGER) || left.id.localeCompare(right.id));
    result.status = statusFor(result.findings);
  }

  const allFindings = [...results.flatMap((result) => result.findings), ...bundleFindings];
  const totalBytes = results.reduce((sum, result) => sum + result.size, 0);
  return {
    releaseName: options.releaseName,
    scannedAt: options.scannedAt || new Date().toISOString(),
    results,
    bundleFindings,
    exactDuplicateGroups,
    equivalentPayloadGroups,
    duplicateTitleGroups,
    caseCollisionGroups,
    summary: {
      fileCount: results.length,
      totalBytes,
      blockerCount: allFindings.filter((item) => item.severity === "blocker").length,
      reviewCount: allFindings.filter((item) => item.severity === "review").length,
      blockedFileCount: results.filter((result) => result.status === "blocked").length,
      reviewFileCount: results.filter((result) => result.status === "review").length,
      passedFileCount: results.filter((result) => result.status === "passed").length,
      exactDuplicateGroupCount: exactDuplicateGroups.length,
      equivalentPayloadGroupCount: equivalentPayloadGroups.length,
      duplicateTitleGroupCount: duplicateTitleGroups.length,
      caseCollisionGroupCount: caseCollisionGroups.length,
      nonCubeFileCount: bundleFindings.length,
    },
  };
}

function csvCell(value) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function domainText(values) {
  return Array.isArray(values) ? values.join(" ") : "";
}

function reportRows(audit) {
  const rows = [];
  for (const result of audit.results) {
    const findings = result.findings.length
      ? result.findings
      : [finding("passed", "info", "No structural or bundle findings.", null, result.path)];
    for (const item of findings) rows.push({ result, item });
  }
  for (const item of audit.bundleFindings) rows.push({ result: null, item });
  return rows;
}

export function createCsvReport(audit) {
  const columns = [
    "release_name",
    "scan_timestamp",
    "lut_file_total",
    "lut_byte_total",
    "blocker_total",
    "review_total",
    "path",
    "byte_size",
    "sha256",
    "table_type",
    "title",
    "grid_size",
    "domain_min",
    "domain_max",
    "expected_rows",
    "actual_rows",
    "status",
    "check_id",
    "severity",
    "line",
    "evidence",
  ];
  const rows = [columns];
  for (const { result, item } of reportRows(audit)) {
    rows.push([
      audit.releaseName,
      audit.scannedAt,
      audit.summary.fileCount,
      audit.summary.totalBytes,
      audit.summary.blockerCount,
      audit.summary.reviewCount,
      result?.path || item.path,
      result?.size,
      result?.hash,
      result?.tableType,
      result?.title,
      result?.gridSize,
      domainText(result?.domainMin),
      domainText(result?.domainMax),
      result?.expectedRowCount,
      result?.actualRowCount,
      result?.status || "review",
      item.id,
      item.severity,
      item.line,
      item.evidence,
    ]);
  }
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createHtmlReport(audit) {
  const rows = reportRows(audit)
    .map(({ result, item }) => `<tr><td>${escapeHtml(result?.path || item.path)}</td><td>${escapeHtml(result?.hash || "—")}</td><td>${escapeHtml(result ? `${result.tableType} · ${result.gridSize ?? "—"}` : "—")}</td><td>${escapeHtml(result?.status || "review")}</td><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.severity)}</td><td>${escapeHtml(item.line ?? "—")}</td><td>${escapeHtml(item.evidence)}</td></tr>`)
    .join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'"><meta name="referrer" content="no-referrer"><title>${escapeHtml(audit.releaseName)} — CUBE LUT Pack Preflight report</title>
<style>body{font:15px/1.5 system-ui,sans-serif;max-width:1240px;margin:40px auto;padding:0 24px;color:#172033}h1{margin-bottom:4px}.meta{color:#526071}.summary{display:flex;gap:12px;flex-wrap:wrap;margin:24px 0}.card{border:1px solid #d9dfeb;border-radius:10px;padding:12px 16px;min-width:130px}.card strong{display:block;font-size:24px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #d9dfeb;padding:8px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#f5f7fb}@media print{body{margin:0}.card{break-inside:avoid}}</style></head>
<body><h1>CUBE LUT Pack Preflight report</h1><p class="meta">Release: ${escapeHtml(audit.releaseName)}<br>Scan timestamp: ${escapeHtml(audit.scannedAt)}<br>Total LUT bytes: ${audit.summary.totalBytes.toLocaleString("en-US")}<br>Non-Cube release files: ${audit.summary.nonCubeFileCount}</p>
<div class="summary"><div class="card"><strong>${audit.summary.fileCount}</strong>LUT files</div><div class="card"><strong>${audit.summary.blockerCount}</strong>blockers</div><div class="card"><strong>${audit.summary.reviewCount}</strong>review findings</div><div class="card"><strong>${audit.summary.exactDuplicateGroupCount + audit.summary.equivalentPayloadGroupCount}</strong>duplicate groups</div></div>
<table><thead><tr><th>Path</th><th>SHA-256</th><th>Type · grid</th><th>Status</th><th>Check ID</th><th>Severity</th><th>Line</th><th>Evidence</th></tr></thead><tbody>${rows}</tbody></table>
<p class="meta">Generated locally by CUBE LUT Pack Preflight. Structural validity does not prove color accuracy, correct labeling, ownership, or identical rendering across software and hardware.</p></body></html>`;
}
