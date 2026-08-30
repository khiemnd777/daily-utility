import { build } from "esbuild";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const productRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(productRoot, "src");
const distRoot = join(productRoot, "dist");

await rm(distRoot, { recursive: true, force: true });
await mkdir(distRoot, { recursive: true });

const result = await build({
  entryPoints: [join(sourceRoot, "app.js")],
  outfile: join(distRoot, "app.js"),
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2022"],
  minify: true,
  legalComments: "none",
  metafile: true,
});

await Promise.all([
  copyFile(join(sourceRoot, "index.html"), join(distRoot, "index.html")),
  copyFile(join(sourceRoot, "styles.css"), join(distRoot, "styles.css")),
  copyFile(join(productRoot, "support", "SUPPORT.txt"), join(distRoot, "SUPPORT.txt")),
]);

const packages = new Set();
for (const input of Object.keys(result.metafile.inputs)) {
  const match = input.replaceAll("\\", "/").match(/node_modules\/(?:@[^/]+\/[^/]+|[^/]+)/);
  if (match) packages.add(match[0].slice("node_modules/".length));
}

async function dependencyNotice(packageName) {
  const packageRoot = join(productRoot, "node_modules", packageName);
  const metadata = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
  const candidates = ["LICENSE", "LICENSE.md", "LICENSE.markdown", "LICENSE.txt", "license.md", "license.txt"];
  let license;
  for (const candidate of candidates) {
    try {
      license = await readFile(join(packageRoot, candidate), "utf8");
      break;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  if (!license) throw new Error(`No license text found for bundled dependency ${packageName}.`);
  const repository = typeof metadata.repository === "string" ? metadata.repository : metadata.repository?.url;
  return [
    `${metadata.name} ${metadata.version}`,
    `License: ${metadata.license}`,
    `Source: ${metadata.homepage || repository || "See package metadata"}`,
    "",
    license.trim(),
  ].join("\n");
}

const sections = [];
for (const packageName of [...packages].sort()) sections.push(await dependencyNotice(packageName));
await writeFile(
  join(distRoot, "THIRD_PARTY_NOTICES.txt"),
  [
    "MIDI Pack Preflight bundles the following runtime packages.",
    "Build-only dependencies are not included in the buyer application.",
    "",
    sections.join("\n\n---\n\n"),
    "",
  ].join("\n"),
  "utf8",
);
await writeFile(
  join(distRoot, "README.txt"),
  [
    "MIDI PACK PREFLIGHT 1.0.0",
    "",
    "Open index.html in a current desktop browser.",
    "Choose one ZIP or up to 2,000 .mid/.midi files, review every finding,",
    "then export CSV or self-contained HTML evidence.",
    "",
    "SAFETY LIMITS",
    "- ZIP: 100 MB compressed",
    "- Expanded release content: 150 MB",
    "- MIDI files: 2,000 per scan",
    "- Individual MIDI file: 10 MB",
    "- Archive entries: 5,000",
    "- Path length: 240 characters",
    "",
    "PRIVACY",
    "All parsing and SHA-256 hashing happen locally. There is no upload, account,",
    "telemetry, analytics, persistent storage, or outbound network request.",
    "Input files are never modified.",
    "",
    "BOUNDARIES",
    "This is structural preflight, not repair, musical review, rights advice, or a",
    "universal compatibility guarantee. Test representative files in every DAW,",
    "plugin, instrument, or hardware device you claim to support.",
    "",
    "SUPPORT",
    "See SUPPORT.txt or reply to your Gumroad receipt.",
    "Normal response target: two business days.",
    "",
  ].join("\n"),
  "utf8",
);
