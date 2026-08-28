#!/usr/bin/env python3
"""Static guards for the Gumroad-only lifecycle and legacy migration."""

from __future__ import annotations

import json
import unittest
from pathlib import Path

from factory.scripts.validate_manifest import validate_state_machine


ROOT = Path(__file__).resolve().parents[2]


class GumroadOnlyWorkflowTests(unittest.TestCase):
    def test_state_machine_uses_single_release_path(self) -> None:
        machine = json.loads(
            (ROOT / "factory/state-machine.json").read_text(encoding="utf-8")
        )
        self.assertEqual([], validate_state_machine(machine))
        self.assertEqual(4, machine["version"])
        self.assertEqual(
            [
                "READY_FOR_BUILD",
                "APPROVED_BUILD",
                "BUILDING",
                "READY_FOR_RELEASE",
                "APPROVED_RELEASE",
                "PUBLISHED",
            ],
            machine["happy_path"],
        )
        for state in (
            "GUMROAD_PUBLISHED",
            "READY_FOR_REMAINING_CHANNELS",
            "APPROVED_REMAINING_CHANNELS",
        ):
            self.assertTrue(machine["states"][state]["deprecated"])

    def test_legacy_states_have_safe_cancellation_transitions(self) -> None:
        machine = json.loads(
            (ROOT / "factory/state-machine.json").read_text(encoding="utf-8")
        )
        edges = {
            (transition["from"], transition["event"], transition["to"])
            for transition in machine["transitions"]
        }
        for state in (
            "GUMROAD_PUBLISHED",
            "READY_FOR_REMAINING_CHANNELS",
            "APPROVED_REMAINING_CHANNELS",
        ):
            self.assertIn(
                (state, "remaining_channels_cancelled", "PUBLISHED"),
                edges,
            )
        self.assertNotIn(
            (
                "APPROVED_RELEASE",
                "gumroad_release_completed",
                "GUMROAD_PUBLISHED",
            ),
            edges,
        )
        self.assertNotIn(
            (
                "GUMROAD_PUBLISHED",
                "remaining_channels_ready",
                "READY_FOR_REMAINING_CHANNELS",
            ),
            edges,
        )
        self.assertNotIn(
            (
                "READY_FOR_REMAINING_CHANNELS",
                "/approve",
                "APPROVED_REMAINING_CHANNELS",
            ),
            edges,
        )
        self.assertNotIn(
            (
                "APPROVED_REMAINING_CHANNELS",
                "release_completed",
                "PUBLISHED",
            ),
            edges,
        )

    def test_release_workflow_records_channel_retirement(self) -> None:
        workflow = (ROOT / ".github/workflows/release-completed.yml").read_text(
            encoding="utf-8"
        )
        self.assertIn("cancelledRemainingChannels", workflow)
        self.assertIn("remaining_channels_cancelled", workflow)
        self.assertIn("publication.retired_channels", workflow)
        self.assertIn("publication.retirement.checkout_inactive_verified_at", workflow)
        self.assertIn("stagedCompletion && !cancelledRemainingChannels", workflow)

    def test_approval_gate_cannot_authorize_a_deprecated_channel(self) -> None:
        workflow = (ROOT / ".github/workflows/approval-gate.yml").read_text(
            encoding="utf-8"
        )
        self.assertIn("'state:ready-for-remaining-channels': {", workflow)
        self.assertNotIn(
            "'/approve': 'state:approved-remaining-channels'",
            workflow,
        )

    def test_new_proposals_name_only_gumroad_and_kna(self) -> None:
        proposal = (ROOT / "templates/proposal-issue.md").read_text(
            encoding="utf-8"
        )
        self.assertIn("Sales channel: `Gumroad`", proposal)
        self.assertNotIn("Lemon Squeezy", proposal)


if __name__ == "__main__":
    unittest.main()
