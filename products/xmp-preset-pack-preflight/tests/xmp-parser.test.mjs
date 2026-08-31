import assert from "node:assert/strict";
import test from "node:test";

import { cleanPreset, makeXmp, xmpBytes } from "./fixtures.mjs";
import { parseXml, parseXmp } from "../src/xmp-parser.js";

test("extracts stable identity, support, profile, and setting facts", () => {
  const result = parseXmp(makeXmp({
    profile: "Fictional Camera Profile",
    compatibility: { SupportsMonochrome: "False", CameraModelRestriction: "Fictional Camera Z" },
    extraProperties: { FutureExporterSwitch: "Enabled" },
  }));

  assert.equal(result.name, "Fictional Soft Portrait");
  assert.equal(result.group, "Fictional Studio Set");
  assert.equal(result.processVersion, "15.4");
  assert.equal(result.creatorTool, "Fictional Preset Exporter 1.0");
  assert.equal(result.profileReference, "Fictional Camera Profile");
  assert.equal(result.compatibilityFlags.SupportsMonochrome, false);
  assert.ok(result.activeSettingNames.includes("Exposure2012"));
  assert.ok(result.cameraRawPropertyNames.includes("FutureExporterSwitch"));
  assert.ok(result.findings.some((item) => item.id === "camera-profile-reference"));
  assert.ok(result.findings.some((item) => item.id === "compatibility-restriction"));
  assert.ok(result.findings.some((item) => item.id === "unknown-camera-raw-property"));
});

test("reports malformed, absent, and empty preset payloads with stable blocker IDs", () => {
  assert.deepEqual(parseXmp(xmpBytes("plain text")).findings.map((item) => item.id), ["malformed-xml"]);

  const noRdf = parseXmp(xmpBytes('<x:xmpmeta xmlns:x="adobe:ns:meta/"/>'));
  assert.ok(noRdf.findings.some((item) => item.id === "missing-rdf-container"));

  const noCameraRaw = parseXmp(xmpBytes(`
    <x:xmpmeta xmlns:x="adobe:ns:meta/">
      <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
        <rdf:Description rdf:about=""/>
      </rdf:RDF>
    </x:xmpmeta>`));
  assert.ok(noCameraRaw.findings.some((item) => item.id === "missing-camera-raw-description"));

  const empty = parseXmp(makeXmp({ settings: {}, hasSettings: false }));
  assert.ok(empty.findings.some((item) => item.id === "empty-preset-payload"));
});

test("accepts UTF-16LE packets and decodes XML entities", () => {
  const text = new TextDecoder().decode(makeXmp({ name: "Light & Shade" }));
  const utf16 = new Uint8Array(2 + text.length * 2);
  utf16.set([0xff, 0xfe]);
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    utf16[2 + index * 2] = code & 0xff;
    utf16[3 + index * 2] = code >> 8;
  }
  assert.equal(parseXmp(utf16).name, "Light & Shade");
});

test("rejects declarations that can expand external entities", () => {
  assert.throws(
    () => parseXml('<!DOCTYPE x [<!ENTITY e SYSTEM "file:///tmp/nope">]><x/>'),
    /DOCTYPE declarations are not supported/,
  );
});

test("clean fixture has no blockers and a normalized payload", () => {
  const result = parseXmp(cleanPreset());
  assert.equal(result.findings.filter((item) => item.severity === "blocker").length, 0);
  assert.ok(result.normalizedPayload);
  assert.ok(result.namespaces.some((item) => item.includes("camera-raw-settings")));
});
