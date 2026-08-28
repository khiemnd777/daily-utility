import JSZip from "jszip";

import { PRODUCT_LIMITS } from "./limits.js";

const TEXT_PART = /(?:\.xml|\.rels)$/i;

export class PackageError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PackageError";
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
    throw new PackageError("UNSAFE_PATH", `Unsafe or overlong package path: ${String(path).slice(0, 160)}`);
  }
  return normalized;
}

function validateFile(file) {
  const name = String(file?.name || "");
  if (!/\.(?:pptx|potx)$/i.test(name)) {
    throw new PackageError("UNSUPPORTED_FILE", "Choose one .pptx or .potx presentation template.");
  }
  if (Number(file?.size || 0) > PRODUCT_LIMITS.maxFileBytes) {
    throw new PackageError("FILE_TOO_LARGE", "The presentation is larger than the 100 MB safety limit.");
  }
}

function entryUncompressedSize(entry) {
  const size = entry?._data?.uncompressedSize;
  return Number.isFinite(size) ? Number(size) : null;
}

export async function readPresentationPackage(file) {
  validateFile(file);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength > PRODUCT_LIMITS.maxFileBytes) {
    throw new PackageError("FILE_TOO_LARGE", "The presentation is larger than the 100 MB safety limit.");
  }

  let archive;
  try {
    archive = await JSZip.loadAsync(bytes, { createFolders: false });
  } catch {
    throw new PackageError(
      "INVALID_PACKAGE",
      "The file is damaged, encrypted, or not a readable PowerPoint OOXML package.",
    );
  }

  const entries = Object.values(archive.files)
    .filter((entry) => !entry.dir)
    .sort((left, right) => left.name.localeCompare(right.name));
  if (entries.length > PRODUCT_LIMITS.maxEntries) {
    throw new PackageError(
      "TOO_MANY_PARTS",
      `The package contains more than ${PRODUCT_LIMITS.maxEntries.toLocaleString("en-US")} parts.`,
    );
  }

  const paths = new Set();
  const metadata = [];
  let declaredExpandedBytes = 0;
  for (const entry of entries) {
    const path = safePath(entry.unsafeOriginalName || entry.name);
    const declaredSize = entryUncompressedSize(entry);
    if (declaredSize !== null) declaredExpandedBytes += declaredSize;
    paths.add(path);
    metadata.push({ path, declaredSize });
  }
  if (declaredExpandedBytes > PRODUCT_LIMITS.maxExpandedBytes) {
    throw new PackageError("EXPANDED_TOO_LARGE", "Expanded package content exceeds the 250 MB safety limit.");
  }
  if (!paths.has("[Content_Types].xml") || !paths.has("ppt/presentation.xml")) {
    throw new PackageError(
      "NOT_PRESENTATION",
      "The archive does not contain the required PowerPoint presentation parts.",
    );
  }

  const textParts = new Map();
  let observedTextBytes = 0;
  for (const entry of entries) {
    const path = safePath(entry.unsafeOriginalName || entry.name);
    if (path !== "[Content_Types].xml" && !TEXT_PART.test(path)) continue;
    const declaredSize = entryUncompressedSize(entry);
    if (declaredSize !== null && declaredSize > PRODUCT_LIMITS.maxXmlPartBytes) {
      throw new PackageError("XML_PART_TOO_LARGE", `${path} exceeds the 5 MB XML-part safety limit.`);
    }
    const partBytes = await entry.async("uint8array");
    if (partBytes.byteLength > PRODUCT_LIMITS.maxXmlPartBytes) {
      throw new PackageError("XML_PART_TOO_LARGE", `${path} exceeds the 5 MB XML-part safety limit.`);
    }
    observedTextBytes += partBytes.byteLength;
    if (observedTextBytes > PRODUCT_LIMITS.maxExpandedBytes) {
      throw new PackageError("EXPANDED_TOO_LARGE", "Expanded package content exceeds the 250 MB safety limit.");
    }
    try {
      textParts.set(path, new TextDecoder("utf-8", { fatal: true }).decode(partBytes));
    } catch {
      throw new PackageError("INVALID_XML_ENCODING", `${path} is not valid UTF-8 XML text.`);
    }
  }

  return {
    filename: String(file.name),
    fileSize: bytes.byteLength,
    extension: file.name.toLowerCase().endsWith(".potx") ? "potx" : "pptx",
    bytes,
    paths,
    metadata,
    textParts,
  };
}
