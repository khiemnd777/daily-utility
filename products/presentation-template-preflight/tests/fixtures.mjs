import { strToU8, zipSync } from "fflate";

const REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships";
const OFFICE_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const P_NS = "http://schemas.openxmlformats.org/presentationml/2006/main";
const A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main";
const R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

function contentTypes({ template = false, hidden = false } = {}) {
  const mainType = template
    ? "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml"
    : "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml";
  const extras = hidden
    ? `<Override PartName="/ppt/comments/comment1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.comments+xml"/>
       <Override PartName="/ppt/notesSlides/notesSlide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>
       <Override PartName="/ppt/vbaProject.bin" ContentType="application/vnd.ms-office.vbaProject"/>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="fntdata" ContentType="application/x-fontdata"/>
  <Default Extension="bin" ContentType="application/octet-stream"/>
  <Override PartName="/ppt/presentation.xml" ContentType="${mainType}"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  ${extras}
</Types>`;
}

function relationshipXml(items) {
  return `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="${REL_NS}">${items
    .map((item) => `<Relationship Id="${item.id}" Type="${item.type}" Target="${item.target}"${item.external ? ' TargetMode="External"' : ""}/>`)
    .join("")}</Relationships>`;
}

function baseParts({ template = false, font = "Aptos", hidden = false } = {}) {
  const slideAttributes = hidden ? ' show="0"' : "";
  const core = hidden
    ? `<?xml version="1.0" encoding="UTF-8"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator>Fictional Studio</dc:creator><cp:lastModifiedBy>Sample Designer</cp:lastModifiedBy></cp:coreProperties>`
    : `<?xml version="1.0" encoding="UTF-8"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"/>`;
  return {
    "[Content_Types].xml": contentTypes({ template, hidden }),
    "_rels/.rels": relationshipXml([
      { id: "rId1", type: `${OFFICE_REL}/officeDocument`, target: "ppt/presentation.xml" },
      { id: "rId2", type: `${OFFICE_REL}/metadata/core-properties`, target: "docProps/core.xml" },
    ]),
    "docProps/core.xml": core,
    "ppt/presentation.xml": `<?xml version="1.0" encoding="UTF-8"?><p:presentation xmlns:p="${P_NS}" xmlns:a="${A_NS}" xmlns:r="${R_NS}"><p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="screen16x9"/><p:embeddedFontLst><p:embeddedFont><p:font typeface="Aptos"/><p:regular r:id="rId2"/></p:embeddedFont></p:embeddedFontLst></p:presentation>`,
    "ppt/_rels/presentation.xml.rels": relationshipXml([
      { id: "rId1", type: `${OFFICE_REL}/slide`, target: "slides/slide1.xml" },
      { id: "rId2", type: `${OFFICE_REL}/font`, target: "fonts/font1.fntdata" },
    ]),
    "ppt/slides/slide1.xml": `<?xml version="1.0" encoding="UTF-8"?><p:sld xmlns:p="${P_NS}" xmlns:a="${A_NS}" xmlns:r="${R_NS}"${slideAttributes}><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:rPr><a:latin typeface="${font}"/></a:rPr><a:t>Sample title</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>`,
    "ppt/slides/_rels/slide1.xml.rels": relationshipXml([
      { id: "rId1", type: `${OFFICE_REL}/slideLayout`, target: "../slideLayouts/slideLayout1.xml" },
    ]),
    "ppt/slideLayouts/slideLayout1.xml": `<?xml version="1.0" encoding="UTF-8"?><p:sldLayout xmlns:p="${P_NS}" xmlns:a="${A_NS}" xmlns:r="${R_NS}"><p:cSld/></p:sldLayout>`,
    "ppt/slideLayouts/_rels/slideLayout1.xml.rels": relationshipXml([
      { id: "rId1", type: `${OFFICE_REL}/slideMaster`, target: "../slideMasters/slideMaster1.xml" },
    ]),
    "ppt/slideMasters/slideMaster1.xml": `<?xml version="1.0" encoding="UTF-8"?><p:sldMaster xmlns:p="${P_NS}" xmlns:a="${A_NS}" xmlns:r="${R_NS}"><p:cSld/></p:sldMaster>`,
    "ppt/slideMasters/_rels/slideMaster1.xml.rels": relationshipXml([
      { id: "rId1", type: `${OFFICE_REL}/theme`, target: "../theme/theme1.xml" },
    ]),
    "ppt/theme/theme1.xml": `<?xml version="1.0" encoding="UTF-8"?><a:theme xmlns:a="${A_NS}" name="Sample"><a:themeElements><a:fontScheme name="Sample"><a:majorFont><a:latin typeface="Aptos"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/></a:minorFont></a:fontScheme></a:themeElements></a:theme>`,
    "ppt/fonts/font1.fntdata": new Uint8Array([70, 79, 78, 84]),
  };
}

