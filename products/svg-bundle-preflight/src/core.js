export const PRODUCT_LIMITS = Object.freeze({
  maxSelectedFiles: 500,
  maxArchiveBytes: 50 * 1024 * 1024,
  maxExpandedBytes: 100 * 1024 * 1024,
  maxSvgBytes: 2 * 1024 * 1024,
  maxSvgFiles: 500,
  maxPathLength: 240,
});

const BITMAP_DATA_URL = /^data:image\/(?:bmp|gif|jpe?g|png|webp)(?:;|,)/i;
const EXTERNAL_URL = /^(?:https?:|\/\/|file:|ftp:)/i;
const ACTIVE_URL = /^(?:javascript:|vbscript:)/i;
const SUPPORTED_DIMENSION = /^(?:\d+(?:\.\d+)?|\.\d+)(?:px|pt|pc|mm|cm|in)?$/i;

function attr(element, name) {
  return element?.attributes?.find(
    (attribute) => attribute.name === name || attribute.localName === name,
  )?.value;
}

function count(elements, names) {
  const wanted = new Set(names);
  return elements.filter((element) => wanted.has(element.name)).length;
}

function finding(id, severity, evidence) {
  return { id, severity, evidence };
}

function uniqueFindings(findings) {
  const seen = new Set();
  return findings.filter((item) => {
    const key = `${item.id}\u0000${item.severity}\u0000${item.evidence}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function validViewBox(value) {
  if (!value) return false;
  const numbers = value.trim().split(/[\s,]+/).map(Number);
  return numbers.length === 4 && numbers.every(Number.isFinite) && numbers[2] > 0 && numbers[3] > 0;
}

function validDimension(value) {
  if (!value || !SUPPORTED_DIMENSION.test(value.trim())) return false;
  return Number.parseFloat(value) > 0;
}

function hrefs(element) {
  return (element.attributes || [])
    .filter((attribute) => attribute.localName === "href")
    .map((attribute) => attribute.value.trim())
    .filter(Boolean);
}

function externalReferenceEvidence(elements) {
  const evidence = [];
  for (const element of elements) {
    for (const value of hrefs(element)) {
      if (ACTIVE_URL.test(value)) continue;
      if (EXTERNAL_URL.test(value) || (!value.startsWith("#") && !value.startsWith("data:"))) {
        evidence.push(`<${element.name}> references ${value.slice(0, 120)}`);
      }
    }
    for (const attribute of element.attributes || []) {
      const urls = attribute.value.match(/url\(([^)]+)\)/gi) || [];
      for (const item of urls) {
        const value = item.slice(4, -1).trim().replace(/^['"]|['"]$/g, "");
        if (value && !value.startsWith("#") && !BITMAP_DATA_URL.test(value)) {
          evidence.push(`<${element.name}> uses external ${item.slice(0, 120)}`);
        }
      }
    }
    if (element.name === "style" && /@import|url\(\s*['"]?(?:https?:|\/\/|file:|ftp:)/i.test(element.text)) {
      evidence.push("<style> imports an external resource");
    }
  }
  return evidence;
}

export function inspectSvgSnapshot(snapshot) {
  const findings = [];
  if (!snapshot.valid || snapshot.parseErrors?.length) {
    findings.push(
      finding(
        "malformed-xml",
        "blocker",
        String(snapshot.parseErrors?.[0] || "The file is not well-formed XML.").slice(0, 180),
      ),
    );
  }
  if (!snapshot.root || snapshot.root.name !== "svg") {
    findings.push(finding("not-svg-root", "blocker", "The document root is not an <svg> element."));
    return uniqueFindings(findings);
  }

  const elements = snapshot.elements || [];
  const root = snapshot.root;
  const viewBox = attr(root, "viewbox");
  const width = attr(root, "width");
  const height = attr(root, "height");
  if (viewBox && !validViewBox(viewBox)) {
    findings.push(finding("invalid-viewbox", "warning", `viewBox is not a positive four-number box: ${viewBox}`));
  }
  if (!validViewBox(viewBox) && !(validDimension(width) && validDimension(height))) {
    findings.push(
      finding(
        "missing-sizing-metadata",
        "warning",
        "Add a positive viewBox or positive width and height so import scale is deterministic.",
      ),
    );
  }

  const liveTextCount = count(elements, ["text", "textpath", "tspan"]);
  if (liveTextCount) findings.push(finding("live-text", "blocker", `${liveTextCount} editable text element(s) found.`));

  const clippingCount = count(elements, ["clippath"]);
  if (clippingCount) findings.push(finding("clipping-path", "blocker", `${clippingCount} clipping path element(s) found.`));

  const patternCount = count(elements, ["pattern"]);
  if (patternCount) findings.push(finding("pattern-fill", "blocker", `${patternCount} pattern definition(s) found.`));

  const gradientCount = count(elements, ["lineargradient", "radialgradient"]);
  if (gradientCount) findings.push(finding("gradient-fill", "blocker", `${gradientCount} gradient definition(s) found.`));

  const bitmapImages = elements
    .filter((element) => element.name === "image")
    .flatMap(hrefs)
    .filter((value) => BITMAP_DATA_URL.test(value));
  if (bitmapImages.length) {
    findings.push(finding("embedded-bitmap", "blocker", `${bitmapImages.length} embedded bitmap image(s) found.`));
  }

  const scriptElements = count(elements, ["script"]);
  const activeReferences = elements.flatMap(hrefs).filter((value) => ACTIVE_URL.test(value));
  if (scriptElements || activeReferences.length) {
    findings.push(
      finding(
        "active-script",
        "blocker",
        `${scriptElements} <script> element(s) and ${activeReferences.length} active URL reference(s) found.`,
      ),
    );
  }

  const externalEvidence = externalReferenceEvidence(elements);
  if (externalEvidence.length) {
    findings.push(
      finding(
        "external-reference",
        "blocker",
        `${externalEvidence.length} external reference(s): ${externalEvidence[0]}`,
      ),
    );
  }

  return uniqueFindings(findings);
}

export async function sha256Hex(bytes, cryptoApi = globalThis.crypto) {
  if (!cryptoApi?.subtle) throw new Error("This browser does not support SHA-256 hashing.");
  const view = bytes instanceof Uint8Array ? bytes : new TextEncoder().encode(String(bytes));
  const digest = await cryptoApi.subtle.digest("SHA-256", view);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function addBundleFinding(result, item) {
  result.findings.push(item);
}

function statusFor(findings) {
  if (findings.some((item) => item.severity === "blocker")) return "blocked";
  if (findings.some((item) => item.severity === "warning")) return "review";
  return "passed";
}

export async function analyzeEntries(entries, options) {
  const parse = options.parse;
  const cryptoApi = options.cryptoApi || globalThis.crypto;
  const results = [];
  for (const entry of entries) {
    const snapshot = parse(entry.text);
    const result = {
      path: entry.path,
      size: entry.bytes.byteLength,
      hash: await sha256Hex(entry.bytes, cryptoApi),
      findings: inspectSvgSnapshot(snapshot),
    };
    results.push(result);
  }

  const hashes = new Map();
  const casePaths = new Map();
  for (const result of results) {
    hashes.set(result.hash, [...(hashes.get(result.hash) || []), result]);
    const key = result.path.toLocaleLowerCase("en-US");
    casePaths.set(key, [...(casePaths.get(key) || []), result]);
  }

  const duplicateGroups = [...hashes.values()]
    .filter((group) => group.length > 1)
    .map((group) => group.map((result) => result.path).sort());
  for (const paths of duplicateGroups) {
    for (const path of paths) {
      addBundleFinding(
        results.find((result) => result.path === path),
        finding("exact-duplicate", "warning", `Identical bytes also appear at: ${paths.filter((item) => item !== path).join(", ")}`),
      );
    }
  }

  const caseCollisionGroups = [...casePaths.values()]
    .filter((group) => new Set(group.map((result) => result.path)).size > 1)
    .map((group) => group.map((result) => result.path).sort());
  for (const paths of caseCollisionGroups) {
    for (const path of paths) {
      addBundleFinding(
        results.find((result) => result.path === path),
        finding("case-path-collision", "warning", `Case-insensitive path collision with: ${paths.filter((item) => item !== path).join(", ")}`),
      );
    }
  }

  results.sort((left, right) => left.path.localeCompare(right.path));
  for (const result of results) result.status = statusFor(result.findings);

  const allFindings = results.flatMap((result) => result.findings);
  return {
    bundleName: options.bundleName,
    scannedAt: options.scannedAt || new Date().toISOString(),
    ignoredFileCount: options.ignoredFileCount || 0,
    results,
    duplicateGroups,
    caseCollisionGroups,
    summary: {
      fileCount: results.length,
      blockerCount: allFindings.filter((item) => item.severity === "blocker").length,
      warningCount: allFindings.filter((item) => item.severity === "warning").length,
      blockedFileCount: results.filter((result) => result.status === "blocked").length,
      reviewFileCount: results.filter((result) => result.status === "review").length,
      passedFileCount: results.filter((result) => result.status === "passed").length,
      duplicateGroupCount: duplicateGroups.length,
      caseCollisionGroupCount: caseCollisionGroups.length,
    },
  };
}

function csvCell(value) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function createCsvReport(audit) {
  const columns = [
    "bundle_name",
    "scan_timestamp",
    "file_total",
    "blocker_total",
    "warning_total",
    "path",
    "status",
    "check_id",
    "severity",
    "evidence",
  ];
  const rows = [columns];
  for (const result of audit.results) {
    const findings = result.findings.length ? result.findings : [{ id: "passed", severity: "info", evidence: "No findings." }];
    for (const item of findings) {
      rows.push([
        audit.bundleName,
        audit.scannedAt,
        audit.summary.fileCount,
        audit.summary.blockerCount,
        audit.summary.warningCount,
        result.path,
        result.status,
        item.id,
        item.severity,
        item.evidence,
      ]);
    }
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
  const rows = audit.results
    .flatMap((result) => {
      const findings = result.findings.length ? result.findings : [{ id: "passed", severity: "info", evidence: "No findings." }];
      return findings.map(
        (item) => `<tr><td>${escapeHtml(result.path)}</td><td>${escapeHtml(result.status)}</td><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.severity)}</td><td>${escapeHtml(item.evidence)}</td></tr>`,
      );
    })
    .join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'"><meta name="referrer" content="no-referrer"><title>${escapeHtml(audit.bundleName)} — SVG Bundle Preflight report</title>
<style>body{font:15px/1.5 system-ui,sans-serif;max-width:1100px;margin:40px auto;padding:0 24px;color:#172033}h1{margin-bottom:4px}.meta{color:#526071}.summary{display:flex;gap:12px;flex-wrap:wrap;margin:24px 0}.card{border:1px solid #d9dfeb;border-radius:10px;padding:12px 16px;min-width:130px}.card strong{display:block;font-size:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d9dfeb;padding:8px;text-align:left;vertical-align:top}th{background:#f5f7fb}@media print{body{margin:0}.card{break-inside:avoid}}</style></head>
<body><h1>SVG Bundle Preflight report</h1><p class="meta">Bundle: ${escapeHtml(audit.bundleName)}<br>Scan timestamp: ${escapeHtml(audit.scannedAt)}<br>Ignored non-SVG files: ${audit.ignoredFileCount}</p>
<div class="summary"><div class="card"><strong>${audit.summary.fileCount}</strong>SVG files</div><div class="card"><strong>${audit.summary.blockerCount}</strong>blockers</div><div class="card"><strong>${audit.summary.warningCount}</strong>warnings</div><div class="card"><strong>${audit.summary.duplicateGroupCount}</strong>duplicate groups</div></div>
<table><thead><tr><th>Path</th><th>Status</th><th>Check ID</th><th>Severity</th><th>Evidence</th></tr></thead><tbody>${rows}</tbody></table>
<p class="meta">Generated locally by SVG Bundle Preflight. A static pass does not replace a real test cut.</p></body></html>`;
}
