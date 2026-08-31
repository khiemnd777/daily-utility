import { zipSync } from "fflate";

const encoder = new TextEncoder();

function xml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function xmpBytes(text) {
  return encoder.encode(text);
}

export function makeXmp({
  uuid = "B1A8770E-EB38-4EDB-AEED-164933D55796",
  name = "Fictional Soft Portrait",
  group = "Fictional Studio Set",
  presetType = "Normal",
  processVersion = "15.4",
  creatorTool = "Fictional Preset Exporter 1.0",
  profile = null,
  compatibility = {},
  settings = { Exposure2012: "+0.35", Contrast2012: "+8", Texture: "+4" },
  extraProperties = {},
  hasSettings = true,
} = {}) {
  const properties = {
    UUID: uuid,
    Name: name,
    Group: group,
    PresetType: presetType,
    ProcessVersion: processVersion,
    HasSettings: hasSettings ? "True" : "False",
    SupportsAmount: "True",
    SupportsColor: "True",
    SupportsMonochrome: "True",
    ...compatibility,
    ...(profile ? { CameraProfile: profile } : {}),
    ...settings,
    ...extraProperties,
  };
  const attributes = Object.entries(properties)
    .map(([key, value]) => `crs:${key}="${xml(value)}"`)
    .join("\n      ");
  return xmpBytes(`<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="${xml(creatorTool)}">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/"
      xmlns:xmp="http://ns.adobe.com/xap/1.0/"
      xmp:CreatorTool="${xml(creatorTool)}"
      ${attributes}/>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`);
}

export const cleanPreset = () => makeXmp();
export const distinctPreset = () => makeXmp({
  uuid: "5EEB994E-B6E5-44BF-85D8-85732987D6A4",
  name: "Fictional Crisp Landscape",
  settings: { Exposure2012: "-0.10", Contrast2012: "+14", Dehaze: "+6" },
});

export const MALFORMED_XMP = {
  "broken/unclosed.xmp": xmpBytes('<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF'),
  "broken/not-xmp.xmp": xmpBytes("plain text"),
  "broken/no-rdf.xmp": xmpBytes('<x:xmpmeta xmlns:x="adobe:ns:meta/"/>'),
  "broken/empty-settings.xmp": makeXmp({ settings: {}, hasSettings: false }),
};

export function zipFromMap(entries) {
  return zipSync(entries, { level: 6, mtime: new Date("2026-08-31T00:00:00Z") });
}

export function fileLike(name, bytes, overrides = {}) {
  return {
    name,
    size: bytes.byteLength,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    ...overrides,
  };
}