function zipParts(parts) {
  const encoded = {};
  for (const [path, value] of Object.entries(parts)) {
    encoded[path] = value instanceof Uint8Array ? value : strToU8(value);
  }
  return zipSync(encoded, { level: 9, mtime: new Date("2026-08-28T00:00:00Z") });
}

export function cleanPresentationFixture({ template = false } = {}) {
  return zipParts(baseParts({ template }));
}

export function relationshipRiskFixture() {
  const parts = baseParts();
  parts["ppt/slides/_rels/slide1.xml.rels"] = relationshipXml([
    { id: "rId1", type: `${OFFICE_REL}/slideLayout`, target: "../slideLayouts/slideLayout1.xml" },
    { id: "rId2", type: `${OFFICE_REL}/image`, target: "../media/missing.png" },
    { id: "rId3", type: `${OFFICE_REL}/video`, target: "file:///Users/sample/Desktop/launch.mp4", external: true },
    { id: "rId4", type: `${OFFICE_REL}/externalLink`, target: "file:///Users/sample/Desktop/forecast.xlsx", external: true },
    { id: "rId5", type: `${OFFICE_REL}/hyperlink`, target: "https://example.com/buyer-guide", external: true },
  ]);
  return zipParts(parts);
}

export function hiddenContentFixture() {
  const parts = baseParts({ font: "Custom Sans", hidden: true });
  parts["ppt/comments/comment1.xml"] = `<?xml version="1.0" encoding="UTF-8"?><p:cmLst xmlns:p="${P_NS}"><p:cm authorId="0" dt="2026-08-28T00:00:00Z" idx="1"><p:pos x="1" y="1"/><p:text>Sample comment</p:text></p:cm></p:cmLst>`;
  parts["ppt/notesSlides/notesSlide1.xml"] = `<?xml version="1.0" encoding="UTF-8"?><p:notes xmlns:p="${P_NS}" xmlns:a="${A_NS}"><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>Private speaker note</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:notes>`;
  parts["ppt/embeddings/object1.bin"] = new Uint8Array([79, 76, 69]);
  parts["ppt/vbaProject.bin"] = new Uint8Array([86, 66, 65]);
  parts["ppt/slides/_rels/slide1.xml.rels"] = relationshipXml([
    { id: "rId1", type: `${OFFICE_REL}/slideLayout`, target: "../slideLayouts/slideLayout1.xml" },
    { id: "rId2", type: `${OFFICE_REL}/comments`, target: "../comments/comment1.xml" },
    { id: "rId3", type: `${OFFICE_REL}/notesSlide`, target: "../notesSlides/notesSlide1.xml" },
    { id: "rId4", type: `${OFFICE_REL}/oleObject`, target: "../embeddings/object1.bin" },
  ]);
  return zipParts(parts);
}

export function malformedXmlFixture() {
  const parts = baseParts();
  parts["ppt/slides/slide1.xml"] = `<p:sld xmlns:p="${P_NS}"><p:cSld></p:sld>`;
  return zipParts(parts);
}

export function fakeFile(name, bytes, extra = {}) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return {
    name,
    size: extra.size ?? data.byteLength,
    type: extra.type || "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    async arrayBuffer() {
      return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    },
  };
}
