#!/usr/bin/env python3
"""Static guards for the staged-release GitHub workflow contract."""

from __future__ import annotations

import json
import unittest
from pathlib import Path

from factory.scripts.validate_manifest import validate_state_machine


ROOT = Path(__file__).resolve().parents[2]


class GumroadFirstWorkflowTests(unittest.TestCase):
    def test_state_machine_contains_the_second_approval_checkpoint(self) -> None:
        machine = json.loads(
            (ROOT / "factory/state-machine.json").read_text(encoding="utf-8")
        )
        self.assertEqual([], validate_state_machine(machine))
        self.assertEqual(
            "remaining_channels",
            machine["states"]["READY_FOR_REMAINING_CHANNELS"][
                "approval_checkpoint"
            ],
        )

    def test_approval_gate_accepts_only_review_commands_for_remaining_channels(
        self,
    ) -> None:
        workflow = (ROOT / ".github/workflows/approval-gate.yml").read_text(
            encoding="utf-8"
        )
        self.assertIn("'state:ready-for-remaining-channels': {", workflow)
        self.assertIn("'/approve': 'state:approved-remaining-channels'", workflow)
        self.assertIn("'/request-changes': 'state:gumroad-published'", workflow)

    def test_staged_completion_cannot_skip_the_second_approval(self) -> None:
        workflow = (ROOT / ".github/workflows/release-completed.yml").read_text(
            encoding="utf-8"
        )
        self.assertIn("const stagedCompletion =", workflow)
        self.assertIn("publication.schema_version === 3", workflow)
        self.assertIn("'state:approved-remaining-channels'", workflow)
        self.assertIn("? new Set([", workflow)


if __name__ == "__main__":
    unittest.main()
