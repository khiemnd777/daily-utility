import assert from "node:assert/strict";
import test from "node:test";

import { auditRelease, toCsv, toHtml } from "../src/core.js";
import { parseMidi } from "../src/midi-parser.js";
import { cleanFormat0, cleanFormat1, distinctPerformance } from "./fixtures.mjs";

test("bundle audit groups exact bytes, normalized performances, paths, and non-MIDI files", async () => {
  const exact = cleanFormat0("Exact");
  const samePerformanceA = cleanFormat0("Label A");
  const samePerformanceB = cleanFormat0("Label B");
  const caseUpper = cleanFormat0("Upper");
  const caseLower = distinctPerformance();
  const snapshots = [exact, samePerformanceA, samePerformanceB, caseUpper, caseLower].map((value) => Buffer.from(value));
  const audit = await auditRelease({
    releaseName: "fictional-midi-release.zip",
    entries: [
      { path: "exact/a.mid", bytes: exact },
      { path: "exact/b.mid", bytes: exact },
      { path: "performance/one.mid", bytes: samePerformanceA },
      { path: "performance/two.mid", bytes: samePerformanceB },
      { path: "Case/Clip.mid", bytes: caseUpper },
      { path: "case/clip.mid", bytes: caseLower },
      { path: "distinct/unique.mid", bytes: cleanFormat1() },
    ],
    nonMidiPaths: ["README.txt", "extras/nested.zip"],
  }, { parse: parseMidi, scanTimestamp: "2026-08-30T01:00:00.000Z" });

  assert.deepEqual(audit.exactDuplicateGroups, [["exact/a.mid", "exact/b.mid"]]);
  assert.ok(audit.performanceDuplicateGroups.some((group) => group.includes("performance/one.mid") && group.includes("performance/two.mid")));
  assert.deepEqual(audit.caseCollisionGroups, [["Case/Clip.mid", "case/clip.mid"]]);
  assert.equal(audit.summary.nonMidiFileCount, 2);
  assert.equal(audit.nonMidiFindings.find((item) => item.path === "extras/nested.zip").id, "nested-archive-not-opened");
  assert.equal(audit.nonMidiFindings.find((item) => item.path === "README.txt").id, "non-midi-release-file");
  assert.equal(audit.results.find((result) => result.path === "Case/Clip.mid").status, "blocked");
  assert.deepEqual([exact, samePerformanceA, samePerformanceB, caseUpper, caseLower].map((value) => Buffer.from(value)), snapshots);
});

test("CSV and self-contained HTML exports retain every required release fact safely", async () => {
  const audit = await auditRelease({
    releaseName: "<fictional & safe>.zip",
    entries: [{ path: "clips/<lead>.mid", bytes: cleanFormat0("Lead") }],
    nonMidiPaths: ["README & notes.txt"],
  }, { parse: parseMidi, scanTimestamp: "2026-08-30T01:00:00.000Z" });
  const csv = toCsv(audit);
  for (const expected of [
    "configured_limits", "sha256", "smf_format", "timing", "declared_tracks", "note_on_count",
    "duration_seconds", "check_id", "severity", "evidence", "clips/<lead>.mid", "non-midi-release-file",
  ]) assert.match(csv, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  const html = toHtml(audit);
  assert.match(html, /MIDI Pack Preflight report/);
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /script-src 'none'/);
  assert.match(html, /&lt;fictional &amp; safe&gt;/);
  assert.match(html, /clips\/&lt;lead&gt;\.mid/);
  assert.doesNotMatch(html, /<script/i);
});
