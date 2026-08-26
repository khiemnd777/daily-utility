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

    if failures:
        for failure in failures:
            print(f"ERROR: {failure}", file=sys.stderr)
        return 1

    relative = ", ".join(str(path.relative_to(ROOT)) for path in manifests)
    print(f"Validated schema, state machine, and manifests: {relative}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
