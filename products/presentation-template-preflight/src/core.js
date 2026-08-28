import { attribute, exactAttribute, hasAncestor, parseXmlSource } from "./xml-parser.js";

const RELATIONSHIP_SUFFIX = ".rels";
const FONT_ELEMENTS = new Set(["latin", "ea", "cs", "sym"]);
const SEVERITY_ORDER = { blocker: 0, warning: 1, info: 2 };

function finding(id, severity, title, evidence, part, slide = null) {
  return { id, severity, title, evidence, part, slide };
}

function normalizePackagePath(path) {
  const segments = [];
  for (const segment of String(path).replaceAll("\\", "/").split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      if (!segments.length) return null;
      segments.pop();
    } else {
      segments.push(segment);
    }
  }
  return segments.join("/");
}

function sourcePartForRelationships(path) {
  if (path === "_rels/.rels") return "";
  const marker = "/_rels/";
  const index = path.lastIndexOf(marker);
  if (index < 0 || !path.endsWith(RELATIONSHIP_SUFFIX)) return null;
  return `${path.slice(0, index)}/${path.slice(index + marker.length, -RELATIONSHIP_SUFFIX.length)}`;
}

function resolveInternalTarget(sourcePart, target) {
  const withoutFragment = String(target).split("#", 1)[0].split("?", 1)[0];
  const base = withoutFragment.startsWith("/")
    ? withoutFragment.slice(1)
    : `${sourcePart.includes("/") ? sourcePart.slice(0, sourcePart.lastIndexOf("/") + 1) : ""}${withoutFragment}`;
  const normalized = normalizePackagePath(base);
  if (!normalized) return null;
  try {
    return decodeURIComponent(normalized);
  } catch {
    return normalized;
  }
}

function relationshipCategory(type, target) {
  const normalizedType = String(type).toLowerCase();
  const normalizedTarget = String(target).toLowerCase();
  if (/externallink|connection|querytable|datamodel|datasource/.test(normalizedType)) return "data";
  if (/^(?:file:|[a-z]:[\\/]|\\\\|\/)/i.test(target)) return "local-file";
  if (/video|audio|media|image/.test(normalizedType)) return "media";
  if (/hyperlink/.test(normalizedType) && /^https?:/.test(normalizedTarget)) return "web";
  if (/^https?:/.test(normalizedTarget)) return "web";
  return "external";
}

function parseSnapshots(textParts) {
  const snapshots = new Map();
  const parseFindings = [];
  for (const [path, source] of textParts) {
    const snapshot = parseXmlSource(source);
    snapshots.set(path, snapshot);
    if (!snapshot.valid) {
      parseFindings.push(
        finding(
          "malformed-xml-part",
          "blocker",
          "Malformed XML package part",
          String(snapshot.parseErrors[0] || "XML parsing failed.").slice(0, 240),
          path,
        ),
      );
    }
  }
  return { snapshots, parseFindings };
}

