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
    !normalized
    || normalized.length > PRODUCT_LIMITS.maxPathLength
    || normalized.startsWith("/")
    || /^[a-z]:\//i.test(normalized)
    || segments.some((segment) => !segment || segment === "." || segment === ".." || segment.includes("\0"))
  ) {
    throw new SourceError("UNSAFE_PATH", "Unsafe or overlong release path: " + String(path).slice(0, 160));
  }
  return normalized;
}

function isXmp(path) {
  return /\.xmp$/i.test(path);
}

function assertXmpSize(path, size) {
  if (size > PRODUCT_LIMITS.maxXmpBytes) {
    throw new SourceError("XMP_TOO_LARGE", path + " is larger than the 2 MB per-XMP safety limit.");
  }
}

function assertXmpCount(count) {
  if (count > PRODUCT_LIMITS.maxXmpFiles) {
    throw new SourceError("TOO_MANY_XMP_FILES", "The safe limit is " + PRODUCT_LIMITS.maxXmpFiles + " XMP files per scan.");
  }
}

export function validateExpandedBytes(size) {
  if (size > PRODUCT_LIMITS.maxExpandedBytes) {
    throw new SourceError("EXPANDED_TOO_LARGE", "Uncompressed release content exceeds the 100 MB safety limit.");
  }
}

export function validateSelection(files) {
  if (!files.length) throw new SourceError("NO_FILES", "Choose one ZIP or one or more .xmp files.");
  if (files.length > PRODUCT_LIMITS.maxSelectedFiles) {
    throw new SourceError("TOO_MANY_FILES", "Select at most " + PRODUCT_LIMITS.maxSelectedFiles + " files.");
  }
  const zipFiles = files.filter((file) => file.name.toLowerCase().endsWith(".zip"));
  if (zipFiles.length && (zipFiles.length !== 1 || files.length !== 1)) {
    throw new SourceError("MIXED_SELECTION", "Choose either one ZIP archive or direct XMP files, not both.");
  }
  if (!zipFiles.length && files.some((file) => !isXmp(file.name))) {
    throw new SourceError("UNSUPPORTED_FILE", "Direct selection accepts .xmp files only.");
  }
}

async function declaredSize(entry) {
  const compressed = await entry?._data;
  const size = compressed?.uncompressedSize;
  if (!Number.isSafeInteger(size) || size < 0) {
    throw new SourceError("ARCHIVE_SIZE_UNKNOWN", "Could not verify the uncompressed size of " + entry.name + ".");
  }
  return size;
}

export async function readZipFile(file) {
  if (file.size > PRODUCT_LIMITS.maxArchiveBytes) {
    throw new SourceError("ARCHIVE_TOO_LARGE", "The ZIP is larger than the 50 MB compressed safety limit.");
  }
  let archive;
  try {
    const bytes = typeof file.arrayBuffer === "function" ? await file.arrayBuffer() : file;
    archive = await JSZip.loadAsync(bytes, { checkCRC32: true, createFolders: false });
  } catch {
    throw new SourceError("INVALID_ARCHIVE", "The ZIP is damaged, encrypted, or not a supported archive.");
  }

  const candidates = Object.values(archive.files)
    .filter((entry) => !entry.dir)
    .sort((left, right) => left.name.localeCompare(right.name));
  if (candidates.length > PRODUCT_LIMITS.maxArchiveEntries) {
    throw new SourceError("TOO_MANY_ARCHIVE_ENTRIES", "The ZIP contains more than " + PRODUCT_LIMITS.maxArchiveEntries + " files.");
  }

  let expandedBytes = 0;
  const safeCandidates = [];
  for (const candidate of candidates) {
    const path = safePath(candidate.unsafeOriginalName || candidate.name);
    const size = await declaredSize(candidate);
    expandedBytes += size;
    validateExpandedBytes(expandedBytes);
    if (isXmp(path)) assertXmpSize(path, size);
    safeCandidates.push({ candidate, path });
  }
  const xmpCandidates = safeCandidates.filter(({ path }) => isXmp(path));
  assertXmpCount(xmpCandidates.length);
  if (!xmpCandidates.length) throw new SourceError("NO_XMP_FILES", "The ZIP contains no .xmp files.");

  const entries = [];
  try {
    for (const { candidate, path } of xmpCandidates) {
      entries.push({ path, bytes: await candidate.async("uint8array") });
    }
  } catch (error) {
    if (error instanceof SourceError) throw error;
    throw new SourceError("INVALID_ARCHIVE", "The ZIP is damaged, encrypted, or not a supported archive.");
  }
  return {
    releaseName: file.name,
    entries,
    otherPaths: safeCandidates.filter(({ path }) => !isXmp(path)).map(({ path }) => path),
  };
}

export async function readDirectFiles(files) {
  assertXmpCount(files.length);
  const entries = [];
  let expandedBytes = 0;
  for (const file of files) {
    const path = safePath(file.webkitRelativePath || file.name);
    assertXmpSize(path, file.size);
    const bytes = new Uint8Array(await file.arrayBuffer());
    expandedBytes += bytes.byteLength;
    validateExpandedBytes(expandedBytes);
    entries.push({ path, bytes });
  }
  return {
    releaseName: files.length === 1 ? files[0].name : String(files.length) + "-xmp-selection",
    entries,
    otherPaths: [],
  };
}

export async function readSources(fileList) {
  const files = Array.from(fileList || []);
  validateSelection(files);
  return files[0].name.toLowerCase().endsWith(".zip") ? readZipFile(files[0]) : readDirectFiles(files);
}
