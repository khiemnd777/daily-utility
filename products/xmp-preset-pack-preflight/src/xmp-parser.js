const XML_NS = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NS = "http://www.w3.org/2000/xmlns/";
const XMP_META_NS = "adobe:ns:meta/";
const RDF_NS = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const CRS_NS = "http://ns.adobe.com/camera-raw-settings/1.0/";
const XMP_NS = "http://ns.adobe.com/xap/1.0/";

const IDENTITY_FIELDS = new Set([
  "UUID", "Name", "Group", "SortName", "Cluster", "Copyright", "ContactInfo",
]);

const METADATA_FIELDS = new Set([
  ...IDENTITY_FIELDS,
  "PresetType", "Version", "ProcessVersion", "HasSettings", "SupportsAmount",
  "SupportsColor", "SupportsMonochrome", "SupportsHighDynamicRange",
  "SupportsNormalDynamicRange", "SupportsSceneReferred", "SupportsOutputReferred",
  "RequiresRGBTables", "CameraModelRestriction",
]);

const KNOWN_SETTINGS = [
  /^(WhiteBalance|Temperature|Tint|IncrementalTemperature|IncrementalTint)$/,
  /^(Exposure|Contrast|Highlights|Shadows|Whites|Blacks|Clarity|Dehaze|Vibrance|Saturation)(2012)?$/,
  /^(Parametric|ToneCurve|HueAdjustment|SaturationAdjustment|LuminanceAdjustment)/,
  /^(ColorGrade|SplitToning|Grain|PostCropVignette|Sharpness|LuminanceSmoothing|ColorNoiseReduction)/,
  /^(LensProfile|LensManualDistortion|Perspective|Upright|AutoLateralCA|RemoveChromaticAberration)/,
  /^(CameraProfile|CameraCalibration|RedHue|RedSaturation|GreenHue|GreenSaturation|BlueHue|BlueSaturation)/,
  /^(ConvertToGrayscale|Treatment|Look|Retouch|Masking|LocalExposure|LocalContrast|LocalClarity)/,
  /^(Texture|Defringe|ShadowTint|ColorNoiseReduction|NoiseReduction|Enable)/,
];

function finding(id, severity, evidence) {
  return { id, severity, evidence };
}

function decodeBytes(bytes) {
  if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes || []);
  if (!bytes.length) throw new Error("The XMP file is empty.");
  let encoding = "utf-8";
  let offset = 0;
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    offset = 3;
  } else if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    encoding = "utf-16le";
    offset = 2;
  } else if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    encoding = "utf-16be";
    offset = 2;
  }
  return new TextDecoder(encoding, { fatal: true }).decode(bytes.subarray(offset));
}

function decodeEntities(value) {
  return value.replace(/&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos);/gi, (match, entity) => {
    if (entity === "amp") return "&";
    if (entity === "lt") return "<";
    if (entity === "gt") return ">";
    if (entity === "quot") return '"';
    if (entity === "apos") return "'";
    const radix = entity[1]?.toLowerCase() === "x" ? 16 : 10;
    const digits = radix === 16 ? entity.slice(2) : entity.slice(1);
    const point = Number.parseInt(digits, radix);
    if (!Number.isInteger(point) || point < 0 || point > 0x10ffff) throw new Error("Invalid numeric XML entity.");
    return String.fromCodePoint(point);
  }).replace(/&[a-z][a-z0-9._:-]*;/gi, () => {
    throw new Error("Unsupported XML entity.");
  });
}

function parseQualifiedName(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_.-]*(?::[A-Za-z_][A-Za-z0-9_.-]*)?$/.test(value)) {
    throw new Error("Invalid XML name: " + value.slice(0, 80));
  }
  const split = value.indexOf(":");
  return split === -1
    ? { prefix: "", localName: value }
    : { prefix: value.slice(0, split), localName: value.slice(split + 1) };
}

