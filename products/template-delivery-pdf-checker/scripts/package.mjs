import { zipSync } from "fflate";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const productRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = join(productRoot, "dist");
const releaseRoot = join(productRoot, "release");
const archivePath = join(releaseRoot, "template-delivery-pdf-checker-v1.0.0.zip");

async function collect(directory, entries = {}) {
  const names = (await readdir(directory, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  for (const entry of names) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      await collect(absolute, entries);
    } else {
      entries[relative(distRoot, absolute).replaceAll("\\", "/")] = new Uint8Array(
        await readFile(absolute),
      );
    }
  }
  return entries;
}

await mkdir(releaseRoot, { recursive: true });
const archive = zipSync(await collect(distRoot), { level: 9, mtime: new Date("2026-08-26T00:00:00Z") });
await writeFile(archivePath, archive);
console.log(`Packaged ${archivePath}`);
