// Import internal module directly to avoid pdf-parse loading a test PDF at startup
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

export async function extractFromPdf(
  buffer: Buffer
): Promise<{ text: string; metadata: Record<string, unknown> }> {
  const data = await pdfParse(buffer);

  return {
    text: data.text.trim(),
    metadata: { totalPages: data.numpages },
  };
}
