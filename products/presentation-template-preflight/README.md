# Presentation Template Preflight

Presentation Template Preflight is an offline, non-destructive release checker for freelance PowerPoint template designers and boutique presentation studios. It scans one editable `.pptx` or `.potx` package, inventories its OOXML structure, identifies broken or external relationships, maps referenced fonts to embedded-font records, reports hidden content and personal metadata, and exports CSV and self-contained HTML evidence.

## Buyer usage

1. Download and unzip `presentation-template-preflight-v1.0.0.zip`.
2. Open `index.html` in a current desktop browser.
3. Drop one final `.pptx` or `.potx` delivery file.
4. Resolve every blocker and review each warning.
5. Export the CSV and HTML reports for the release record.
6. Open the unchanged presentation in the PowerPoint versions your buyers use and perform a visual delivery check.

All parsing and SHA-256 hashing occur locally. The utility has no account, upload, telemetry, analytics, remote fetch, API integration, or persistent browser storage.

## What it checks

- Slide, layout, master, package-part, dimension, and aspect-ratio inventory.
- Every internal OOXML relationship target, including its normalized package path.
- External local-file, media, data, and web relationships with source-part evidence.
- Referenced font families compared with embedded-font records; an unembedded font is a portability warning rather than proof of rendering failure or licensing status.
- Comments, speaker notes, hidden slides, embedded objects, VBA macro projects, creator metadata, and last-modified-by metadata.
- Input filename, exact byte size, SHA-256, scan timestamp, severity totals, and every finding in both report formats.

The tool never modifies the presentation. It does not render slides, prove visual fidelity, repair files, determine font installation or licensing, certify accessibility, evaluate animation or design quality, execute macros or embedded objects, check spelling, open legacy `.ppt`, validate Keynote/Google Slides/PDF, decrypt protected files, or upload to a marketplace.

## Safety and operating limits

- One `.pptx` or `.potx` file up to 100 MB.
- Up to 5,000 package parts and 250 MB of declared expanded package content.
- Up to 5 MB per XML or relationships part.
- Package paths up to 260 characters; unsafe traversal paths are rejected.
- Damaged, encrypted, unsupported, malformed, and over-limit inputs fail with a customer-facing recovery message.
- A restrictive Content Security Policy disables network connections, embedded objects, frames, and form submissions.

## Customer support

Buyers should reply to their Gumroad or Lemon Squeezy purchase receipt. If receipt replies are unavailable, email `khiemnd777@gmail.com` with the subject `Presentation Template Preflight support — <order ID>`.

Include the purchase channel and order ID, browser and version, operating system, exact error message, reproducible steps, and a minimal sanitized presentation only if you are authorized to share it. Never send payment data, credentials, customer information, confidential client decks, or licensed assets that cannot be shared.

Support covers purchase access and defects in documented core functionality. It excludes presentation repair, design advice, font licensing, accessibility certification, Microsoft 365 troubleshooting, custom integrations, and marketplace uploads. The normal response target is two business days; listing and receipt terms control refund eligibility.

## Development and verification

Requirements: Node.js 22 or newer and npm.

```bash
npm install
npm test
npm run test:browser
```

`npm test` builds and packages the exact offline buyer artifact, runs deterministic OOXML, rule, input, report, and release-content tests. `npm run test:browser` runs the packaged workflow from `file://`, blocks outbound traffic, scans deterministic fixtures, downloads both reports, verifies the restrictive CSP and absence of persistent browser storage, and captures a visual acceptance screenshot.

Runtime dependencies are JSZip 3.10.1 under its dual MIT/GPL license, Saxes 6.0.0 under ISC, and xmlchars 2.2.0 under MIT. Their license texts ship in `THIRD_PARTY_NOTICES.txt`.