function parseStartTag(raw) {
  let cursor = 0;
  const skipSpace = () => {
    while (/\s/.test(raw[cursor] || "")) cursor += 1;
  };
  skipSpace();
  const nameMatch = raw.slice(cursor).match(/^[^\s/>]+/);
  if (!nameMatch) throw new Error("Missing XML element name.");
  const qName = nameMatch[0];
  parseQualifiedName(qName);
  cursor += qName.length;
  const attributes = [];
  while (cursor < raw.length) {
    skipSpace();
    if (cursor >= raw.length) break;
    const attrMatch = raw.slice(cursor).match(/^[^\s=/>]+/);
    if (!attrMatch) throw new Error("Invalid XML attribute.");
    const attrName = attrMatch[0];
    parseQualifiedName(attrName === "xmlns" ? "_xmlns" : attrName);
    cursor += attrName.length;
    skipSpace();
    if (raw[cursor] !== "=") throw new Error("XML attribute is missing '='.");
    cursor += 1;
    skipSpace();
    const quote = raw[cursor];
    if (quote !== '"' && quote !== "'") throw new Error("XML attribute value must be quoted.");
    cursor += 1;
    const end = raw.indexOf(quote, cursor);
    if (end === -1) throw new Error("Unterminated XML attribute value.");
    attributes.push({ qName: attrName, value: decodeEntities(raw.slice(cursor, end)) });
    cursor = end + 1;
  }
  const names = new Set();
  for (const attribute of attributes) {
    if (names.has(attribute.qName)) throw new Error("Duplicate XML attribute: " + attribute.qName);
    names.add(attribute.qName);
  }
  return { qName, attributes };
}

export function parseXml(text) {
  const source = String(text);
  const roots = [];
  const stack = [];
  let cursor = 0;
  const appendText = (value) => {
    if (!stack.length) {
      if (value.trim()) throw new Error("Text is not allowed outside the XML root element.");
      return;
    }
    stack[stack.length - 1].text += decodeEntities(value);
  };

  while (cursor < source.length) {
    const next = source.indexOf("<", cursor);
    if (next === -1) {
      appendText(source.slice(cursor));
      cursor = source.length;
      break;
    }
    appendText(source.slice(cursor, next));
    if (source.startsWith("<!--", next)) {
      const end = source.indexOf("-->", next + 4);
      if (end === -1) throw new Error("Unterminated XML comment.");
      cursor = end + 3;
      continue;
    }
    if (source.startsWith("<![CDATA[", next)) {
      const end = source.indexOf("]]>", next + 9);
      if (end === -1) throw new Error("Unterminated CDATA section.");
      if (!stack.length) throw new Error("CDATA is not allowed outside the XML root element.");
      stack[stack.length - 1].text += source.slice(next + 9, end);
      cursor = end + 3;
      continue;
    }
    if (source.startsWith("<?", next)) {
      const end = source.indexOf("?>", next + 2);
      if (end === -1) throw new Error("Unterminated XML processing instruction.");
      cursor = end + 2;
      continue;
    }
    if (/^<!doctype/i.test(source.slice(next, next + 10))) {
      throw new Error("DOCTYPE declarations are not supported in preset XMP.");
    }
    if (source.startsWith("<!", next)) throw new Error("Unsupported XML declaration.");

    const end = source.indexOf(">", next + 1);
    if (end === -1) throw new Error("Unterminated XML tag.");
    const raw = source.slice(next + 1, end);
    if (raw.startsWith("/")) {
      const qName = raw.slice(1).trim();
      parseQualifiedName(qName);
      const node = stack.pop();
      if (!node || node.qName !== qName) throw new Error("Mismatched XML closing tag: " + qName);
    } else {
      const selfClosing = /\/\s*$/.test(raw);
      const parsed = parseStartTag(selfClosing ? raw.replace(/\/\s*$/, "") : raw);
      const parent = stack[stack.length - 1] || null;
      const namespaces = new Map(parent?.namespaces || [["xml", XML_NS]]);
      for (const attribute of parsed.attributes) {
        if (attribute.qName === "xmlns") namespaces.set("", attribute.value);
        else if (attribute.qName.startsWith("xmlns:")) namespaces.set(attribute.qName.slice(6), attribute.value);
      }
      const name = parseQualifiedName(parsed.qName);
      const node = {
        qName: parsed.qName,
        prefix: name.prefix,
        localName: name.localName,
        namespaceURI: namespaces.get(name.prefix) || "",
        attributes: [],
        children: [],
        text: "",
        namespaces,
      };
      for (const attribute of parsed.attributes) {
        if (attribute.qName === "xmlns") {
          node.attributes.push({ ...attribute, prefix: "xmlns", localName: "xmlns", namespaceURI: XMLNS_NS });
          continue;
        }
        const attrName = parseQualifiedName(attribute.qName);
        node.attributes.push({
          ...attribute,
          prefix: attrName.prefix,
          localName: attrName.localName,
          namespaceURI: attrName.prefix === "xmlns"
            ? XMLNS_NS
            : attrName.prefix ? (namespaces.get(attrName.prefix) || "") : "",
        });
      }
      if (parent) parent.children.push(node);
      else roots.push(node);
      if (!selfClosing) stack.push(node);
    }
    cursor = end + 1;
  }
  if (stack.length) throw new Error("Unclosed XML element: " + stack[stack.length - 1].qName);
  if (roots.length !== 1) throw new Error("XMP must contain exactly one XML root element.");
  return roots[0];
}

