import JSZip from "jszip";

import { PRODUCT_LIMITS } from "./core.js";

export class SourceError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "SourceError";
    this.code = code;
  }
}

function safePath(path) {
  const normalized = String(path).replaceAll("\\", "/").replace(/^\.\//, "");
  const segments = normalized.split("/");
  if (
    !normalized ||
    normalized.length > PRODUCT_LIMITS.maxPathLength ||
    normalized.startsWith("/") ||
    /^[a-z]:\//i.test(normalized) ||
    segments.some((segment) => !segment || segment === "." || segment === ".." || segment.includes("\0"))
  ) {
    throw new SourceError("UNSAFE_PATH", `Unsafe or overlong archive path: ${String(path).slice(0, 160)}`);
  }
  return normalized;
}

function assertSvgSize(path, size) {
  if (size > PRODUCT_LIMITS.maxSvgBytes) {
    throw new SourceError("SVG_TOO_LARGE", `${path} is larger than the 2 MB per-SVG safety limit.`);
  }
}

export function validateExpandedBytes(size) {
  if (size > PRODUCT_LIMITS.maxExpandedBytes) {
    throw new SourceError("EXPANDED_TOO_LARGE", "Expanded SVG content exceeds the 100 MB safety limit.");
  }
}

function decodeSvg(path, bytes) {
  assertSvgSize(path, bytes.byteLength);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new SourceError("INVALID_ENCODING", `${path} is not valid UTF-8 text.`);
  }
}

function assertEntryCount(count) {
  if (count > PRODUCT_LIMITS.maxSvgFiles) {
    throw new SourceError("TOO_MANY_SVGS", `The safe limit is ${PRODUCT_LIMITS.maxSvgFiles} SVG files per scan.`);
  }
}

export function validateSelection(files) {
  if (!files.length) throw new SourceError("NO_FILES", "Choose one ZIP or one or more SVG files.");
  if (files.length > PRODUCT_LIMITS.maxSelectedFiles) {
    throw new SourceError("TOO_MANY_FILES", `Select at most ${PRODUCT_LIMITS.maxSelectedFiles} files.`);
  }
  const zipFiles = files.filter((file) => file.name.toLowerCase().endsWith(".zip"));
  if (zipFiles.length && (files.length !== 1 || zipFiles.length !== 1)) {
    throw new SourceError("MIXED_SELECTION", "Choose either one ZIP archive or multiple SVG files, not both.");
  }
  if (!zipFiles.length && files.some((file) => !file.name.toLowerCase().endsWith(".svg"))) {
    throw new SourceError("UNSUPPORTED_FILE", "Direct selection accepts SVG files only.");
  }
}

export async function readZipFile(file) {
  if (file.size > PRODUCT_LIMITS.maxArchiveBytes) {
    throw new SourceError("ARCHIVE_TOO_LARGE", "The ZIP is larger than the 50 MB compressed safety limit.");
  }
  let archive;
  try {
    const archiveBytes = typeof file.arrayBuffer === "function" ? await file.arrayBuffer() : file;
    archive = await JSZip.loadAsync(archiveBytes, { checkCRC32: true, createFolders: false });
  } catch {
    throw new SourceError("INVALID_ARCHIVE", "The ZIP is damaged, encrypted, or not a supported archive.");
  }

  const candidates = Object.values(archive.files)
    .filter((entry) => !entry.dir)
    .sort((left, right) => left.name.localeCompare(right.name));
  const svgCandidates = candidates.filter((entry) => entry.name.toLowerCase().endsWith(".svg"));
  assertEntryCount(svgCandidates.length);
  if (!svgCandidates.length) throw new SourceError("NO_SVGS", "The ZIP contains no SVG files.");

  const entries = [];
  let expandedBytes = 0;
  for (const candidate of svgCandidates) {
    const originalPath = candidate.unsafeOriginalName || candidate.name;
    const path = safePath(originalPath);
    const bytes = await candidate.async("uint8array");
    expandedBytes += bytes.byteLength;
    validateExpandedBytes(expandedBytes);
    entries.push({ path, bytes, text: decodeSvg(path, bytes) });
  }

  return {
    bundleName: file.name,
    ignoredFileCount: candidates.length - svgCandidates.length,
    entries,
  };
}

export async function readDirectFiles(files) {
  assertEntryCount(files.length);
  const entries = [];
  let expandedBytes = 0;
  for (const file of files) {
    const path = safePath(file.webkitRelativePath || file.name);
    assertSvgSize(path, file.size);
    const bytes = new Uint8Array(await file.arrayBuffer());
    expandedBytes += bytes.byteLength;
    validateExpandedBytes(expandedBytes);
    entries.push({ path, bytes, text: decodeSvg(path, bytes) });
  }
  return {
    bundleName: files.length === 1 ? files[0].name : `${files.length}-svg-selection`,
    ignoredFileCount: 0,
    entries,
  };
}

export async function readSources(fileList) {
  const files = Array.from(fileList || []);
  validateSelection(files);
  return files[0].name.toLowerCase().endsWith(".zip") ? readZipFile(files[0]) : readDirectFiles(files);
}
