export const PRODUCT_LIMITS = Object.freeze({
  maxSelectedFiles: 500,
  maxArchiveBytes: 50 * 1024 * 1024,
  maxExpandedBytes: 100 * 1024 * 1024,
  maxXmpBytes: 2 * 1024 * 1024,
  maxXmpFiles: 500,
  maxArchiveEntries: 5000,
  maxPathLength: 240,
});

const LIMITS_TEXT = "50 MB ZIP · 100 MB expanded · 500 XMP files · 2 MB per XMP · 5,000 entries · 240-character paths";
const LIMITATIONS = [
  "Static XMP preflight does not import presets, render photos, repair files, or certify Adobe compatibility.",
  "Profile references, support flags, process versions, and unknown properties are review facts rather than automatic proof of failure.",
  "Normalized-setting matches exclude identity and display fields; they are review candidates, not proof of identical rendering or copying.",
  "Nested archives, DNG files, legacy presets, and other release files are inventoried but not opened or converted.",
  "Test representative presets in every Lightroom, Camera Raw, operating-system, camera, and profile workflow you claim to support.",
];

function compareText(left, right) {
  return left === right ? 0 : left < right ? -1 : 1;
}

function finding(id, severity, evidence, path) {
  return { id, severity, evidence, path };
}

function addFinding(result, item) {
  const key = [item.id, item.severity, item.evidence].join("\u0000");
  if (!result.findings.some((entry) => [entry.id, entry.severity, entry.evidence].join("\u0000") === key)) {
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

function labelGroup(results, keyFor, id, severity, label, options = {}) {
  const grouped = groupBy(results, keyFor)
    .filter((group) => group.length > 1)
    .filter((group) => !options.distinctHash || new Set(group.map((item) => item.hash)).size > 1);
  const output = grouped.map(paths);
  for (const group of output) {
    for (const path of group) {
      addFinding(
        results.find((result) => result.path === path),
        finding(id, severity, label + ": " + group.filter((item) => item !== path).join(", "), path),
      );
    }
  }
  return output;
}

function compatibilitySignature(result) {
  return JSON.stringify(result.compatibilityFlags);
}

export async function analyzeEntries(entries, { parse, cryptoApi = globalThis.crypto }) {
  const results = [];
  for (const entry of entries) {
    const snapshot = parse(entry.bytes);
    const hash = await sha256Hex(entry.bytes, cryptoApi);
    const settingsHash = snapshot.normalizedPayload
      ? await sha256Hex(new TextEncoder().encode(snapshot.normalizedPayload), cryptoApi)
      : null;
    results.push({
      path: entry.path,
      size: entry.bytes.byteLength,
      hash,
      settingsHash,
      namespaces: snapshot.namespaces,
      name: snapshot.name,
      group: snapshot.group,
      uuid: snapshot.uuid,
      presetType: snapshot.presetType,
      processVersion: snapshot.processVersion,
      creatorTool: snapshot.creatorTool,
      profileReference: snapshot.profileReference,
      compatibilityFlags: snapshot.compatibilityFlags,
      activeSettingNames: snapshot.activeSettingNames,
      activeSettingCount: snapshot.activeSettingCount,
      cameraRawPropertyNames: snapshot.cameraRawPropertyNames,
      findings: snapshot.findings.map((item) => ({ ...item, path: entry.path })),
    });
  }

  const exactDuplicateGroups = labelGroup(
    results,
    (result) => result.hash,
    "exact-duplicate",
    "review",
    "Identical bytes also appear at",
  );
  const normalizedSettingGroups = labelGroup(
    results,
    (result) => result.settingsHash,
    "normalized-setting-match",
    "review",
    "The same normalized Camera Raw setting payload also appears at",
    { distinctHash: true },
  );
  const repeatedIdentifierGroups = labelGroup(
    results,
    (result) => result.uuid?.trim().toLocaleLowerCase("en-US"),
    "repeated-identifier",
    "review",
    "The same preset identifier also appears at",
  );
  const duplicateNameGroups = labelGroup(
    results,
    (result) => {
      if (!result.name?.trim() || !result.group?.trim()) return null;
      return (result.group.trim() + "\u0000" + result.name.trim()).toLocaleLowerCase("en-US");
    },
    "duplicate-name-in-group",
    "review",
    "The same displayed group and name also appear at",
  );
  const caseCollisionGroups = labelGroup(
    results,
    (result) => result.path.toLocaleLowerCase("en-US"),
    "case-insensitive-path-collision",
    "blocker",
    "The path collides on case-insensitive systems with",
  );

  const processVersions = [...new Set(results.map((result) => result.processVersion).filter(Boolean))].sort(compareText);
  if (processVersions.length > 1) {
    for (const result of results) {
      addFinding(result, finding(
        "mixed-process-versions",
        "review",
        "The pack declares multiple process versions: " + processVersions.join(", "),
        result.path,
      ));
    }
  }
  const presetTypes = [...new Set(results.map((result) => result.presetType).filter(Boolean))].sort(compareText);
  if (presetTypes.length > 1) {
    for (const result of results) {
      addFinding(result, finding(
        "mixed-preset-types",
        "review",
        "The pack declares multiple preset types: " + presetTypes.join(", "),
        result.path,
      ));
    }
  }
  const compatibilitySignatures = [...new Set(results.map(compatibilitySignature))];
  if (compatibilitySignatures.length > 1) {
    for (const result of results) {
      addFinding(result, finding(
        "mixed-compatibility-flags",
        "review",
        "Compatibility and support flags differ across the pack.",
        result.path,
      ));
    }
  }

  for (const result of results) {
    result.findings.sort((left, right) => left.severity.localeCompare(right.severity) || left.id.localeCompare(right.id));
    result.status = statusFor(result.findings);
  }
  results.sort((left, right) => compareText(left.path, right.path));
  return {
    results,
    exactDuplicateGroups,
    normalizedSettingGroups,
    repeatedIdentifierGroups,
    duplicateNameGroups,
    caseCollisionGroups,
  };
}

function isOsArtifact(path) {
  return path === ".DS_Store"
    || path.endsWith("/.DS_Store")
    || path.startsWith("__MACOSX/")
    || path.split("/").some((segment) => segment.startsWith("._"))
    || /(^|\/)(thumbs\.db|desktop\.ini)$/i.test(path);
}

function otherFileFinding(path) {
  const lower = path.toLowerCase();
  if (isOsArtifact(path)) return finding("hidden-os-artifact", "review", "Remove this operating-system artifact unless it is intentional buyer content.", path);
  if (lower.endsWith(".lrtemplate")) return finding("legacy-lrtemplate-release-file", "review", "Legacy preset is inventoried but not converted or validated.", path);
  if (lower.endsWith(".dng")) return finding("dng-release-file", "review", "DNG file is inventoried but not opened or validated.", path);
  if (lower.endsWith(".zip")) return finding("nested-archive-not-opened", "review", "Nested archive is inventoried but not opened.", path);
  return finding("non-xmp-release-file", "review", "Confirm this non-XMP file is intentional buyer content.", path);
}

export async function auditRelease(source, { parse, cryptoApi = globalThis.crypto, scanTimestamp = new Date().toISOString() }) {
  const analyzed = await analyzeEntries(source.entries, { parse, cryptoApi });
  const sortedOtherPaths = [...source.otherPaths].sort(compareText);
  const otherFindings = sortedOtherPaths.map(otherFileFinding);
  const blockerCount = analyzed.results.reduce(
    (sum, result) => sum + result.findings.filter((item) => item.severity === "blocker").length,
    0,
  );
  const reviewCount = analyzed.results.reduce(
    (sum, result) => sum + result.findings.filter((item) => item.severity === "review").length,
    otherFindings.length,
  );
  const audit = {
    product: "XMP Preset Pack Preflight",
    version: "1.0.0",
    releaseName: source.releaseName,
    scanTimestamp,
    limits: { ...PRODUCT_LIMITS, display: LIMITS_TEXT },
    limitations: LIMITATIONS,
    ...analyzed,
    otherPaths: sortedOtherPaths,
    otherFindings,
    summary: {
      xmpFileCount: analyzed.results.length,
      xmpByteCount: analyzed.results.reduce((sum, result) => sum + result.size, 0),
      otherFileCount: sortedOtherPaths.length,
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
  return '"' + text.replaceAll('"', '""') + '"';
}

function compactFlags(flags) {
  return Object.entries(flags).map(([key, value]) => key + "=" + (value ?? "")).join(" | ");
}

function factRow(audit, result, item = null) {
  return [
    audit.releaseName,
    audit.scanTimestamp,
    audit.limits.display,
    audit.summary.xmpFileCount,
    audit.summary.otherFileCount,
    audit.summary.blockerCount,
    audit.summary.reviewCount,
    result.path,
    result.size,
    result.hash,
    result.settingsHash,
    result.name,
    result.group,
    result.uuid,
    result.presetType,
    result.processVersion,
    result.creatorTool,
    result.profileReference,
    compactFlags(result.compatibilityFlags),
    result.namespaces.join(" | "),
    result.activeSettingCount,
    result.activeSettingNames.join(" | "),
    result.cameraRawPropertyNames.join(" | "),
    result.status,
    item?.id || "",
    item?.severity || "",
    item?.evidence || "",
  ];
}

export function toCsv(audit) {
  const header = [
    "release_name", "scan_timestamp", "configured_limits", "xmp_file_total", "other_file_total",
    "blocker_total", "review_total", "path", "byte_size", "sha256", "normalized_settings_sha256",
    "preset_name", "preset_group", "preset_identifier", "preset_type", "process_version", "creator_tool",
    "camera_profile_reference", "compatibility_flags", "declared_namespaces", "active_setting_count",
    "active_setting_names", "camera_raw_property_names", "status", "check_id", "severity", "evidence",
  ];
  const rows = [header];
  for (const result of audit.results) {
    if (result.findings.length) {
      for (const item of result.findings) rows.push(factRow(audit, result, item));
    } else {
      rows.push(factRow(audit, result));
    }
  }
  for (const item of audit.otherFindings) {
    rows.push([
      audit.releaseName, audit.scanTimestamp, audit.limits.display, audit.summary.xmpFileCount,
      audit.summary.otherFileCount, audit.summary.blockerCount, audit.summary.reviewCount,
      item.path, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "review",
      item.id, item.severity, item.evidence,
    ]);
  }
  return rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
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
  return "<ul>" + findings.map((item) => {
    return "<li><strong>" + escapeHtml(item.id) + "</strong> "
      + '<span class="pill ' + escapeHtml(item.severity) + '">' + escapeHtml(item.severity) + "</span><br>"
      + escapeHtml(item.evidence) + "</li>";
  }).join("") + "</ul>";
}

export function toHtml(audit) {
  const rows = audit.results.map((result) => {
    return "<tr><td><strong>" + escapeHtml(result.path) + "</strong><br><code>" + escapeHtml(result.hash)
      + "</code></td><td>" + escapeHtml(result.name || "Unnamed") + "<br>Group: " + escapeHtml(result.group || "—")
      + "<br>ID: " + escapeHtml(result.uuid || "—") + "</td><td>Process " + escapeHtml(result.processVersion || "—")
      + "<br>Profile: " + escapeHtml(result.profileReference || "—") + "<br>" + result.activeSettingCount
      + " active setting(s)</td><td>" + findingMarkup(result.findings) + "</td></tr>";
  }).join("");
  const other = audit.otherFindings.length
    ? "<h2>Other release files</h2><ul>" + audit.otherFindings.map((item) => {
      return "<li><strong>" + escapeHtml(item.path) + "</strong> — " + escapeHtml(item.evidence) + "</li>";
    }).join("") + "</ul>"
    : "";
  return [
    "<!doctype html>",
    '<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:; font-src \'none\'; connect-src \'none\'; script-src \'none\'; object-src \'none\'; base-uri \'none\'; form-action \'none\'">',
    "<title>" + escapeHtml(audit.releaseName) + " — XMP Preset Pack Preflight report</title>",
    "<style>body{max-width:1180px;margin:40px auto;padding:0 24px;color:#201b2a;background:#f7f4fb;font:15px/1.5 system-ui,sans-serif}header,section{background:#fff;border:1px solid #ddd4e9;border-radius:16px;padding:24px;margin-bottom:18px}h1{margin:0 0 6px;font:700 36px/1.1 Georgia,serif}h2{margin-top:26px}dl{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}dt{color:#6f647a;font-size:12px;text-transform:uppercase}dd{margin:2px 0 0;font-size:22px;font-weight:700}table{width:100%;border-collapse:collapse}th,td{padding:12px;border-bottom:1px solid #e8e1ef;text-align:left;vertical-align:top}th{color:#6b6075;font-size:12px;text-transform:uppercase}code{font-size:11px;overflow-wrap:anywhere}.pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:700}.passed{background:#dff6e8;color:#155d35}.review{background:#fff1c9;color:#765100}.blocker{background:#ffe0dd;color:#862b22}li{margin:7px 0}@media(max-width:760px){dl{grid-template-columns:1fr 1fr}table{display:block;overflow:auto}}</style></head>",
    "<body><header><p>XMP Preset Pack Preflight 1.0.0</p><h1>" + escapeHtml(audit.releaseName) + "</h1><p>Scanned "
      + escapeHtml(audit.scanTimestamp) + " · " + escapeHtml(audit.limits.display) + "</p><dl><div><dt>XMP files</dt><dd>"
      + audit.summary.xmpFileCount + "</dd></div><div><dt>Blockers</dt><dd>" + audit.summary.blockerCount
      + "</dd></div><div><dt>Review</dt><dd>" + audit.summary.reviewCount + "</dd></div><div><dt>Status</dt><dd>"
      + escapeHtml(audit.status) + "</dd></div></dl></header>",
    "<section><h2>File evidence</h2><table><thead><tr><th>Path and SHA-256</th><th>Identity</th><th>Preset facts</th><th>Findings</th></tr></thead><tbody>"
      + rows + "</tbody></table>" + other + "</section>",
    "<section><h2>Important limits</h2><ul>" + audit.limitations.map((item) => "<li>" + escapeHtml(item) + "</li>").join("")
      + "</ul><p>Inputs were read locally and were not modified. This report is deterministic static evidence, not Adobe certification.</p></section></body></html>",
  ].join("");
}

export function reportBaseName(releaseName) {
  const base = String(releaseName).replace(/\.(zip|xmp)$/i, "").replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "");
  return (base || "xmp-preset-pack") + "-preflight-report";
}
