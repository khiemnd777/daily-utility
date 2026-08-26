# Template Delivery PDF Checker

Template Delivery PDF Checker is an offline browser utility for Etsy and Gumroad sellers who deliver editable Canva templates through PDF files. It inventories the PDF's clickable annotations, highlights their exact locations, and warns about common delivery mistakes before the file reaches a buyer.

## Buyer usage

1. Download and unzip `template-delivery-pdf-checker-v1.0.0.zip`.
2. Open `index.html` in a current desktop browser.
3. Drop in a delivery PDF or choose it from the file picker.
4. Review every warning and clickable-area overlay.
5. Export a Markdown or CSV QA report for the listing record.

All parsing occurs locally. The utility has no account, analytics, upload, live URL request, or API integration.

## What it checks

- Clickable PDF link annotations and their page numbers.
- Canva template-like links (`/template/` or a design view URL with `mode=preview`).
- Canva view/edit/share links that do not look template-like.
- Unrecognized Canva URL formats, which are always sent to manual review instead of being marked safe.
- Non-HTTPS, malformed, missing, and duplicate targets.
- Blocked active-content targets such as `javascript:`, `data:`, and `file:` links.
- A PDF with no clickable link annotations.
- The visible placement of each clickable rectangle on every page.

Classification is deliberately conservative and is not a guarantee of URL availability or Canva permissions. Live link checks, Canva login/API access, licensing advice, PDF editing, OCR, QR-code extraction, password-protected PDFs, and marketplace uploads are out of scope.

## Safety and operating limits

- Maximum PDF size: 25 MB.
- Maximum page count: 200.
- Maximum clickable links: 2,000.
- Long scans show page progress and can be cancelled.
- Damaged, encrypted, oversized, or over-limit PDFs fail with a customer-facing recovery message.
- PDF.js JavaScript evaluation is disabled for untrusted documents.
- The packaged app has a Content Security Policy with `connect-src 'none'` and makes no network requests.

## Development and verification

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm test
```

`npm test` builds and packages the offline bundle, runs deterministic unit tests, exercises an 18-profile PDF annotation compatibility/security corpus, and verifies the release ZIP. `npm run test:browser` runs the app from `file://` across local Chrome, Edge, Firefox, and WebKit; it verifies zero outbound requests, overlays, real Markdown/CSV downloads, a Chrome print-to-PDF export, page limits, and corrupt-PDF recovery.

The runtime dependency is PDF.js 6.2.108 under Apache-2.0. Its license is included in the downloadable bundle.
