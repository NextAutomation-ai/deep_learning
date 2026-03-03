import path from "path";

export async function extractFromPdf(
  buffer: Buffer
): Promise<{ text: string; metadata: Record<string, unknown> }> {
  // Use pdfjs-dist legacy build directly (works in Node.js without DOM)
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Set worker source to the actual file path
  const workerPath = path.join(
    process.cwd(),
    "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"
  );
  pdfjsLib.GlobalWorkerOptions.workerSrc = `file://${workerPath}`;

  const uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const doc = await pdfjsLib.getDocument({ data: uint8 }).promise;

  let fullText = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    fullText += pageText + "\n";
  }

  return {
    text: fullText.trim(),
    metadata: { totalPages: doc.numPages },
  };
}
