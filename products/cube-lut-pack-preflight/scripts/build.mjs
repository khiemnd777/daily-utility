import { build } from "esbuild";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const productRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(productRoot, "src");
const distRoot = join(productRoot, "dist");

await rm(distRoot, { recursive: true, force: true });
await mkdir(distRoot, { recursive: true });

const buildResult = await build({
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
]);

const packageNames = new Set();
for (const input of Object.keys(buildResult.metafile.inputs)) {
  const match = input.replaceAll("\\", "/").match(/node_modules\/(?:@[^/]+\/[^/]+|[^/]+)/);
  if (match) packageNames.add(match[0].slice("node_modules/".length));
}

async function licenseText(packageName) {
  const packageRoot = join(productRoot, "node_modules", packageName);
  const metadata = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
  const candidates = ["LICENSE", "LICENSE.md", "LICENSE.markdown", "LICENSE.txt", "license.md", "license.txt"];
  let license = null;
  for (const candidate of candidates) {
    try {
      license = await readFile(join(packageRoot, candidate), "utf8");
      break;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  if (!license) throw new Error(`No license text found for bundled package ${packageName}.`);
  const repository = typeof metadata.repository === "string" ? metadata.repository : metadata.repository?.url;
  return [
    `${metadata.name} ${metadata.version}`,
    `License: ${metadata.license}`,
    `Source: ${metadata.homepage || repository || "See package metadata"}`,
    "",
    license.trim(),
  ].join("\n");
}

const noticeSections = [];
for (const packageName of [...packageNames].sort()) noticeSections.push(await licenseText(packageName));
await writeFile(
  join(distRoot, "THIRD_PARTY_NOTICES.txt"),
  [
    "CUBE LUT Pack Preflight bundles the following runtime packages.",
    "Build-only dependencies are not included in the buyer application.",
    "",
    noticeSections.join("\n\n---\n\n"),
    "",
  ].join("\n"),
  "utf8",
);

await writeFile(
  join(distRoot, "README.txt"),
  [
    "CUBE LUT PACK PREFLIGHT 1.0.0",
    "",
    "Open index.html in a current desktop browser.",
    "Choose one ZIP or up to 100 .cube files, review every blocker and review finding,",
    "then export CSV or self-contained HTML evidence.",
    "",
    "SAFETY LIMITS",
    "- ZIP: 100 MB compressed",
    "- Expanded release content: 150 MB",
    "- CUBE LUT files: 100 per scan",
    "- Individual LUT: 20 MB",
    "- Archive entries: 1,000",
    "- Path length: 240 characters",
    "",
    "PRIVACY",
    "All parsing and SHA-256 hashing happen locally. The application has no upload,",
    "account, telemetry, analytics, persistent storage, or outbound network request.",
    "Input files are never modified.",
    "",
    "BOUNDARIES",
    "This is structural preflight, not a color-accuracy or compatibility guarantee.",
    "It does not render, repair, resample, convert, install, or judge LUTs. A static pass",
    "does not replace representative testing in every application or device you claim to support.",
    "",
    "SUPPORT",
    "Reply to your Gumroad receipt for purchase access or documented core-functionality support.",
    "Never send payment data, credentials, customer information, confidential footage,",
    "or LUT files you are not permitted to share.",
    "Normal response target: two business days.",
    "",
  ].join("\n"),
  "utf8",
);
