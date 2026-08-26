const CANVA_HOST = /(^|\.)canva\.com$/i;

export const CATEGORY_META = Object.freeze({
  "canva-template": {
    label: "Canva template-like",
    tone: "safe",
  },
  "canva-risky": {
    label: "Canva non-template",
    tone: "danger",
  },
  "external-https": {
    label: "External HTTPS",
    tone: "neutral",
  },
  "other-target": {
    label: "Other target",
    tone: "warning",
  },
  invalid: {
    label: "Invalid target",
    tone: "danger",
  },
});

function warning(code, message, severity = "warning") {
  return { code, message, severity };
}

function isCanvaTemplateLike(url) {
  const path = url.pathname.toLowerCase().replace(/\/+$/, "");
  const mode = (url.searchParams.get("mode") || "").toLowerCase();
  return (
    path.includes("/template/") ||
    (/\/design\/[^/]+\/view$/.test(path) && mode === "preview")
  );
}

export function inspectTarget(rawTarget) {
  const target = String(rawTarget ?? "").trim();
  if (!target) {
    return {
      target,
      normalizedTarget: "",
      category: "invalid",
      warnings: [warning("missing-target", "Clickable annotation has no external URL.", "error")],
    };
  }

  let url;
  try {
    url = new URL(target);
  } catch {
    return {
      target,
      normalizedTarget: target,
      category: "invalid",
      warnings: [warning("malformed-target", "Target is not a valid absolute URL.", "error")],
    };
  }

  const warnings = [];
  const protocol = url.protocol.toLowerCase();
  const isHttps = protocol === "https:";
  if (!isHttps) {
    warnings.push(
      warning(
        "non-https-target",
        `Target uses ${protocol.replace(":", "") || "an unknown protocol"} instead of HTTPS.`,
        "error",
      ),
    );
  }

  let category = isHttps ? "external-https" : "other-target";
  if (CANVA_HOST.test(url.hostname)) {
    if (isCanvaTemplateLike(url)) {
      category = "canva-template";
    } else {
      category = "canva-risky";
      warnings.push(
        warning(
          "canva-non-template",
          "Canva target does not look like a template-copy link; verify that buyers cannot open the seller master.",
          "error",
        ),
      );
    }
  }

  url.hash = "";
  return {
    target,
    normalizedTarget: url.href,
    category,
    warnings,
  };
}

export function auditLinks(records, metadata = {}) {
  const rows = records.map((record, index) => {
    const inspected = inspectTarget(record.target);
    return {
      id: record.id || `link-${index + 1}`,
      page: Number(record.page) || 1,
      rect: Array.isArray(record.rect) ? record.rect.map(Number) : null,
      ...inspected,
    };
  });

  const duplicateCounts = new Map();
  for (const row of rows) {
    if (row.normalizedTarget) {
      duplicateCounts.set(
        row.normalizedTarget,
        (duplicateCounts.get(row.normalizedTarget) || 0) + 1,
      );
    }
  }
  for (const row of rows) {
    if ((duplicateCounts.get(row.normalizedTarget) || 0) > 1) {
      row.warnings.push(
        warning("duplicate-target", "This target appears more than once in the PDF."),
      );
    }
  }

  const documentWarnings = [];
  if (rows.length === 0) {
    documentWarnings.push(
      warning(
        "no-clickable-links",
        "No clickable link annotations were found. A flattened PDF can look correct while buyers cannot click it.",
        "error",
      ),
    );
  }

  const counts = Object.keys(CATEGORY_META).reduce((result, key) => {
    result[key] = rows.filter((row) => row.category === key).length;
    return result;
  }, {});

  return {
    filename: metadata.filename || "Untitled PDF",
    pageCount: Number(metadata.pageCount) || 0,
    rows,
    documentWarnings,
    counts,
    warningCount:
      documentWarnings.length + rows.reduce((sum, row) => sum + row.warnings.length, 0),
  };
}

export function normalizeViewportRect(convertedRect, viewport) {
  if (!Array.isArray(convertedRect) || convertedRect.length !== 4) return null;
  if (!viewport?.width || !viewport?.height) return null;
  const [x1, y1, x2, y2] = convertedRect.map(Number);
  const left = Math.max(0, Math.min(x1, x2));
  const top = Math.max(0, Math.min(y1, y2));
  const right = Math.min(viewport.width, Math.max(x1, x2));
  const bottom = Math.min(viewport.height, Math.max(y1, y2));
  return {
    left: (left / viewport.width) * 100,
    top: (top / viewport.height) * 100,
    width: (Math.max(0, right - left) / viewport.width) * 100,
    height: (Math.max(0, bottom - top) / viewport.height) * 100,
  };
}

function markdownCell(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function csvCell(value) {
  const text = String(value ?? "");
  const spreadsheetSafe = /^[\t\r\n ]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${spreadsheetSafe.replace(/"/g, '""')}"`;
}

export function createMarkdownReport(audit) {
  const safeFilename = String(audit.filename).replace(/[\r\n]+/g, " ").replace(/^#+\s*/, "");
  const lines = [
    `# Template Delivery PDF QA: ${safeFilename}`,
    "",
    `- Pages: ${audit.pageCount}`,
    `- Clickable links: ${audit.rows.length}`,
    `- Warnings: ${audit.warningCount}`,
    "",
    "## Category counts",
    "",
    ...Object.entries(CATEGORY_META).map(
      ([key, meta]) => `- ${meta.label}: ${audit.counts[key] || 0}`,
    ),
    "",
    "## Link inventory",
    "",
    "| Page | Category | Target | Warnings |",
    "| ---: | --- | --- | --- |",
  ];

  if (audit.rows.length === 0) {
    lines.push("| — | — | — | No clickable links found | ");
  } else {
    for (const row of audit.rows) {
      lines.push(
        `| ${row.page} | ${CATEGORY_META[row.category].label} | ${markdownCell(row.target)} | ${markdownCell(row.warnings.map((item) => item.message).join("; ") || "None")} |`,
      );
    }
  }

  lines.push("", "## Document warnings", "");
  if (audit.documentWarnings.length === 0) {
    lines.push("- None");
  } else {
    lines.push(...audit.documentWarnings.map((item) => `- ${item.message}`));
  }
  lines.push("", "Generated locally by Template Delivery PDF Checker.", "");
  return lines.join("\n");
}

export function createCsvReport(audit) {
  const rows = [
    ["filename", "page_count", "clickable_links", "warning_count"],
    [audit.filename, audit.pageCount, audit.rows.length, audit.warningCount],
    [],
    ["page", "category", "target", "warnings"],
    ...audit.rows.map((row) => [
      row.page,
      CATEGORY_META[row.category].label,
      row.target,
      row.warnings.map((item) => item.message).join("; "),
    ]),
    [],
    ["document_warning"],
    ...audit.documentWarnings.map((item) => [item.message]),
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
