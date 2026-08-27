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

export function parseSvgSource(source) {
  const errors = [];
  const elements = [];
  const openElements = [];
  const parser = new SaxesParser({ xmlns: true, fragment: false });

  parser.on("opentag", (node) => {
    const element = {
      name: String(node.local || node.name || "").split(":").pop().toLowerCase(),
      attributes: Object.values(node.attributes || {}).map(normalizedAttribute),
      text: "",
    };
    elements.push(element);
    openElements.push(element);
  });
  parser.on("text", (value) => {
    const current = openElements.at(-1);
    if (current && ["script", "style"].includes(current.name)) current.text += value;
  });
  parser.on("cdata", (value) => {
    const current = openElements.at(-1);
    if (current && ["script", "style"].includes(current.name)) current.text += value;
  });
  parser.on("closetag", () => openElements.pop());
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
    root: elements[0] || null,
    elements,
  };
}
