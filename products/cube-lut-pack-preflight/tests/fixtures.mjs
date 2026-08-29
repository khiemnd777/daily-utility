import { strToU8, zipSync } from "fflate";

function number(value) {
  return Number(value).toFixed(6);
}

export function cube1d(size = 4, options = {}) {
  const title = options.title ?? "Identity 1D";
  const mapper = options.mapper || ((value) => [value, value, value]);
  const rows = [];
  for (let index = 0; index < size; index += 1) {
    const value = index / (size - 1);
    rows.push(mapper(value, index).map(number).join(" "));
  }
  return [
    ...(options.comments || ["# deterministic fixture"]),
    `TITLE "${title}"`,
    ...(options.domainMin ? [`DOMAIN_MIN ${options.domainMin.join(" ")}`] : []),
    ...(options.domainMax ? [`DOMAIN_MAX ${options.domainMax.join(" ")}`] : []),
    `LUT_1D_SIZE ${size}`,
    ...rows,
    "",
  ].join("\n");
}

export function cube3d(size = 2, options = {}) {
  const title = options.title ?? "Identity 3D";
  const mapper = options.mapper || ((red, green, blue) => [red, green, blue]);
  const rows = [];
  for (let blueIndex = 0; blueIndex < size; blueIndex += 1) {
    for (let greenIndex = 0; greenIndex < size; greenIndex += 1) {
      for (let redIndex = 0; redIndex < size; redIndex += 1) {
        rows.push(
          mapper(
            redIndex / (size - 1),
            greenIndex / (size - 1),
            blueIndex / (size - 1),
          ).map(number).join(" "),
        );
      }
    }
  }
  return [
    ...(options.comments || ["# deterministic fixture"]),
    `TITLE "${title}"`,
    ...(options.domainMin ? [`DOMAIN_MIN ${options.domainMin.join(" ")}`] : []),
    ...(options.domainMax ? [`DOMAIN_MAX ${options.domainMax.join(" ")}`] : []),
    `LUT_3D_SIZE ${size}`,
    ...rows,
    "",
  ].join("\n");
}

export const CLEAN_LUTS = {
  "looks/identity-1d.cube": cube1d(4),
  "looks/identity-3d.cube": cube3d(2),
};

export const MALFORMED_LUTS = {
  "01-missing-size.cube": "TITLE \"Missing size\"\n0 0 0\n1 1 1\n",
  "02-repeated-keyword.cube": "LUT_1D_SIZE 2\nLUT_1D_SIZE 2\n0 0 0\n1 1 1\n",
  "03-keyword-after-data.cube": "LUT_1D_SIZE 2\n0 0 0\nTITLE \"Late\"\n1 1 1\n",
  "04-invalid-triplet.cube": "LUT_1D_SIZE 2\n0 0 nope\n1 1 1\n",
  "05-non-finite.cube": "LUT_1D_SIZE 2\n1e999 0 0\n1 1 1\n",
  "06-invalid-domain.cube": "DOMAIN_MIN 1 0 0\nDOMAIN_MAX 0 1 1\nLUT_1D_SIZE 2\n0 0 0\n1 1 1\n",
  "07-short-data.cube": "LUT_1D_SIZE 3\n0 0 0\n1 1 1\n",
  "08-extra-data.cube": "LUT_1D_SIZE 2\n0 0 0\n0.5 0.5 0.5\n1 1 1\n",
};

export function entriesFromMap(map) {
  return Object.entries(map).map(([path, text]) => ({ path, text, bytes: new TextEncoder().encode(text) }));
}

export function zipFromMap(map) {
  const files = {};
  for (const [path, value] of Object.entries(map)) {
    files[path] = value instanceof Uint8Array ? value : strToU8(value);
  }
  return zipSync(files, { level: 9, mtime: new Date("2026-08-29T00:00:00Z") });
}

export function fakeFile(name, bytes, extra = {}) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return {
    name,
    size: data.byteLength,
    type: extra.type || "",
    webkitRelativePath: extra.webkitRelativePath || "",
    async arrayBuffer() {
      return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    },
  };
}
