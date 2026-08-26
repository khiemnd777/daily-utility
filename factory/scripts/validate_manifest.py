#!/usr/bin/env python3
"""Validate the factory schema, state machine, and product manifests."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

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

REQUIRED_HAPPY_PATH = [
    "READY_FOR_BUILD",
    "APPROVED_BUILD",
    "BUILDING",
    "READY_FOR_RELEASE",
    "APPROVED_RELEASE",
    "PUBLISHED",
]


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
    }
    for edge in sorted(required_edges - edges):
        errors.append(f"missing transition: {edge[0]} --{edge[1]}--> {edge[2]}")

    for index, transition in enumerate(transitions):
        if transition.get("from") not in states:
            errors.append(f"transition {index} has unknown source state")
        if transition.get("to") not in states:
            errors.append(f"transition {index} has unknown destination state")
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
    except (ValueError, SchemaError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    try:
        machine = load_json(STATE_MACHINE_PATH)
        failures.extend(validate_state_machine(machine))
    except ValueError as exc:
        failures.append(str(exc))

    validator = Draft202012Validator(schema, format_checker=FormatChecker())
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

    if failures:
        for failure in failures:
            print(f"ERROR: {failure}", file=sys.stderr)
        return 1

    relative = ", ".join(str(path.relative_to(ROOT)) for path in manifests)
    print(f"Validated schema, state machine, and manifests: {relative}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
