# SVG Bundle Preflight

SVG Bundle Preflight is an offline batch release checker for solo sellers who package original Cricut-compatible SVG cut files. It scans one ZIP archive or a direct selection of SVGs, reports documented compatibility blockers, detects exact duplicate content and case-insensitive path collisions, and exports an auditable CSV or self-contained HTML report.

## Buyer usage

1. Download and unzip `svg-bundle-preflight-v1.0.0.zip`.
2. Open `index.html` in a current desktop browser.
3. Drop one ZIP archive or select one or more SVG files.
4. Resolve every blocker and review each bundle-hygiene warning.
5. Export a CSV or HTML report for the release record.
6. Import representative files into the target cutting software and perform a real test cut.

All parsing and SHA-256 hashing occur locally. The utility has no account, upload, telemetry, analytics, remote fetch, API integration, or persistent storage.

## What it checks

- Malformed XML and documents without an SVG root.
- Missing or invalid sizing metadata.
- Live text, clipping paths, pattern fills, and gradients.
- Linked resources, embedded bitmap images, scripts, and active URL references.
- Exact duplicate bytes across bundle paths.
- Paths that collide on case-insensitive systems.
- Nested SVG paths inside a ZIP, while counting ignored non-SVG files.

The tool does not modify source files. Automatic repair, raster tracing, path welding, open-contour analysis, physical test-cut simulation, nested archive recursion, DXF/EPS/PNG validation, cloud storage, marketplace integrations, machine settings, and legal or licensing advice are out of scope. Static inspection cannot guarantee behavior in every software or machine version.

## Safety and operating limits

- One ZIP archive up to 50 MB compressed.
- Up to 100 MB of expanded SVG content.
- Up to 500 SVG files per scan.
- Up to 2 MB per SVG.
- Paths up to 240 characters.
- Unsafe archive paths, invalid UTF-8, damaged archives, encrypted archives, and over-limit inputs fail with a customer-facing recovery message.
- A restrictive Content Security Policy disables network connections and embedded objects in the packaged app.

## Customer support

Buyers should reply to their Gumroad purchase receipt. If receipt replies are unavailable, email `khiemnd777@gmail.com` with the subject `SVG Bundle Preflight support — <Gumroad order ID>`.

Include the purchase email or order ID, browser and version, operating system, exact error message, reproducible steps, and a minimal sanitized SVG or ZIP when needed. Do not send payment data, credentials, customer information, licensed assets that cannot be shared, or confidential client files.

Support covers purchase access and defects in documented core functionality for the verified purchaser. It does not include SVG repair, machine troubleshooting, commercial-license review, trademark advice, custom integrations, or marketplace uploads. The normal response target is two business days; listing and receipt terms control refund eligibility.

## Development and verification

Requirements: Node.js 22 or newer and npm.

```bash
npm install
npm test
npm run test:browser
```

`npm test` builds and packages the exact offline buyer artifact, runs deterministic parser/rule/input/report tests, and verifies release contents. `npm run test:browser` runs the packaged workflow from `file://`, blocks outbound traffic, scans valid, failing, and duplicate ZIP fixtures, downloads both reports, verifies restrictive CSP and no persistent browser storage, and captures a visual acceptance screenshot.

The runtime dependencies are JSZip 3.10.1 under its dual MIT/GPL license, Saxes 6.0.0 under ISC, and xmlchars 2.2.0 under MIT. The downloadable bundle includes their license texts in `THIRD_PARTY_NOTICES.txt`.
