#!/usr/bin/env python3
"""Regression tests for the Gumroad-only policy and legacy channel retirement."""

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


class SalesChannelPolicyTests(unittest.TestCase):
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

    def test_active_templates_are_gumroad_only(self) -> None:
        manifest = load_json("templates/product-manifest.json")
        publication = load_json("templates/publication.json")

        self.assertEqual(1, manifest["schema_version"])
        self.assertEqual("gumroad", manifest["distribution"]["channel"])
        self.assertNotIn("channels", manifest["distribution"])
        self.assertEqual(4, publication["schema_version"])
        self.assertEqual("gumroad", publication["sales_channels"][0]["channel"])
        self.assertEqual([], list(self.manifest_validator.iter_errors(manifest)))
        self.assertEqual(
            [], list(self.publication_validator.iter_errors(publication))
        )

    def test_existing_legacy_records_remain_readable_during_migration(self) -> None:
        manifest = load_json(
            "products/presentation-template-preflight/product-manifest.json"
        )
        publication = load_json(
            "products/presentation-template-preflight/publication.json"
        )
        self.assertEqual([], list(self.manifest_validator.iter_errors(manifest)))
        self.assertEqual(
            [], list(self.publication_validator.iter_errors(publication))
        )

    def test_active_gumroad_release_requires_matching_price_and_bytes(self) -> None:
        product_id = "gumroad-contract-test"
        manifest = copy.deepcopy(load_json("templates/product-manifest.json"))
        manifest.update(
            {
                "product_id": product_id,
                "name": "Gumroad Contract Test",
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
        publication["sales_channels"][0]["price"]["amount_cents"] = 1900
        publication["catalog"]["url"] = (
            f"https://knasoftware.com/sources/{product_id}"
        )

        with tempfile.TemporaryDirectory() as temporary_root:
            root = Path(temporary_root)
            product_root = root / "products" / product_id
            release_root = product_root / "release"
            release_root.mkdir(parents=True)
            artifact_relative = (
                f"products/{product_id}/release/{product_id}-v1.0.0.zip"
            )
            publication_relative = f"products/{product_id}/publication.json"
            artifact_path = root / artifact_relative
            artifact_path.write_bytes(b"approved Gumroad release bytes")
            digest = hashlib.sha256(artifact_path.read_bytes()).hexdigest()

            manifest["artifacts"] = [artifact_relative, publication_relative]
            publication["artifact"] = artifact_relative
            publication["artifact_sha256"] = digest
            publication["sales_channels"][0][
                "delivered_artifact_sha256"
            ] = digest

            manifest_path = product_root / "product-manifest.json"
            publication_path = product_root / "publication.json"
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
            publication_path.write_text(
                json.dumps(publication), encoding="utf-8"
            )

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

                publication["sales_channels"][0]["price"][
                    "amount_cents"
                ] = 1800
                publication["sales_channels"][0][
                    "delivered_artifact_sha256"
                ] = "0" * 64
                publication_path.write_text(
                    json.dumps(publication), encoding="utf-8"
                )
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

    def test_retired_remaining_channel_can_complete_with_gumroad_only(self) -> None:
        product_id = "retired-channel-contract-test"
        manifest = copy.deepcopy(
            load_json("products/presentation-template-preflight/product-manifest.json")
        )
        manifest.update(
            {
                "product_id": product_id,
                "name": "Retired Channel Contract Test",
                "state": "PUBLISHED",
                "source_issue": 23,
            }
        )
        manifest["distribution"]["channels"] = ["gumroad"]
        manifest["pricing"]["amount_cents"] = 1900
        manifest["acceptance_checks"] = [
            {
                "id": "release-check",
                "description": "Verified release evidence",
                "required": True,
                "status": "passed",
            }
        ]

        publication = copy.deepcopy(
            load_json("products/presentation-template-preflight/publication.json")
        )
        publication["product_id"] = product_id
        publication["status"] = "complete"
        publication["pending_channels"] = []
        publication["retired_channels"] = ["lemon-squeezy"]
        publication["retirement"] = {
            "channel": "lemon-squeezy",
            "reason": "owner-retired-channel",
            "seller_product_id": "1323100",
            "checkout_url": (
                "https://seller.lemonsqueezy.com/checkout/buy/"
                "retired-channel-contract-test"
            ),
            "retired_at": "2026-08-28T16:22:36Z",
            "checkout_inactive_verified_at": "2026-08-28T16:22:36Z",
        }
        publication["sales_channels"][0]["url"] = (
            f"https://seller.gumroad.com/l/{product_id}"
        )
        publication["sales_channels"][0]["price"]["amount_cents"] = 1900
        publication["catalog"]["url"] = (
            f"https://knasoftware.com/sources/{product_id}"
        )

        with tempfile.TemporaryDirectory() as temporary_root:
            root = Path(temporary_root)
            product_root = root / "products" / product_id
            release_root = product_root / "release"
            release_root.mkdir(parents=True)
            artifact_relative = (
                f"products/{product_id}/release/{product_id}-v1.0.0.zip"
            )
            publication_relative = f"products/{product_id}/publication.json"
            artifact_path = root / artifact_relative
            artifact_path.write_bytes(b"approved Gumroad bytes")
            digest = hashlib.sha256(artifact_path.read_bytes()).hexdigest()

            manifest["artifacts"] = [artifact_relative, publication_relative]
            publication["artifact"] = artifact_relative
            publication["artifact_sha256"] = digest
            publication["sales_channels"][0][
                "delivered_artifact_sha256"
            ] = digest

            manifest_path = product_root / "product-manifest.json"
            publication_path = product_root / "publication.json"
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
            publication_path.write_text(
                json.dumps(publication), encoding="utf-8"
            )

            original_root = manifest_contract.ROOT
            manifest_contract.ROOT = root
            try:
                self.assertEqual(
                    [],
                    list(self.manifest_validator.iter_errors(manifest)),
                )
                self.assertEqual(
                    [],
                    list(self.publication_validator.iter_errors(publication)),
                )
                self.assertEqual(
                    [],
                    manifest_contract.validate_product_contract(
                        manifest_path,
                        manifest,
                        self.publication_validator,
                    ),
                )
            finally:
                manifest_contract.ROOT = original_root

    def test_retirement_evidence_rejects_customer_specific_checkout_url(self) -> None:
        publication = copy.deepcopy(
            load_json("products/presentation-template-preflight/publication.json")
        )
        publication["status"] = "complete"
        publication["pending_channels"] = []
        publication["retired_channels"] = ["lemon-squeezy"]
        publication["retirement"] = {
            "channel": "lemon-squeezy",
            "reason": "owner-retired-channel",
            "seller_product_id": "1323100",
            "checkout_url": (
                "https://seller.lemonsqueezy.com/checkout/?cart=single-use"
            ),
            "retired_at": "2026-08-28T16:22:36Z",
            "checkout_inactive_verified_at": "2026-08-28T16:22:36Z",
        }
        self.assertTrue(list(self.publication_validator.iter_errors(publication)))


if __name__ == "__main__":
    unittest.main()
