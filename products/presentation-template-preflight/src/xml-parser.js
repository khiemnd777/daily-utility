import { SaxesParser } from "saxes";

function normalizedAttribute(attribute) {
  return {
    name: String(attribute.name || "").toLowerCase(),
    localName: String(attribute.local || attribute.name || "")
      .split(":")
      .pop()
      .toLowerCase(),
    value: String(attribute.value || ""),
  };
}

export function parseXmlSource(source) {
  const errors = [];
  const elements = [];
  const openIndexes = [];
  const parser = new SaxesParser({ xmlns: true, fragment: false });

  parser.on("opentag", (node) => {
    const element = {
      name: String(node.local || node.name || "").split(":").pop().toLowerCase(),
      qualifiedName: String(node.name || "").toLowerCase(),
      attributes: Object.values(node.attributes || {}).map(normalizedAttribute),
      parentIndex: openIndexes.at(-1) ?? null,
      text: "",
    };
    elements.push(element);
    openIndexes.push(elements.length - 1);
  });
  parser.on("text", (value) => {
    const current = elements[openIndexes.at(-1)];
    if (current) current.text += value;
  });
  parser.on("cdata", (value) => {
    const current = elements[openIndexes.at(-1)];
    if (current) current.text += value;
  });
  parser.on("closetag", () => openIndexes.pop());
  parser.on("error", (error) => {
    errors.push(error instanceof Error ? error.message : String(error));
  });

  try {
    parser.write(String(source)).close();
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  return {
    valid: errors.length === 0,
    parseErrors: [...new Set(errors)],
    elements,
    root: elements[0] || null,
  };
}

export function attribute(element, name) {
  const wanted = String(name).toLowerCase();
  return element?.attributes?.find(
    (item) => item.name === wanted || item.localName === wanted,
  )?.value;
}

export function exactAttribute(element, name) {
  const wanted = String(name).toLowerCase();
  return element?.attributes?.find((item) => item.name === wanted)?.value;
}

export function hasAncestor(snapshot, element, name) {
  const wanted = String(name).toLowerCase();
  let parentIndex = element?.parentIndex;
  while (parentIndex !== null && parentIndex !== undefined) {
    const parent = snapshot.elements[parentIndex];
    if (parent?.name === wanted) return true;
    parentIndex = parent?.parentIndex;
  }
  return false;
}
