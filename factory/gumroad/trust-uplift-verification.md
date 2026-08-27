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

- [ ] Issue #14 is re-read and verified as `APPROVED_RELEASE` immediately before live changes.
- [ ] KNA Software's public profile shows both utility products and leaves Tianna unchanged.
- [ ] Public product title, summary, price, attributes, description, images, preview links, support route, and refund policy match the reviewed files.
- [ ] Buyer-facing delivery still provides the same versioned ZIP.
- [ ] A downloaded buyer artifact matches the approved SHA-256.

No live checkbox may be marked from repository evidence alone; release verification requires the public buyer experience.
