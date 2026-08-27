#!/usr/bin/env python3
"""Validate the factory schema, state machine, and product manifests."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

try:
    from jsonschema import Draft202012Validator, FormatChecker
    from jsonschema.exceptions import SchemaError
except ImportError as exc:  # pragma: no cover - dependency check for local use
    raise SystemExit(
        "jsonschema is required; install it with "
        "`python3 -m pip install jsonschema==4.23.0`"
    ) from exc


ROOT = Path(__file__).resolve().parents[2]
SCHEMA_PATH = ROOT / "factory" / "schemas" / "product-manifest.schema.json"
STATE_MACHINE_PATH = ROOT / "factory" / "state-machine.json"
TEMPLATE_PATH = ROOT / "templates" / "product-manifest.json"
PUBLICATION_SCHEMA_PATH = ROOT / "factory" / "schemas" / "publication.schema.json"
PUBLICATION_TEMPLATE_PATH = ROOT / "templates" / "publication.json"
PROMOTION_CHANNELS_SCHEMA_PATH = (
    ROOT / "factory" / "schemas" / "promotion-channels.schema.json"
)
PROMOTION_LOG_SCHEMA_PATH = ROOT / "factory" / "schemas" / "promotion-log.schema.json"
PROMOTION_CHANNELS_PATH = ROOT / "factory" / "promotion" / "channels.json"

REQUIRED_HAPPY_PATH = [
    "READY_FOR_BUILD",
    "APPROVED_BUILD",
    "BUILDING",
    "READY_FOR_RELEASE",
    "APPROVED_RELEASE",
    "PUBLISHED",
]
RELEASE_STATES = {"READY_FOR_RELEASE", "APPROVED_RELEASE", "PUBLISHED"}


def load_json(path: Path) -> Any:
    try:
        with path.open(encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError as exc:
        raise ValueError(f"missing file: {path.relative_to(ROOT)}") from exc
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"invalid JSON in {path.relative_to(ROOT)}:{exc.lineno}:{exc.colno}: {exc.msg}"
        ) from exc


def validate_state_machine(machine: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    states = set(machine.get("states", {}))
    if machine.get("control_plane") != "codex":
        errors.append("state machine control_plane must be codex")
    if machine.get("state_ledger") != "github_issue":
        errors.append("state machine state_ledger must be github_issue")
    if machine.get("initial_state") != REQUIRED_HAPPY_PATH[0]:
        errors.append("state machine initial_state must be READY_FOR_BUILD")
    if machine.get("happy_path") != REQUIRED_HAPPY_PATH:
        errors.append("state machine happy_path does not match the required lifecycle")

    transitions = machine.get("transitions", [])
    edges = {(item.get("from"), item.get("event"), item.get("to")) for item in transitions}
    required_edges = {
        ("READY_FOR_BUILD", "/approve", "APPROVED_BUILD"),
        ("APPROVED_BUILD", "build_started", "BUILDING"),
        ("BUILDING", "required_checks_passed", "READY_FOR_RELEASE"),
        ("READY_FOR_RELEASE", "/approve", "APPROVED_RELEASE"),
        ("APPROVED_RELEASE", "release_completed", "PUBLISHED"),
        ("READY_FOR_BUILD", "/reject", "REJECTED"),
        ("READY_FOR_RELEASE", "/reject", "REJECTED"),
        ("READY_FOR_RELEASE", "/request-changes", "BUILDING"),
    }
    for edge in sorted(required_edges - edges):
        errors.append(f"missing transition: {edge[0]} --{edge[1]}--> {edge[2]}")

    for index, transition in enumerate(transitions):
        if transition.get("from") not in states:
            errors.append(f"transition {index} has unknown source state")
        if transition.get("to") not in states:
            errors.append(f"transition {index} has unknown destination state")
    return errors


def validate_product_contract(
    path: Path,
    manifest: dict[str, Any],
    publication_validator: Draft202012Validator,
) -> list[str]:
    """Validate repository rules that cannot be expressed cleanly in JSON Schema."""
    if path == TEMPLATE_PATH:
        return []

    errors: list[str] = []
    relative = path.relative_to(ROOT)
    product_id = manifest.get("product_id")
    expected_directory = path.parent.name
    if product_id != expected_directory:
        errors.append(
            f"{relative}: product_id must match directory name {expected_directory!r}"
        )
    if manifest.get("source_issue") is None:
        errors.append(f"{relative}: source_issue must reference the proposal issue")

    raw_artifacts = manifest.get("artifacts", [])
    artifacts = raw_artifacts if isinstance(raw_artifacts, list) else []
    expected_prefix = f"products/{product_id}/"
    if not artifacts:
        errors.append(f"{relative}: artifacts must list at least one product file")
    for artifact in artifacts:
        if not isinstance(artifact, str) or not artifact.startswith(expected_prefix):
            errors.append(
                f"{relative}: artifact {artifact!r} must start with {expected_prefix!r}"
            )

    raw_checks = manifest.get("acceptance_checks", [])
    checks = raw_checks if isinstance(raw_checks, list) else []
    check_ids = [
        item.get("id")
        for item in checks
        if isinstance(item, dict) and isinstance(item.get("id"), str)
    ]
    if len(check_ids) != len(set(check_ids)):
        errors.append(f"{relative}: acceptance check ids must be unique")

    if manifest.get("state") in RELEASE_STATES:
        for check in checks:
            if (
                isinstance(check, dict)
                and check.get("required")
                and check.get("status") != "passed"
            ):
                errors.append(
                    f"{relative}: required check {check.get('id')!r} must pass "
                    f"before {manifest.get('state')}"
                )
        for artifact in artifacts:
            if isinstance(artifact, str) and not (ROOT / artifact).is_file():
                errors.append(f"{relative}: release artifact does not exist: {artifact}")

    publication_path = path.parent / "publication.json"
    if manifest.get("state") == "PUBLISHED":
        publication_relative = publication_path.relative_to(ROOT).as_posix()
        if publication_relative not in artifacts:
            errors.append(
                f"{relative}: PUBLISHED manifest must list {publication_relative!r}"
            )
        try:
            publication = load_json(publication_path)
        except ValueError as exc:
            errors.append(str(exc))
        else:
            for error in sorted(
                publication_validator.iter_errors(publication),
                key=lambda item: list(item.path),
            ):
                location = ".".join(str(part) for part in error.absolute_path) or "<root>"
                errors.append(
                    f"{publication_relative}:{location}: {error.message}"
                )

            if isinstance(publication, dict):
                if publication.get("product_id") != product_id:
                    errors.append(
                        f"{publication_relative}: product_id must match the manifest"
                    )
                distribution = manifest.get("distribution")
                manifest_channel = (
                    distribution.get("channel")
                    if isinstance(distribution, dict)
                    else None
                )
                if publication.get("channel") != manifest_channel:
                    errors.append(
                        f"{publication_relative}: channel must match manifest distribution"
                    )
                if publication.get("price") != manifest.get("pricing"):
                    errors.append(
                        f"{publication_relative}: price must match manifest pricing"
                    )

                artifact = publication.get("artifact")
                if artifact not in artifacts:
                    errors.append(
                        f"{publication_relative}: artifact must be listed in the manifest"
                    )
                elif isinstance(artifact, str) and (ROOT / artifact).is_file():
                    digest = hashlib.sha256((ROOT / artifact).read_bytes()).hexdigest()
                    if digest != publication.get("artifact_sha256"):
                        errors.append(
                            f"{publication_relative}: artifact_sha256 does not match {artifact}"
                        )

                url = publication.get("url")
                if isinstance(url, str):
                    parsed = urlparse(url)
                    if parsed.path.rstrip("/") != f"/l/{product_id}":
                        errors.append(
                            f"{publication_relative}: URL slug must match product_id"
                        )
    elif publication_path.exists():
        errors.append(
            f"{relative}: publication.json requires manifest state PUBLISHED"
        )
    return errors


def validate_promotion_contract(
    registry: dict[str, Any],
    log_paths: list[Path],
    log_validator: Draft202012Validator,
) -> list[str]:
    """Validate relationships among the shared channel registry and product logs."""
    errors: list[str] = []
    raw_channels = registry.get("channels", [])
    channels = raw_channels if isinstance(raw_channels, list) else []
    channel_ids = [
        channel.get("id")
        for channel in channels
        if isinstance(channel, dict) and isinstance(channel.get("id"), str)
    ]
    if len(channel_ids) != len(set(channel_ids)):
        errors.append("factory/promotion/channels.json: channel ids must be unique")

    channel_urls = [
        channel.get("url")
        for channel in channels
        if isinstance(channel, dict) and isinstance(channel.get("url"), str)
    ]
    if len(channel_urls) != len(set(channel_urls)):
        errors.append("factory/promotion/channels.json: channel URLs must be unique")

    channels_by_id = {
        channel["id"]: channel
        for channel in channels
        if isinstance(channel, dict) and isinstance(channel.get("id"), str)
    }

    for log_path in log_paths:
        relative = log_path.relative_to(ROOT)
        try:
            log = load_json(log_path)
        except ValueError as exc:
            errors.append(str(exc))
            continue

        for error in sorted(
            log_validator.iter_errors(log), key=lambda item: list(item.path)
        ):
            location = ".".join(str(part) for part in error.absolute_path) or "<root>"
            errors.append(f"{relative}:{location}: {error.message}")

        if not isinstance(log, dict):
            continue

        product_directory = log_path.parent.parent.name
        product_id = log.get("product_id")
        if product_id != product_directory:
            errors.append(
                f"{relative}: product_id must match directory {product_directory!r}"
            )

        manifest_path = log_path.parent.parent / "product-manifest.json"
        try:
            manifest = load_json(manifest_path)
        except ValueError as exc:
            errors.append(str(exc))
        else:
            if isinstance(manifest, dict):
                if manifest.get("state") != "PUBLISHED":
                    errors.append(f"{relative}: promotion requires a PUBLISHED product")
                artifacts = manifest.get("artifacts", [])
                if relative.as_posix() not in artifacts:
                    errors.append(
                        f"{relative}: promotion log must be listed in the product manifest"
                    )

        publication_path = log_path.parent.parent / "publication.json"
        try:
            publication = load_json(publication_path)
        except ValueError as exc:
            errors.append(str(exc))
        else:
            if (
                isinstance(publication, dict)
                and log.get("product_url") != publication.get("url")
            ):
                errors.append(f"{relative}: product_url must match publication.json")

        raw_entries = log.get("entries", [])
        entries = raw_entries if isinstance(raw_entries, list) else []
        entry_channel_ids = [
            entry.get("channel_id")
            for entry in entries
            if isinstance(entry, dict) and isinstance(entry.get("channel_id"), str)
        ]
        if len(entry_channel_ids) != len(set(entry_channel_ids)):
            errors.append(f"{relative}: channel_id entries must be unique per product")

        for entry in entries:
            if not isinstance(entry, dict):
                continue
            channel_id = entry.get("channel_id")
            channel = channels_by_id.get(channel_id)
            if channel is None:
                errors.append(
                    f"{relative}: unknown promotion channel {channel_id!r}"
                )
                continue
            if entry.get("destination_url") != channel.get("url"):
                errors.append(
                    f"{relative}: destination_url must match registry channel {channel_id!r}"
                )

    return errors


def discover_manifests(arguments: list[str]) -> list[Path]:
    if arguments:
        return [Path(item).resolve() for item in arguments]
    manifests = [TEMPLATE_PATH]
    manifests.extend(sorted((ROOT / "products").glob("*/product-manifest.json")))
    return manifests


def main() -> int:
    failures: list[str] = []
    try:
        schema = load_json(SCHEMA_PATH)
        Draft202012Validator.check_schema(schema)
        publication_schema = load_json(PUBLICATION_SCHEMA_PATH)
        Draft202012Validator.check_schema(publication_schema)
        promotion_channels_schema = load_json(PROMOTION_CHANNELS_SCHEMA_PATH)
        Draft202012Validator.check_schema(promotion_channels_schema)
        promotion_log_schema = load_json(PROMOTION_LOG_SCHEMA_PATH)
        Draft202012Validator.check_schema(promotion_log_schema)
    except (ValueError, SchemaError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    try:
        machine = load_json(STATE_MACHINE_PATH)
        if isinstance(machine, dict):
            failures.extend(validate_state_machine(machine))
        else:
            failures.append("state machine root must be an object")
    except ValueError as exc:
        failures.append(str(exc))

    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    publication_validator = Draft202012Validator(
        publication_schema, format_checker=FormatChecker()
    )
    promotion_channels_validator = Draft202012Validator(
        promotion_channels_schema, format_checker=FormatChecker()
    )
    promotion_log_validator = Draft202012Validator(
        promotion_log_schema, format_checker=FormatChecker()
    )

    try:
        publication_template = load_json(PUBLICATION_TEMPLATE_PATH)
        for error in sorted(
            publication_validator.iter_errors(publication_template),
            key=lambda item: list(item.path),
        ):
            location = ".".join(str(part) for part in error.absolute_path) or "<root>"
            failures.append(
                f"{PUBLICATION_TEMPLATE_PATH.relative_to(ROOT)}:{location}: {error.message}"
            )
    except ValueError as exc:
        failures.append(str(exc))
    manifests = discover_manifests(sys.argv[1:])
    if not manifests:
        failures.append("no manifests found")

    for manifest_path in manifests:
        try:
            manifest = load_json(manifest_path)
        except ValueError as exc:
            failures.append(str(exc))
            continue
        for error in sorted(validator.iter_errors(manifest), key=lambda item: list(item.path)):
            location = ".".join(str(part) for part in error.absolute_path) or "<root>"
            failures.append(
                f"{manifest_path.relative_to(ROOT)}:{location}: {error.message}"
            )
        if isinstance(manifest, dict):
            failures.extend(
                validate_product_contract(
                    manifest_path, manifest, publication_validator
                )
            )

    try:
        promotion_channels = load_json(PROMOTION_CHANNELS_PATH)
    except ValueError as exc:
        failures.append(str(exc))
    else:
        for error in sorted(
            promotion_channels_validator.iter_errors(promotion_channels),
            key=lambda item: list(item.path),
        ):
            location = ".".join(str(part) for part in error.absolute_path) or "<root>"
            failures.append(
                f"{PROMOTION_CHANNELS_PATH.relative_to(ROOT)}:{location}: {error.message}"
            )
        if isinstance(promotion_channels, dict):
            promotion_logs = sorted(
                (ROOT / "products").glob("*/marketing/promotion-log.json")
            )
            failures.extend(
                validate_promotion_contract(
                    promotion_channels, promotion_logs, promotion_log_validator
                )
            )

    if failures:
        for failure in failures:
            print(f"ERROR: {failure}", file=sys.stderr)
        return 1

    relative = ", ".join(str(path.relative_to(ROOT)) for path in manifests)
    print(
        "Validated schema, state machine, manifests, and promotion records: "
        f"{relative}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