function parseRelationships(packageData, snapshots, slideByPart) {
  const relationships = [];
  const findings = [];
  for (const [path, snapshot] of snapshots) {
    if (!path.endsWith(RELATIONSHIP_SUFFIX)) continue;
    const sourcePart = sourcePartForRelationships(path);
    if (sourcePart === null) continue;
    for (const element of snapshot.elements.filter((item) => item.name === "relationship")) {
      const id = attribute(element, "id") || "(missing id)";
      const type = attribute(element, "type") || "(missing type)";
      const target = attribute(element, "target") || "";
      const targetMode = attribute(element, "targetmode") || "Internal";
      const slide = slideByPart.get(sourcePart) || null;
      if (targetMode.toLowerCase() === "external") {
        const category = relationshipCategory(type, target);
        const checkByCategory = {
          "local-file": ["external-local-file", "Linked local file", "A local-machine path may break after delivery."],
          data: ["external-data-relationship", "External data relationship", "The presentation depends on an external data source."],
          media: ["external-media-relationship", "External media relationship", "Linked media may be unavailable on the buyer's computer."],
          web: ["external-web-hyperlink", "External web hyperlink", "Review that this intentional web destination is buyer-ready."],
          external: ["external-relationship", "External relationship", "Review this external package dependency before release."],
        };
        const [checkId, title, guidance] = checkByCategory[category];
        findings.push(
          finding(checkId, "warning", title, `${guidance} ${type} → ${target}`, sourcePart || path, slide),
        );
        relationships.push({ id, sourcePart, type, target, targetMode: "External", category, status: "review", slide });
        continue;
      }

      const resolvedTarget = resolveInternalTarget(sourcePart, target);
      const exists = resolvedTarget ? packageData.paths.has(resolvedTarget) : false;
      relationships.push({
        id,
        sourcePart,
        type,
        target,
        resolvedTarget,
        targetMode: "Internal",
        category: "internal",
        status: exists ? "resolved" : "missing",
        slide,
      });
      if (!exists) {
        findings.push(
          finding(
            "missing-internal-target",
            "blocker",
            "Missing internal relationship target",
            `${type} points to ${target}; resolved package path ${resolvedTarget || "is unsafe"}.`,
            sourcePart || path,
            slide,
          ),
        );
      }
    }
  }
  return { relationships, findings };
}

function buildSlideMap(snapshots) {
  const map = new Map();
  const presentation = snapshots.get("ppt/presentation.xml");
  const rels = snapshots.get("ppt/_rels/presentation.xml.rels");
  if (!presentation || !rels) return map;
  const targets = new Map();
  for (const element of rels.elements.filter((item) => item.name === "relationship")) {
    const id = attribute(element, "id");
    const type = attribute(element, "type") || "";
    if (id && /\/slide$/i.test(type)) {
      targets.set(id, resolveInternalTarget("ppt/presentation.xml", attribute(element, "target") || ""));
    }
  }
  let position = 0;
  for (const element of presentation.elements.filter((item) => item.name === "sldid")) {
    position += 1;
    const relationshipId = exactAttribute(element, "r:id");
    const target = targets.get(relationshipId);
    if (target) map.set(target, position);
  }
  return map;
}

