# Gumroad trust uplift verification

Linked proposal: https://github.com/khiemnd777/daily-utility/issues/14

## Immutable release facts

| Product | Price | Release file | SHA-256 |
| --- | ---: | --- | --- |
| Template Delivery PDF Checker | $12 USD | `template-delivery-pdf-checker-v1.0.0.zip` | `a035efc717ff96bfed1071adae526d48fad5ffb448edbfdaa8d7584053106221` |
| SVG Bundle Preflight | $15 USD | `svg-bundle-preflight-v1.0.0.zip` | `fd6cc04cab9f9306ccba844c43b598031540bfb73abfd27d5db5be0f8c0683fd` |

The trust uplift must not replace either release archive, change either price, or alter license and support scope.

## Build verification

- [x] The reviewed storefront source defines the exact bio, page order, section types, product order, and Tianna preservation boundary.
- [x] Both listing Markdown files contain the exact reviewed descriptions, summaries, attributes, carousel order, preview URLs, and refund policies.
- [x] All screenshots are 1600 × 900 PNG files produced by the checked-in generation scripts from the delivered applications.
- [x] Sample reports are generated from deterministic sanitized fixtures.
- [x] Product tests and browser acceptance tests pass.
- [x] Manifest validation passes.
- [x] Release archive SHA-256 values match the immutable facts above.

## Release verification

- [x] Issue #14 was re-read and verified as `APPROVED_RELEASE` immediately before live changes.
- [x] KNA Software's public profile shows both utility products and leaves Tianna unchanged.
- [x] Public product title, summary, price, description, evidence images, preview destinations, support route, release facts, and refund policy were verified against the reviewed files; Gumroad-specific presentation constraints are recorded below.
- [x] Buyer-facing delivery still provides the same versioned ZIP.
- [x] Both downloaded buyer artifacts match the approved SHA-256 values.

No live checkbox may be marked from repository evidence alone; release verification requires the public buyer experience.

## Publication evidence

Verified at `2026-08-27T10:02:17Z` through the authenticated seller editor and fresh buyer-facing views.

| Surface | Verified result |
| --- | --- |
| Public storefront | https://khiemnd2.gumroad.com/ shows the approved bio, **Offline QA Tools** as the first tab, both utilities at $12/$15, and the unchanged **Commercial Source Code** tab with Tianna's $249/$799/$1,499 tiers. |
| PDF Checker | https://khiemnd2.gumroad.com/l/template-delivery-pdf-checker shows version 1.0.0, 754.8 KB, four new evidence images plus the retained original cover, the approved summary/description/support language, buyer-visible sample-report URLs, and the aligned seven-day refund promise. |
| SVG Preflight | https://khiemnd2.gumroad.com/l/svg-bundle-preflight shows version 1.0.0, 61.3 KB, four new evidence images plus the retained original cover, the approved summary/description/support language, buyer-visible sample-report URLs, and the aligned seven-day refund promise. |
| Buyer delivery | The seller-accessible buyer delivery for each product still exposes the original versioned ZIP and support file. Downloaded ZIP checksums matched the immutable facts above. |

## Gumroad presentation constraints

- The current cover uploader appends new media after an existing cover. Both listings therefore retain their original cover first, followed by the four approved evidence images in workflow, results, report-preview, and contents order. No cover was deleted or replaced.
- The current product editor persists four editable additional-detail rows. PDF Checker uses **Runs**, **Version**, **Download**, and **Exports**; its Detects, Browsers, and License facts remain in the reviewed description. SVG Preflight retains its automatic **Size** row plus **Runs**, **Checks**, **Exports**, and **Version**.
- Gumroad rendered the raw sample-report destinations as visible text in the product description rather than clickable rich-text links. The exact approved destinations remain buyer-visible and publicly accessible.