function descendants(node) {
  const output = [node];
  for (const child of node.children) output.push(...descendants(child));
  return output;
}

function attributeValue(node, namespaceURI, localName) {
  return node.attributes.find((item) => item.namespaceURI === namespaceURI && item.localName === localName)?.value ?? null;
}

function elementValue(node) {
  const listItems = descendants(node).filter((item) => item.namespaceURI === RDF_NS && item.localName === "li");
  if (listItems.length) return listItems.map((item) => item.text.trim()).filter(Boolean).join(" | ");
  return [node.text, ...node.children.map(elementValue)].join(" ").replace(/\s+/g, " ").trim();
}

function cameraRawProperties(description) {
  const values = new Map();
  const add = (name, value) => {
    const trimmed = String(value ?? "").replace(/\s+/g, " ").trim();
    values.set(name, [...(values.get(name) || []), trimmed]);
  };
  for (const attribute of description.attributes) {
    if (attribute.namespaceURI === CRS_NS) add(attribute.localName, attribute.value);
  }
  for (const child of description.children) {
    if (child.namespaceURI === CRS_NS) add(child.localName, elementValue(child));
  }
  return values;
}

function firstValue(properties, name) {
  return properties.get(name)?.[0] ?? null;
}

function booleanValue(value) {
  if (value === null || value === "") return null;
  if (/^(true|1)$/i.test(value)) return true;
  if (/^(false|0)$/i.test(value)) return false;
  return value;
}

function knownProperty(name) {
  return METADATA_FIELDS.has(name) || KNOWN_SETTINGS.some((pattern) => pattern.test(name));
}

