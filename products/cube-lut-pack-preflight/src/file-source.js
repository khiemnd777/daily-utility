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
    throw new SourceError("UNSAFE_PATH", `Unsafe or overlong release path: ${String(path).slice(0, 160)}`);
  }
  return normalized;
}

function assertLutSize(path, size) {
  if (size > PRODUCT_LIMITS.maxLutBytes) {
    throw new SourceError("LUT_TOO_LARGE", `${path} is larger than the 20 MB per-LUT safety limit.`);
  }
}

export function validateExpandedBytes(size) {
  if (size > PRODUCT_LIMITS.maxExpandedBytes) {
    throw new SourceError("EXPANDED_TOO_LARGE", "Uncompressed release content exceeds the 150 MB safety limit.");
  }
}

function decodeCube(path, bytes) {
  assertLutSize(path, bytes.byteLength);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new SourceError("INVALID_ENCODING", `${path} is not valid UTF-8 text.`);
  }
}

function assertLutCount(count) {
  if (count > PRODUCT_LIMITS.maxLutFiles) {
    throw new SourceError("TOO_MANY_LUTS", `The safe limit is ${PRODUCT_LIMITS.maxLutFiles} CUBE LUT files per scan.`);
  }
}

export function validateSelection(files) {
  if (!files.length) throw new SourceError("NO_FILES", "Choose one ZIP or one or more .cube files.");
  if (files.length > PRODUCT_LIMITS.maxSelectedFiles) {
    throw new SourceError("TOO_MANY_FILES", `Select at most ${PRODUCT_LIMITS.maxSelectedFiles} files.`);
  }
  const zipFiles = files.filter((file) => file.name.toLowerCase().endsWith(".zip"));
  if (zipFiles.length && (files.length !== 1 || zipFiles.length !== 1)) {
    throw new SourceError("MIXED_SELECTION", "Choose either one ZIP archive or multiple .cube files, not both.");
  }
  if (!zipFiles.length && files.some((file) => !file.name.toLowerCase().endsWith(".cube"))) {
    throw new SourceError("UNSUPPORTED_FILE", "Direct selection accepts .cube files only.");
  }
}

function declaredSize(entry) {
  const size = entry?._data?.uncompressedSize;
  if (!Number.isSafeInteger(size) || size < 0) {
    throw new SourceError("ARCHIVE_SIZE_UNKNOWN", `Could not verify the declared uncompressed size of ${entry.name}.`);
  }
  return size;
}

export async function readZipFile(file) {
  if (file.size > PRODUCT_LIMITS.maxArchiveBytes) {
    throw new SourceError("ARCHIVE_TOO_LARGE", "The ZIP is larger than the 100 MB compressed safety limit.");
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
  if (candidates.length > PRODUCT_LIMITS.maxArchiveEntries) {
    throw new SourceError("TOO_MANY_ARCHIVE_ENTRIES", `The ZIP contains more than ${PRODUCT_LIMITS.maxArchiveEntries} files.`);
  }

  let declaredExpanded = 0;
  const safeCandidates = candidates.map((candidate) => {
    const originalPath = candidate.unsafeOriginalName || candidate.name;
    const path = safePath(originalPath);
    const size = declaredSize(candidate);
    declaredExpanded += size;
    validateExpandedBytes(declaredExpanded);
    if (path.toLowerCase().endsWith(".cube")) assertLutSize(path, size);
    return { candidate, path };
  });

  const lutCandidates = safeCandidates.filter(({ path }) => path.toLowerCase().endsWith(".cube"));
  assertLutCount(lutCandidates.length);
  if (!lutCandidates.length) throw new SourceError("NO_LUTS", "The ZIP contains no .cube files.");

  const entries = [];
  try {
    for (const { candidate, path } of lutCandidates) {
      const bytes = await candidate.async("uint8array");
      entries.push({ path, bytes, text: decodeCube(path, bytes) });
    }
  } catch (error) {
    if (error instanceof SourceError) throw error;
    throw new SourceError("INVALID_ARCHIVE", "The ZIP is damaged, encrypted, or not a supported archive.");
  }

  return {
    releaseName: file.name,
    entries,
    nonCubePaths: safeCandidates.filter(({ path }) => !path.toLowerCase().endsWith(".cube")).map(({ path }) => path),
  };
}

export async function readDirectFiles(files) {
  assertLutCount(files.length);
  const entries = [];
  let expandedBytes = 0;
  for (const file of files) {
    const path = safePath(file.webkitRelativePath || file.name);
    assertLutSize(path, file.size);
    const bytes = new Uint8Array(await file.arrayBuffer());
    expandedBytes += bytes.byteLength;
    validateExpandedBytes(expandedBytes);
    entries.push({ path, bytes, text: decodeCube(path, bytes) });
  }
  return {
    releaseName: files.length === 1 ? files[0].name : `${files.length}-cube-selection`,
    entries,
    nonCubePaths: [],
  };
}

export async function readSources(fileList) {
  const files = Array.from(fileList || []);
  validateSelection(files);
  return files[0].name.toLowerCase().endsWith(".zip") ? readZipFile(files[0]) : readDirectFiles(files);
}
