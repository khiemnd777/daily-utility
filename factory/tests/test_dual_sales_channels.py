#!/usr/bin/env python3
"""Regression tests for legacy and dual-channel release records."""

from __future__ import annotations

import copy
import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

from factory.scripts import validate_manifest as manifest_contract


ROOT = Path(__file__).resolve().parents[2]


def load_json(path: str) -> dict:
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


class DualSalesChannelSchemaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest_validator = Draft202012Validator(
            load_json("factory/schemas/product-manifest.schema.json"),
            format_checker=FormatChecker(),
        )
        cls.publication_validator = Draft202012Validator(
            load_json("factory/schemas/publication.schema.json"),
            format_checker=FormatChecker(),
        )

    def test_existing_gumroad_only_records_remain_valid(self) -> None:
        for product_id in (
            "svg-bundle-preflight",
            "template-delivery-pdf-checker",
        ):
            manifest = load_json(f"products/{product_id}/product-manifest.json")
            publication = load_json(f"products/{product_id}/publication.json")
            self.assertEqual([], list(self.manifest_validator.iter_errors(manifest)))
            self.assertEqual(
                [], list(self.publication_validator.iter_errors(publication))
            )

    def test_v2_templates_require_both_sales_channels(self) -> None:
        manifest = load_json("templates/product-manifest.json")
        publication = load_json("templates/publication.json")
        self.assertEqual([], list(self.manifest_validator.iter_errors(manifest)))
        self.assertEqual([], list(self.publication_validator.iter_errors(publication)))

        manifest["distribution"]["channels"] = ["gumroad"]
        publication["sales_channels"] = publication["sales_channels"][:1]
        self.assertTrue(list(self.manifest_validator.iter_errors(manifest)))
        self.assertTrue(list(self.publication_validator.iter_errors(publication)))

    def test_v2_rejects_single_use_lemon_squeezy_cart_url(self) -> None:
        publication = copy.deepcopy(load_json("templates/publication.json"))
        lemon = next(
            record
            for record in publication["sales_channels"]
            if record["channel"] == "lemon-squeezy"
        )
        lemon["url"] = "https://seller.lemonsqueezy.com/checkout/?cart=single-use"
        self.assertTrue(list(self.publication_validator.iter_errors(publication)))

    def test_v2_contract_requires_matching_prices_and_delivered_bytes(self) -> None:
        product_id = "dual-channel-contract-test"
        manifest = copy.deepcopy(load_json("templates/product-manifest.json"))
        manifest.update(
            {
                "product_id": product_id,
                "name": "Dual Channel Contract Test",
                "state": "PUBLISHED",
                "source_issue": 23,
            }
        )
        manifest["pricing"]["amount_cents"] = 1900
        manifest["acceptance_checks"][0]["status"] = "passed"

        publication = copy.deepcopy(load_json("templates/publication.json"))
        publication["product_id"] = product_id
        publication["sales_channels"][0]["url"] = (
            f"https://seller.gumroad.com/l/{product_id}"
        )
        publication["sales_channels"][1]["url"] = (
            "https://seller.lemonsqueezy.com/checkout/buy/dual-channel-test"
        )
        publication["catalog"]["url"] = (
            f"https://knasoftware.com/sources/{product_id}"
        )
        for sale in publication["sales_channels"]:
            sale["price"]["amount_cents"] = 1900

        with tempfile.TemporaryDirectory() as temporary_root:
            root = Path(temporary_root)
            product_root = root / "products" / product_id
            release_root = product_root / "release"
            release_root.mkdir(parents=True)
            artifact_relative = f"products/{product_id}/release/{product_id}-v1.0.0.zip"
            publication_relative = f"products/{product_id}/publication.json"
            artifact_path = root / artifact_relative
            artifact_path.write_bytes(b"approved release bytes")
            digest = hashlib.sha256(artifact_path.read_bytes()).hexdigest()

            manifest["artifacts"] = [artifact_relative, publication_relative]
            publication["artifact"] = artifact_relative
            publication["artifact_sha256"] = digest
            for sale in publication["sales_channels"]:
                sale["delivered_artifact_sha256"] = digest

            manifest_path = product_root / "product-manifest.json"
            publication_path = product_root / "publication.json"
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
            publication_path.write_text(json.dumps(publication), encoding="utf-8")

            original_root = manifest_contract.ROOT
            manifest_contract.ROOT = root
            try:
                self.assertEqual(
                    [],
                    manifest_contract.validate_product_contract(
                        manifest_path,
                        manifest,
                        self.publication_validator,
                    ),
                )

                publication["sales_channels"][1]["price"]["amount_cents"] = 1800
                publication["sales_channels"][1][
                    "delivered_artifact_sha256"
                ] = "0" * 64
                publication_path.write_text(json.dumps(publication), encoding="utf-8")
                errors = manifest_contract.validate_product_contract(
                    manifest_path,
                    manifest,
                    self.publication_validator,
                )
                self.assertTrue(
                    any("price must match manifest pricing" in error for error in errors)
                )
                self.assertTrue(
                    any(
                        "delivered artifact checksum must match" in error
                        for error in errors
                    )
                )
            finally:
                manifest_contract.ROOT = original_root


if __name__ == "__main__":
    unittest.main()
