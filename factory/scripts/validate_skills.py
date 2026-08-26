#!/usr/bin/env python3
"""Validate repository-scoped Codex skill entrypoints."""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SKILLS_DIR = ROOT / ".agents" / "skills"
NAME_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
PLACEHOLDERS = ("TODO", "REPLACE_ME", "replace-me")


def parse_frontmatter(path: Path) -> tuple[dict[str, str], str]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines or lines[0] != "---":
        raise ValueError("must begin with YAML frontmatter")

    try:
        closing = lines.index("---", 1)
    except ValueError as exc:
        raise ValueError("frontmatter is not closed") from exc

    metadata: dict[str, str] = {}
    for line in lines[1:closing]:
        if not line.strip():
            continue
        if ":" not in line:
            raise ValueError(f"invalid frontmatter line: {line!r}")
        key, value = line.split(":", 1)
        metadata[key.strip()] = value.strip().strip('"\'')

    return metadata, "\n".join(lines[closing + 1 :]).strip()


def validate_skill(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        metadata, body = parse_frontmatter(path)
    except ValueError as exc:
        return [f"{path.relative_to(ROOT)}: {exc}"]

    name = metadata.get("name", "")
    description = metadata.get("description", "")
    expected_name = path.parent.name

    if name != expected_name:
        errors.append(f"name {name!r} must match directory {expected_name!r}")
    if not NAME_PATTERN.fullmatch(name):
        errors.append(f"invalid lowercase kebab-case name {name!r}")
    if len(description) < 30:
        errors.append("description must be at least 30 characters and describe its trigger")
    if not body:
        errors.append("instruction body is empty")
    if any(placeholder in path.read_text(encoding="utf-8") for placeholder in PLACEHOLDERS):
        errors.append("contains unfinished scaffold placeholder text")

    return [f"{path.relative_to(ROOT)}: {error}" for error in errors]


def main() -> int:
    skill_files = sorted(SKILLS_DIR.glob("*/SKILL.md"))
    if not skill_files:
        print("No repository skills found under .agents/skills", flush=True)
        return 1

    errors = [error for path in skill_files for error in validate_skill(path)]
    if errors:
        print("Skill validation failed:", flush=True)
        for error in errors:
            print(f"- {error}", flush=True)
        return 1

    names = ", ".join(path.parent.name for path in skill_files)
    print(f"Validated repository skills: {names}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
