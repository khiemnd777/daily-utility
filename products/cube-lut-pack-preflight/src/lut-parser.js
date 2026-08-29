const NUMBER_PATTERN = /^[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?$/;
const KNOWN_KEYWORDS = new Set([
  "TITLE",
  "DOMAIN_MIN",
  "DOMAIN_MAX",
  "LUT_1D_SIZE",
  "LUT_3D_SIZE",
]);

function finding(id, severity, line, evidence) {
  return { id, severity, line, evidence };
}

function addUnique(findings, item) {
  const key = `${item.id}\u0000${item.severity}\u0000${item.line ?? ""}\u0000${item.evidence}`;
  if (!findings.some((entry) => `${entry.id}\u0000${entry.severity}\u0000${entry.line ?? ""}\u0000${entry.evidence}` === key)) {
    findings.push(item);
  }
}

function parseNumbers(tokens, line, findings, invalidId, context) {
  if (tokens.length !== 3 || tokens.some((token) => !NUMBER_PATTERN.test(token))) {
    addUnique(
      findings,
      finding(invalidId, "blocker", line, `${context} must contain exactly three decimal numbers.`),
    );
    return null;
  }

  const values = tokens.map(Number);
  if (values.some((value) => !Number.isFinite(value) || Math.abs(value) > 1e37)) {
    addUnique(
      findings,
      finding(
        "number-out-of-spec",
        "blocker",
        line,
        `${context} contains a non-finite value or a value outside the ±1e37 Cube limit.`,
      ),
    );
  }
  return values;
}

function basicLatinViolation(source) {
  const lines = String(source).split(/\r\n|\n|\r/);
  for (let index = 0; index < lines.length; index += 1) {
    for (const character of lines[index]) {
      const code = character.codePointAt(0);
      if (character !== "\t" && (code < 0x20 || code > 0x7e)) return index + 1;
    }
  }
  return null;
}

function byteLength(value) {
  return new TextEncoder().encode(value).byteLength;
}

export function parseCubeSource(source) {
  const original = String(source ?? "");
  const findings = [];
  const keywordLines = new Map();
  const rows = [];
  let actualRowCount = 0;
  let dataStarted = false;
  let title = "";
  let domainMin = null;
  let domainMax = null;
  let oneDimensionalSize = null;
  let threeDimensionalSize = null;
  let outsideUnitRangeCount = 0;
  let firstOutsideUnitRangeLine = null;

  if (/\r(?!\n)/.test(original)) {
    addUnique(
      findings,
      finding(
        "invalid-line-separator",
        "blocker",
        null,
        "A carriage return not followed by a newline is outside the selected Cube specification profile.",
      ),
    );
  }

  const invalidCharacterLine = basicLatinViolation(original.replace(/^\uFEFF/, ""));
  if (invalidCharacterLine) {
    addUnique(
      findings,
      finding(
        "unsupported-character",
        "blocker",
        invalidCharacterLine,
        "Cube source must use Basic Latin text, tabs, and supported line separators.",
      ),
    );
  }

  const normalized = original
    .replace(/^\uFEFF/, "")
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n");
  const lines = normalized.split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const raw = lines[index];
    if (byteLength(raw) > 250) {
      addUnique(
        findings,
        finding("line-too-long", "blocker", lineNumber, "A Cube line must not exceed 250 bytes."),
      );
    }
    if (!raw.trim()) continue;
    if (raw.startsWith("#")) continue;
    if (raw.trimStart().startsWith("#")) {
      addUnique(
        findings,
        finding(
          "comment-leading-whitespace",
          "blocker",
          lineNumber,
          "Comment lines must begin with # in the first column for the selected profile.",
        ),
      );
      continue;
    }

    const trimmed = raw.trim();
    const keywordMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)(?:\s+(.*))?$/);
    const rawKeyword = keywordMatch?.[1] || "";
    const keyword = rawKeyword.toUpperCase();

    if (keywordMatch && KNOWN_KEYWORDS.has(keyword)) {
      if (dataStarted) {
        addUnique(
          findings,
          finding(
            "keyword-after-table-data",
            "blocker",
            lineNumber,
            `${keyword} appears after table data; all keywords must precede the table.`,
          ),
        );
      }
      if (rawKeyword !== keyword) {
        addUnique(
          findings,
          finding("invalid-keyword-case", "blocker", lineNumber, `${rawKeyword} must be written as ${keyword}.`),
        );
      }
      if (keywordLines.has(keyword)) {
        addUnique(
          findings,
          finding(
            "repeated-keyword",
            "blocker",
            lineNumber,
            `${keyword} repeats the declaration on line ${keywordLines.get(keyword)}.`,
          ),
        );
      } else {
        keywordLines.set(keyword, lineNumber);
      }

      const argument = keywordMatch[2] || "";
      if (keyword === "TITLE") {
        const match = argument.match(/^"([^"\r\n]*)"$/);
        if (!match) {
          addUnique(
            findings,
            finding("invalid-title", "blocker", lineNumber, "TITLE must contain one double-quoted Basic Latin value."),
          );
        } else if (!title) {
          title = match[1];
        }
      } else if (keyword === "DOMAIN_MIN" || keyword === "DOMAIN_MAX") {
        const values = parseNumbers(
          argument.trim().split(/\s+/).filter(Boolean),
          lineNumber,
          findings,
          "invalid-domain-declaration",
          keyword,
        );
        if (values && keyword === "DOMAIN_MIN" && !domainMin) domainMin = values;
        if (values && keyword === "DOMAIN_MAX" && !domainMax) domainMax = values;
      } else {
        if (!/^\d+$/.test(argument.trim())) {
          addUnique(
            findings,
            finding("invalid-size-declaration", "blocker", lineNumber, `${keyword} must contain one integer.`),
          );
          continue;
        }
        const size = Number(argument.trim());
        const maximum = keyword === "LUT_1D_SIZE" ? 65536 : 256;
        if (!Number.isSafeInteger(size) || size < 2 || size > maximum) {
          addUnique(
            findings,
            finding(
              "size-out-of-range",
              "blocker",
              lineNumber,
              `${keyword} must be between 2 and ${maximum}.`,
            ),
          );
        } else if (keyword === "LUT_1D_SIZE" && oneDimensionalSize === null) {
          oneDimensionalSize = size;
        } else if (keyword === "LUT_3D_SIZE" && threeDimensionalSize === null) {
          threeDimensionalSize = size;
        }
      }
      continue;
    }

    if (keywordMatch && /^[A-Za-z_]/.test(trimmed)) {
      addUnique(
        findings,
        finding("unknown-keyword", "blocker", lineNumber, `${rawKeyword} is not part of the selected Cube profile.`),
      );
      continue;
    }

    dataStarted = true;
    actualRowCount += 1;
    const values = parseNumbers(
      trimmed.split(/\s+/).filter(Boolean),
      lineNumber,
      findings,
      "invalid-numeric-triplet",
      "Table data",
    );
    if (!values) continue;
    rows.push(values);
    if (values.some((value) => value < 0 || value > 1)) {
      outsideUnitRangeCount += 1;
      firstOutsideUnitRangeLine ??= lineNumber;
    }
  }

  if (oneDimensionalSize !== null && threeDimensionalSize !== null) {
    addUnique(
      findings,
      finding(
        "mixed-table-types",
        "blocker",
        null,
        "Standalone Cube files in the selected profile must declare either LUT_1D_SIZE or LUT_3D_SIZE, not both.",
      ),
    );
  }

  const tableType = oneDimensionalSize !== null ? "1D" : threeDimensionalSize !== null ? "3D" : "unknown";
  const size = oneDimensionalSize ?? threeDimensionalSize;
  if (size === null) {
    addUnique(
      findings,
      finding("missing-size-declaration", "blocker", null, "Declare LUT_1D_SIZE or LUT_3D_SIZE before table data."),
    );
  }

  const effectiveDomainMin = domainMin || [0, 0, 0];
  const effectiveDomainMax = domainMax || [1, 1, 1];
  if (effectiveDomainMin.some((value, index) => !(value < effectiveDomainMax[index]))) {
    addUnique(
      findings,
      finding(
        "invalid-domain",
        "blocker",
        keywordLines.get("DOMAIN_MAX") || keywordLines.get("DOMAIN_MIN") || null,
        "Each DOMAIN_MIN component must be lower than the corresponding DOMAIN_MAX component.",
      ),
    );
  }

  const expectedRowCount = size === null ? null : tableType === "1D" ? size : size ** 3;
  if (expectedRowCount !== null && actualRowCount < expectedRowCount) {
    addUnique(
      findings,
      finding(
        "short-table-data",
        "blocker",
        null,
        `Declared ${tableType} size ${size} requires ${expectedRowCount} rows; found ${actualRowCount}.`,
      ),
    );
  }
  if (expectedRowCount !== null && actualRowCount > expectedRowCount) {
    addUnique(
      findings,
      finding(
        "extra-table-data",
        "blocker",
        null,
        `Declared ${tableType} size ${size} requires ${expectedRowCount} rows; found ${actualRowCount}.`,
      ),
    );
  }
  if (outsideUnitRangeCount) {
    addUnique(
      findings,
      finding(
        "output-outside-unit-range",
        "review",
        firstOutsideUnitRangeLine,
        `${outsideUnitRangeCount} table row(s) contain output values outside 0–1. Cube permits this; verify the target workflow.`,
      ),
    );
  }

  findings.sort((left, right) => (left.line ?? Number.MAX_SAFE_INTEGER) - (right.line ?? Number.MAX_SAFE_INTEGER) || left.id.localeCompare(right.id));
  const hasBlocker = findings.some((item) => item.severity === "blocker");
  const equivalencePayload = !hasBlocker
    ? JSON.stringify({ tableType, size, domainMin: effectiveDomainMin, domainMax: effectiveDomainMax, rows })
    : null;

  return {
    title,
    tableType,
    size,
    domainMin: effectiveDomainMin,
    domainMax: effectiveDomainMax,
    expectedRowCount,
    actualRowCount,
    findings,
    equivalencePayload,
  };
}
