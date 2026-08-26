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
- Non-HTTPS, malformed, missing, and duplicate targets.
- A PDF with no clickable link annotations.
- The visible placement of each clickable rectangle on every page.

Classification is deliberately conservative and is not a guarantee of URL availability or Canva permissions. Live link checks, Canva login/API access, licensing advice, PDF editing, OCR, QR-code extraction, password-protected PDFs, and marketplace uploads are out of scope.

## Development and verification

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm test
```

`npm test` builds the offline bundle, runs deterministic unit and PDF-integration tests, and creates `release/template-delivery-pdf-checker-v1.0.0.zip`.

The runtime dependency is PDF.js 6.2.108 under Apache-2.0. Its license is included in the downloadable bundle.
