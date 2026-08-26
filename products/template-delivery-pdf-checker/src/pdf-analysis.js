function cancelledError() {
  const error = new Error("Analysis cancelled");
  error.name = "AnalysisCancelledError";
  error.code = "ANALYSIS_CANCELLED";
  return error;
}

export async function extractLinkAnnotations(pdfDocument, options = {}) {
  const {
    maxLinks = Number.POSITIVE_INFINITY,
    onProgress = () => {},
    shouldCancel = () => false,
    yieldControl = () => Promise.resolve(),
  } = options;
  const records = [];
  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    if (shouldCancel()) throw cancelledError();
    const page = await pdfDocument.getPage(pageNumber);
    const annotations = await page.getAnnotations({ intent: "display" });
    for (const annotation of annotations) {
      if (shouldCancel()) throw cancelledError();
      const target =
        annotation.url ||
        annotation.unsafeUrl ||
        "";
      const isLink = annotation.subtype === "Link" || Boolean(target) || Boolean(annotation.dest);
      if (!isLink) continue;
      if (records.length >= maxLinks) {
        const error = new Error(`PDF exceeds the ${maxLinks}-link safety limit.`);
        error.name = "AnalysisPolicyError";
        error.code = "TOO_MANY_LINKS";
        throw error;
      }
      records.push({
        id: annotation.id || `page-${pageNumber}-link-${records.length + 1}`,
        page: pageNumber,
        target,
        destination: annotation.dest || null,
        rect: Array.isArray(annotation.rect) ? annotation.rect : null,
      });
    }
    onProgress({
      page: pageNumber,
      pages: pdfDocument.numPages,
      links: records.length,
    });
    page.cleanup();
    await yieldControl();
  }
  return records;
}
