import assert from "node:assert/strict";
import test from "node:test";

import { parseMidi } from "../src/midi-parser.js";
import { cleanFormat0, cleanFormat1, MALFORMED_MIDI, REVIEWABLE_MIDI } from "./fixtures.mjs";

function ids(snapshot, severity = null) {
  return new Set(snapshot.findings.filter((item) => !severity || item.severity === severity).map((item) => item.id));
}

test("valid format 0 with running status reports complete deterministic facts", () => {
  const result = parseMidi(cleanFormat0());
  assert.equal(result.format, 0);
  assert.deepEqual(result.timing, { mode: "ppq", ticksPerQuarter: 480 });
  assert.equal(result.declaredTrackCount, 1);
  assert.equal(result.parsedTrackCount, 1);
  assert.deepEqual(result.trackNames, ["Lead A"]);
  assert.deepEqual(result.channels, [1]);
  assert.equal(result.noteOnCount, 2);
  assert.equal(result.pitchMin, 60);
  assert.equal(result.pitchMax, 64);
  assert.equal(result.velocityMin, 90);
  assert.equal(result.velocityMax, 100);
  assert.equal(result.tickLength, 480);
  assert.equal(result.durationSeconds, 0.5);
  assert.equal(result.tempos[0].bpm, 120);
  assert.deepEqual(result.keySignatures, [{ tick: 0, value: "0:0" }]);
  assert.deepEqual(result.timeSignatures, [{ tick: 0, value: "4/4:24:8" }]);
  assert.deepEqual([...ids(result, "blocker")], []);
  assert.deepEqual([...ids(result, "review")], []);
});

test("valid format 1 reports conductor and performance tracks", () => {
  const result = parseMidi(cleanFormat1());
  assert.equal(result.format, 1);
  assert.equal(result.parsedTrackCount, 2);
  assert.deepEqual(result.trackNames, ["Conductor", "Bass"]);
  assert.deepEqual(result.channels, [2]);
  assert.equal(result.noteOnCount, 1);
  assert.equal(result.pitchMin, 36);
  assert.equal(result.pitchMax, 36);
  assert.equal(result.tickLength, 960);
  assert.equal(result.durationSeconds, 1);
  assert.deepEqual([...ids(result, "blocker")], []);
});

test("malformed corpus emits stable structural check IDs without throwing", () => {
  const expected = {
    "bad/invalid-header.mid": "invalid-header-id",
    "bad/header-length.mid": "invalid-header-length",
    "bad/invalid-format.mid": "invalid-format",
    "bad/format-zero-tracks.mid": "format-zero-track-count",
    "bad/track-mismatch.mid": "track-count-mismatch",
    "bad/truncated-track.mid": "truncated-track-chunk",
    "bad/overlong-vlq.mid": "overlong-variable-length",
    "bad/running-status.mid": "illegal-running-status",
    "bad/data-byte.mid": "invalid-data-byte",
    "bad/meta-event.mid": "truncated-meta-event",
    "bad/system-event.mid": "truncated-system-event",
    "bad/missing-eot.mid": "missing-end-of-track",
  };
  for (const [path, bytes] of Object.entries(MALFORMED_MIDI)) {
    const result = parseMidi(bytes);
    assert.ok(ids(result, "blocker").has(expected[path]), `${path} should report ${expected[path]}`);
  }
});

test("valid but less-portable corpus emits review findings, not compatibility blockers", () => {
  const expected = {
    "review/no-notes.mid": "no-note-events",
    "review/unmatched.mid": "unmatched-note-on",
    "review/format-two.mid": "format-two",
    "review/smpte.mid": "smpte-timing",
    "review/sysex.mid": "system-exclusive-events",
    "review/conflicting.mid": "conflicting-tempo",
    "review/non-ascii.mid": "non-ascii-text",
  };
  for (const [path, bytes] of Object.entries(REVIEWABLE_MIDI)) {
    const result = parseMidi(bytes);
    assert.ok(ids(result, "review").has(expected[path]), `${path} should report ${expected[path]}`);
    assert.deepEqual([...ids(result, "blocker")], [], `${path} should remain structurally valid`);
  }
  const conflicting = parseMidi(REVIEWABLE_MIDI["review/conflicting.mid"]);
  assert.ok(ids(conflicting).has("conflicting-key-signature"));
  assert.ok(ids(conflicting).has("conflicting-time-signature"));
});