function greatestCommonDivisor(left, right) {
  let a = Math.abs(Math.round(left));
  let b = Math.abs(Math.round(right));
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

function presentationDimensions(snapshot) {
  const size = snapshot?.elements.find((element) => element.name === "sldsz");
  const widthEmu = Number(attribute(size, "cx"));
  const heightEmu = Number(attribute(size, "cy"));
  if (!(widthEmu > 0 && heightEmu > 0)) return null;
  const ratio = widthEmu / heightEmu;
  let aspectRatio;
  if (Math.abs(ratio - 16 / 9) < 0.01) aspectRatio = "16:9";
  else if (Math.abs(ratio - 4 / 3) < 0.01) aspectRatio = "4:3";
  else {
    const divisor = greatestCommonDivisor(widthEmu, heightEmu);
    aspectRatio = `${Math.round(widthEmu / divisor)}:${Math.round(heightEmu / divisor)}`;
  }
  return {
    widthEmu,
    heightEmu,
    widthInches: Number((widthEmu / 914400).toFixed(2)),
    heightInches: Number((heightEmu / 914400).toFixed(2)),
    aspectRatio,
  };
}

function collectFonts(snapshots) {
  const referencedMap = new Map();
  for (const [part, snapshot] of snapshots) {
    if (!part.startsWith("ppt/") || part.endsWith(".rels")) continue;
    for (const element of snapshot.elements) {
      if (!FONT_ELEMENTS.has(element.name)) continue;
      const typeface = attribute(element, "typeface")?.trim();
      if (!typeface || typeface.startsWith("+")) continue;
      const key = typeface.toLocaleLowerCase("en-US");
      if (!referencedMap.has(key)) referencedMap.set(key, { name: typeface, parts: new Set() });
      referencedMap.get(key).parts.add(part);
    }
  }

  const embeddedMap = new Map();
  const presentation = snapshots.get("ppt/presentation.xml");
  if (presentation) {
    for (const element of presentation.elements) {
      if (element.name !== "font" || !hasAncestor(presentation, element, "embeddedfont")) continue;
      const typeface = attribute(element, "typeface")?.trim();
      if (typeface) embeddedMap.set(typeface.toLocaleLowerCase("en-US"), typeface);
    }
  }

  const referenced = [...referencedMap.values()]
    .map((item) => ({ name: item.name, parts: [...item.parts].sort() }))
    .sort((left, right) => left.name.localeCompare(right.name));
  const embedded = [...embeddedMap.values()].sort((left, right) => left.localeCompare(right));
  const unembedded = referenced.filter((item) => !embeddedMap.has(item.name.toLocaleLowerCase("en-US")));
  return { referenced, embedded, unembedded };
}

function collectHiddenContent(packageData, snapshots, slideByPart) {
  const findings = [];
  const details = { comments: [], notes: [], hiddenSlides: [], embeddedObjects: [], macros: [], metadata: [] };

  for (const [part, snapshot] of snapshots) {
    if (/^ppt\/comments\/.+\.xml$/i.test(part)) {
      const count = snapshot.elements.filter((element) => ["cm", "comment"].includes(element.name)).length || 1;
      details.comments.push({ part, count });
      findings.push(finding("comments-present", "warning", "Comments present", `${count} comment record(s) found.`, part));
    }
    if (/^ppt\/notesslides\/notesslide\d+\.xml$/i.test(part)) {
      const slide = slideByPart.get(part) || Number(part.match(/\d+/)?.[0] || 0) || null;
      details.notes.push({ part, slide });
      findings.push(finding("speaker-notes-present", "warning", "Speaker notes present", "A speaker-notes part remains in the package.", part, slide));
    }
    if (/^ppt\/slides\/slide\d+\.xml$/i.test(part)) {
      const root = snapshot.root;
      const hidden = attribute(root, "show") === "0" || attribute(root, "hidden") === "1";
      if (hidden) {
        const slide = slideByPart.get(part) || Number(part.match(/\d+/)?.[0] || 0) || null;
        details.hiddenSlides.push({ part, slide });
        findings.push(finding("hidden-slide", "warning", "Hidden slide present", "The slide root is marked not to show.", part, slide));
      }
    }
  }

  for (const path of [...packageData.paths].sort()) {
    if (/^ppt\/embeddings\//i.test(path)) {
      details.embeddedObjects.push(path);
      findings.push(finding("embedded-object", "warning", "Embedded object present", "Review the embedded package or OLE object before delivery.", path));
    }
    if (/vbaProject\.bin$/i.test(path)) {
      details.macros.push(path);
      findings.push(finding("macro-content", "blocker", "Macro project present", "The package contains VBA macro content that this utility does not execute.", path));
    }
  }

  const core = snapshots.get("docProps/core.xml");
  if (core) {
    for (const [elementName, label] of [["creator", "Creator"], ["lastmodifiedby", "Last modified by"]]) {
      for (const element of core.elements.filter((item) => item.name === elementName)) {
        const value = element.text.trim();
        if (!value) continue;
        details.metadata.push({ field: label, value, part: "docProps/core.xml" });
        findings.push(finding("personal-metadata", "warning", "Personal metadata present", `${label}: ${value}`, "docProps/core.xml"));
      }
    }
  }
  return { details, findings };
}

export async function sha256Hex(bytes, cryptoApi = globalThis.crypto) {
  if (!cryptoApi?.subtle) throw new Error("This browser does not support SHA-256 hashing.");
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const digest = await cryptoApi.subtle.digest("SHA-256", view);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function analyzePresentation(packageData, options = {}) {
  const { snapshots, parseFindings } = parseSnapshots(packageData.textParts);
  const slideByPart = buildSlideMap(snapshots);
  const relationshipAudit = parseRelationships(packageData, snapshots, slideByPart);
  const fonts = collectFonts(snapshots);
  const hiddenContent = collectHiddenContent(packageData, snapshots, slideByPart);
  const findings = [...parseFindings, ...relationshipAudit.findings, ...hiddenContent.findings];

  for (const font of fonts.unembedded) {
    findings.push(
      finding(
        "unembedded-font",
        "warning",
        "Referenced font is not embedded",
        `${font.name} is referenced in ${font.parts.join(", ")}. This is a portability warning, not proof of rendering failure or licensing status.`,
        font.parts[0],
        slideByPart.get(font.parts[0]) || null,
      ),
    );
  }

  findings.sort((left, right) =>
    (SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity]) ||
    left.id.localeCompare(right.id) ||
    String(left.part).localeCompare(String(right.part)),
  );

  const slideParts = [...packageData.paths].filter((path) => /^ppt\/slides\/slide\d+\.xml$/i.test(path)).sort();
  const layoutParts = [...packageData.paths].filter((path) => /^ppt\/slidelayouts\/slidelayout\d+\.xml$/i.test(path)).sort();
  const masterParts = [...packageData.paths].filter((path) => /^ppt\/slidemasters\/slidemaster\d+\.xml$/i.test(path)).sort();
  const relationships = relationshipAudit.relationships;
  const sha256 = await sha256Hex(packageData.bytes, options.cryptoApi || globalThis.crypto);
  const scannedAt = options.scannedAt || new Date().toISOString();
  const blockerCount = findings.filter((item) => item.severity === "blocker").length;
  const warningCount = findings.filter((item) => item.severity === "warning").length;

  return {
    product: "Presentation Template Preflight",
    version: "1.0.0",
    file: { name: packageData.filename, size: packageData.fileSize, sha256, scannedAt, extension: packageData.extension },
    inventory: {
      slideCount: slideParts.length,
      layoutCount: layoutParts.length,
      masterCount: masterParts.length,
      dimensions: presentationDimensions(snapshots.get("ppt/presentation.xml")),
      packagePartCount: packageData.paths.size,
      internalRelationshipCount: relationships.filter((item) => item.targetMode === "Internal").length,
      resolvedRelationshipCount: relationships.filter((item) => item.status === "resolved").length,
      externalRelationshipCount: relationships.filter((item) => item.targetMode === "External").length,
    },
    fonts,
    hiddenContent: hiddenContent.details,
    relationships,
    findings,
    summary: { blockerCount, warningCount, status: blockerCount ? "blocked" : warningCount ? "review" : "passed" },
  };
}

function csvCell(value) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function createCsvReport(audit) {
  const dimensions = audit.inventory.dimensions || {};
  const rows = [[
    "filename", "file_bytes", "sha256", "scan_timestamp", "slide_total", "layout_total", "master_total",
    "package_part_total", "internal_relationship_total", "resolved_relationship_total", "external_relationship_total",
    "width_emu", "height_emu", "aspect_ratio", "blocker_total", "warning_total", "check_id", "severity", "part", "slide", "evidence",
  ]];
  const reportFindings = audit.findings.length
    ? audit.findings
    : [finding("passed", "info", "No static findings", "Every inspected rule passed.", "ppt/presentation.xml")];
  for (const item of reportFindings) {
    rows.push([
      audit.file.name, audit.file.size, audit.file.sha256, audit.file.scannedAt, audit.inventory.slideCount,
      audit.inventory.layoutCount, audit.inventory.masterCount, audit.inventory.packagePartCount,
      audit.inventory.internalRelationshipCount, audit.inventory.resolvedRelationshipCount,
      audit.inventory.externalRelationshipCount, dimensions.widthEmu || "", dimensions.heightEmu || "",
      dimensions.aspectRatio || "", audit.summary.blockerCount, audit.summary.warningCount,
      item.id, item.severity, item.part, item.slide || "", item.evidence,
    ]);
  }
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
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
  const dimensions = audit.inventory.dimensions;
  const findingRows = (audit.findings.length ? audit.findings : [finding("passed", "info", "No static findings", "Every inspected rule passed.", "ppt/presentation.xml")])
    .map((item) => `<tr><td>${escapeHtml(item.severity)}</td><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.part)}</td><td>${escapeHtml(item.slide || "—")}</td><td>${escapeHtml(item.evidence)}</td></tr>`)
    .join("");
  const relationshipRows = audit.relationships
    .map((item) => `<tr><td>${escapeHtml(item.sourcePart || "package")}</td><td>${escapeHtml(item.targetMode)}</td><td>${escapeHtml(item.status)}</td><td>${escapeHtml(item.type)}</td><td>${escapeHtml(item.target)}</td></tr>`)
    .join("");
  const referencedFonts = audit.fonts.referenced.map((item) => item.name).join(", ") || "None detected";
  const embeddedFonts = audit.fonts.embedded.join(", ") || "None recorded";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'"><meta name="referrer" content="no-referrer"><title>${escapeHtml(audit.file.name)} — Presentation Template Preflight report</title>
<style>body{font:15px/1.5 system-ui,sans-serif;max-width:1180px;margin:40px auto;padding:0 24px;color:#17233b}h1{margin-bottom:4px}.meta{color:#58657a}.summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:24px 0}.card{border:1px solid #d7deea;border-radius:12px;padding:14px}.card strong{display:block;font-size:25px}table{width:100%;border-collapse:collapse;margin:14px 0 30px;table-layout:fixed}th,td{border:1px solid #d7deea;padding:8px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#f3f6fa}th:nth-child(1){width:92px}th:nth-child(2){width:170px}th:nth-child(3){width:190px}th:nth-child(4){width:60px}td:nth-child(1),td:nth-child(4){white-space:nowrap}code{font-size:12px}@media(max-width:720px){.summary{grid-template-columns:1fr 1fr}}@media print{body{margin:0}.card{break-inside:avoid}}</style></head>
<body><h1>Presentation Template Preflight report</h1><p class="meta">File: ${escapeHtml(audit.file.name)}<br>Bytes: ${audit.file.size}<br>SHA-256: <code>${audit.file.sha256}</code><br>Scan timestamp: ${escapeHtml(audit.file.scannedAt)}</p>
<div class="summary"><div class="card"><strong>${audit.inventory.slideCount}</strong>slides</div><div class="card"><strong>${audit.inventory.layoutCount} / ${audit.inventory.masterCount}</strong>layouts / masters</div><div class="card"><strong>${audit.inventory.packagePartCount}</strong>package parts</div><div class="card"><strong>${audit.inventory.resolvedRelationshipCount} / ${audit.inventory.externalRelationshipCount}</strong>resolved / external relationships</div><div class="card"><strong>${escapeHtml(dimensions?.aspectRatio || "Unknown")}</strong>${dimensions ? `${dimensions.widthInches} × ${dimensions.heightInches} in` : "dimensions"}</div><div class="card"><strong>${audit.summary.blockerCount} / ${audit.summary.warningCount}</strong>blockers / warnings</div></div>
<p><strong>Referenced fonts:</strong> ${escapeHtml(referencedFonts)}<br><strong>Embedded-font records:</strong> ${escapeHtml(embeddedFonts)}<br><strong>Severity totals:</strong> ${audit.summary.blockerCount} blocker(s), ${audit.summary.warningCount} review warning(s).</p>
<h2>Findings</h2><table><thead><tr><th>Severity</th><th>Check ID</th><th>Part</th><th>Slide</th><th>Evidence</th></tr></thead><tbody>${findingRows}</tbody></table>
<h2>Package relationships</h2><table><thead><tr><th>Source part</th><th>Mode</th><th>Status</th><th>Type</th><th>Target</th></tr></thead><tbody>${relationshipRows}</tbody></table>
<p class="meta">Generated locally by Presentation Template Preflight 1.0.0. This static OOXML audit does not render slides, repair files, certify accessibility, or determine font licensing. Not affiliated with or endorsed by Microsoft.</p></body></html>`;
}
