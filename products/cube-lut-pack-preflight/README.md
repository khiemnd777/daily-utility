# CUBE LUT Pack Preflight

CUBE LUT Pack Preflight is an offline release checker for independent LUT creators who sell ZIP packs. It scans one release ZIP or up to 100 direct `.cube` files, validates the selected standalone 1D/3D CUBE profile, detects duplicate transforms and bundle naming hazards, and exports auditable CSV or self-contained HTML evidence.

## Buyer usage

1. Download and unzip `cube-lut-pack-preflight-v1.0.0.zip`.
2. Open `index.html` in a current desktop browser.
3. Drop one release ZIP or select `.cube` files.
4. Resolve every blocker and review each bundle finding.
5. Export CSV or HTML evidence for the release record.
6. Test representative LUTs in every application or device you claim to support.

All parsing and SHA-256 hashing happen locally. The utility has no account, upload, API key, telemetry, analytics, remote fetch, or persistent browser storage. Input files are never modified.

## What it checks

- Required 1D or 3D size declaration, supported keyword spelling and order, numeric triplets, finite values within the selected CUBE profile, optional domain bounds, and exact table row count.
- Output values outside the common 0–1 range as review findings rather than automatic blockers.
- Exact duplicate file bytes and equivalent parsed table payloads across differently formatted files.
- Duplicate titles that point to distinct LUT data.
- Mixed declared LUT types or grid sizes.
- Paths that collide on case-insensitive systems.
- Non-CUBE files present in the release ZIP for manual confirmation.

The selected profile is intentionally narrow and inspectable. The utility does not render images, judge color quality or creative intent, guarantee compatibility, repair, resample, convert, install, inspect color profiles, review licenses, recurse into nested archives, or validate other LUT formats.

## Safety and operating limits

- One ZIP archive up to 100 MB compressed, or up to 100 direct `.cube` files.
- Up to 150 MB expanded release content.
- Up to 100 CUBE LUT files and 1,000 archive entries per scan.
- Up to 20 MB per LUT and paths up to 240 characters.
- Unsafe paths, nested archives, invalid UTF-8, damaged archives, unsupported selections, and over-limit inputs fail with customer-facing messages.
- A restrictive Content Security Policy disables network connections and embedded objects in the packaged app.

## Customer support

Buyers should reply to their Gumroad purchase receipt. If receipt replies are unavailable, email `khiemnd777@gmail.com` with the subject `CUBE LUT Pack Preflight support — <Gumroad order ID>`.

Include the purchase email or order ID, browser and version, operating system, exact error message, reproducible steps, and a minimal sanitized LUT or ZIP when needed. Do not send payment data, credentials, customer information, confidential footage, client assets, or LUTs you are not permitted to share.

Support covers purchase access and defects in documented core functionality for the verified purchaser. It does not include LUT repair, creative grading, pipeline certification, licensing review, custom integrations, or marketplace uploads. The normal response target is two business days; listing and receipt terms control refund eligibility.

## Development and verification

Requirements: Node.js 22 or newer and npm.

```bash
npm install
npm test
npm run test:browser
```

`npm test` builds and packages the exact offline buyer artifact, runs deterministic parser, bundle, input, report, and release-integrity tests. `npm run test:browser` loads the packaged workflow from `file://`, blocks outbound traffic, scans clean, malformed, duplicate, and oversized fixtures, downloads both report formats, verifies CSP and no persistent browser storage, and captures a visual acceptance screenshot.

The runtime dependency is JSZip 3.10.1 under its dual MIT/GPL license. Its license text is included in `THIRD_PARTY_NOTICES.txt` inside the buyer ZIP.