function normalizedPayload(properties) {
  return JSON.stringify(
    [...properties.entries()]
      .filter(([name]) => !METADATA_FIELDS.has(name))
      .map(([name, values]) => [name, [...values].map((value) => value.trim()).sort()])
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function namespaceInventory(root) {
  const values = new Map();
  for (const node of descendants(root)) {
    for (const attribute of node.attributes) {
      if (attribute.namespaceURI !== XMLNS_NS) continue;
      const prefix = attribute.qName === "xmlns" ? "(default)" : attribute.qName.slice(6);
      values.set(prefix, attribute.value);
    }
  }
  return [...values.entries()].sort(([left], [right]) => left.localeCompare(right))
    .map(([prefix, uri]) => prefix + "=" + uri);
}

function emptySnapshot(findings) {
  return {
    namespaces: [],
    name: null,
    group: null,
    uuid: null,
    presetType: null,
    processVersion: null,
    creatorTool: null,
    profileReference: null,
    compatibilityFlags: {},
    activeSettingNames: [],
    activeSettingCount: 0,
    cameraRawPropertyNames: [],
    normalizedPayload: null,
    findings,
  };
}

export function parseXmp(bytes) {
  let text;
  try {
    text = decodeBytes(bytes);
  } catch (error) {
    return emptySnapshot([finding("unreadable-preset-payload", "blocker", error.message)]);
  }

  let root;
  try {
    root = parseXml(text);
  } catch (error) {
    return emptySnapshot([finding("malformed-xml", "blocker", error.message)]);
  }

  const findings = [];
  const all = descendants(root);
  const xmpMeta = all.find((node) => node.namespaceURI === XMP_META_NS && node.localName === "xmpmeta");
  if (!xmpMeta) findings.push(finding("missing-xmp-container", "blocker", "No adobe:ns:meta/ xmpmeta container was found."));
  const rdf = all.find((node) => node.namespaceURI === RDF_NS && node.localName === "RDF");
  if (!rdf) {
    findings.push(finding("missing-rdf-container", "blocker", "No RDF container was found in the XMP packet."));
    return { ...emptySnapshot(findings), namespaces: namespaceInventory(root) };
  }

  const descriptions = all.filter((node) => node.namespaceURI === RDF_NS && node.localName === "Description");
  const cameraDescriptions = descriptions.filter((description) => {
    return description.attributes.some((item) => item.namespaceURI === CRS_NS)
      || description.children.some((item) => item.namespaceURI === CRS_NS);
  });
  if (!cameraDescriptions.length) {
    findings.push(finding("missing-camera-raw-description", "blocker", "No Camera Raw settings description was found."));
    return { ...emptySnapshot(findings), namespaces: namespaceInventory(root) };
  }
  if (cameraDescriptions.length > 1) {
    findings.push(finding("multiple-camera-raw-descriptions", "review", "Multiple Camera Raw descriptions were found; confirm the intended preset payload."));
  }

  const description = cameraDescriptions[0];
  const properties = cameraRawProperties(description);
  const propertyNames = [...properties.keys()].sort();
  const activeSettingNames = propertyNames.filter((name) => !METADATA_FIELDS.has(name));
  if (!activeSettingNames.length || /^(false|0)$/i.test(firstValue(properties, "HasSettings") || "")) {
    findings.push(finding("empty-preset-payload", "blocker", "No active Camera Raw develop settings were found."));
  }

  const name = firstValue(properties, "Name");
  const group = firstValue(properties, "Group");
  if (!name?.trim() || !group?.trim()) {
    findings.push(finding("blank-display-metadata", "review", "Preset name or group is blank or missing."));
  }
  const profileReference = firstValue(properties, "CameraProfile");
  if (profileReference) {
    findings.push(finding("camera-profile-reference", "review", "Camera profile reference: " + profileReference));
  }

  const compatibilityNames = [
    "SupportsAmount", "SupportsColor", "SupportsMonochrome", "SupportsHighDynamicRange",
    "SupportsNormalDynamicRange", "SupportsSceneReferred", "SupportsOutputReferred",
    "RequiresRGBTables", "CameraModelRestriction",
  ];
  const compatibilityFlags = Object.fromEntries(
    compatibilityNames.map((key) => [key, booleanValue(firstValue(properties, key))]),
  );
  const restrictive = Object.entries(compatibilityFlags).filter(([key, value]) => {
    if (key === "CameraModelRestriction") return Boolean(value);
    if (key === "RequiresRGBTables") return value === true;
    return value === false;
  });
  if (restrictive.length) {
    findings.push(finding(
      "compatibility-restriction",
      "review",
      restrictive.map(([key, value]) => key + "=" + value).join(", "),
    ));
  }

  const unknown = propertyNames.filter((name) => !knownProperty(name));
  if (unknown.length) {
    findings.push(finding(
      "unknown-camera-raw-property",
      "review",
      "Unrecognized Camera Raw properties are preserved as facts: " + unknown.join(", "),
    ));
  }

  const creatorTool = descriptions
    .map((node) => attributeValue(node, XMP_NS, "CreatorTool"))
    .find(Boolean) || null;
  findings.sort((left, right) => left.severity.localeCompare(right.severity) || left.id.localeCompare(right.id));
  return {
    namespaces: namespaceInventory(root),
    name,
    group,
    uuid: firstValue(properties, "UUID"),
    presetType: firstValue(properties, "PresetType"),
    processVersion: firstValue(properties, "ProcessVersion"),
    creatorTool,
    profileReference,
    compatibilityFlags,
    activeSettingNames,
    activeSettingCount: activeSettingNames.length,
    cameraRawPropertyNames: propertyNames,
    normalizedPayload: activeSettingNames.length ? normalizedPayload(properties) : null,
    findings,
  };
}
