export async function extractLinkAnnotations(pdfDocument) {
  const records = [];
  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const annotations = await page.getAnnotations({ intent: "display" });
    for (const annotation of annotations) {
      const target =
        annotation.url ||
        annotation.unsafeUrl ||
        (typeof annotation.dest === "string" ? annotation.dest : "");
      const isLink = annotation.subtype === "Link" || Boolean(target);
      if (!isLink) continue;
      records.push({
        id: annotation.id || `page-${pageNumber}-link-${records.length + 1}`,
        page: pageNumber,
        target,
        rect: Array.isArray(annotation.rect) ? annotation.rect : null,
      });
    }
  }
  return records;
}
