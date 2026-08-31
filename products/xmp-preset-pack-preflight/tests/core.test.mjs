import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import test from "node:test";

import { auditRelease, reportBaseName, toCsv, toHtml } from "../src/core.js";
import { parseXmp } from "../src/xmp-parser.js";
import { cleanPreset, distinctPreset, makeXmp } from "./fixtures.mjs";

test("audits clean XMP inventory deterministically", async () => {
  const audit = await auditRelease({
    releaseName: "fictional-clean.zip",
    entries: [
      { path: "Portrait/soft.xmp", bytes: cleanPreset() },
      { path: "Landscape/crisp.xmp", bytes: distinctPreset() },
    ],
    otherPaths: [],
  }, { parse: parseXmp, cryptoApi: webcrypto, scanTimestamp: "2026-08-31T05:00:00.000Z" });

  assert.equal(audit.summary.xmpFileCount, 2);
  assert.equal(audit.summary.blockerCount, 0);
  assert.equal(audit.results[0].hash.length, 64);
  assert.deepEqual(audit.results.map((item) => item.path), ["Landscape/crisp.xmp", "Portrait/soft.xmp"]);
});

test("labels duplicate identity, normalized settings, case collisions, and mixed facts", async () => {
  const exact = cleanPreset();
  const sameSettingsNewIdentity = makeXmp({ uuid: "SECOND-ID", name: "Second Label" });
  const sameIdentityNewSettings = makeXmp({ settings: { Exposure2012: "+1.00" }, processVersion: "14.0" });
  const audit = await auditRelease({
    releaseName: "fictional-collisions.zip",
    entries: [
      { path: "Looks/A.xmp", bytes: exact },
      { path: "Looks/exact-copy.xmp", bytes: exact },
      { path: "Looks/identity-change.xmp", bytes: sameSettingsNewIdentity },
      { path: "looks/a.XMP", bytes: sameIdentityNewSettings },
    ],
    otherPaths: ["__MACOSX/._A.xmp", "legacy/look.lrtemplate", "nested/source.zip", "README.txt"],
  }, { parse: parseXmp, cryptoApi: webcrypto, scanTimestamp: "2026-08-31T05:00:00.000Z" });

  const ids = new Set(audit.results.flatMap((result) => result.findings.map((item) => item.id)));
  assert.ok(ids.has("exact-duplicate"));
  assert.ok(ids.has("normalized-setting-match"));
  assert.ok(ids.has("repeated-identifier"));
  assert.ok(ids.has("duplicate-name-in-group"));
  assert.ok(ids.has("case-insensitive-path-collision"));
  assert.ok(ids.has("mixed-process-versions"));
  assert.ok(audit.otherFindings.some((item) => item.id === "hidden-os-artifact"));
  assert.ok(audit.otherFindings.some((item) => item.id === "legacy-lrtemplate-release-file"));
  assert.ok(audit.otherFindings.some((item) => item.id === "nested-archive-not-opened"));
  assert.ok(audit.summary.blockerCount >= 2);
});

test("CSV and self-contained HTML preserve evidence and escape hostile names", async () => {
  const audit = await auditRelease({
    releaseName: "<fictional>.zip",
    entries: [{ path: 'Looks/<script>alert("x")</script>.xmp', bytes: cleanPreset() }],
    otherPaths: ["README.txt"],
  }, { parse: parseXmp, cryptoApi: webcrypto, scanTimestamp: "2026-08-31T05:00:00.000Z" });
  const csv = toCsv(audit);
  const html = toHtml(audit);

  assert.match(csv, /normalized_settings_sha256/);
  assert.match(csv, /camera_profile_reference/);
  assert.match(html, /XMP Preset Pack Preflight report/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;alert/);
  assert.match(html, /connect-src 'none'/);
  assert.equal(reportBaseName("My Pack.zip"), "My-Pack-preflight-report");
});
