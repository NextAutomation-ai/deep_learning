import { extractFromPdf } from "./pdf";
import { extractFromDocx } from "./docx";
import { extractFromUrl } from "./url";
import { extractFromText } from "./text";
import { extractFromYoutube } from "./youtube";
import { extractFromEpub } from "./epub";

export type SourceType = "pdf" | "docx" | "url" | "text" | "txt" | "youtube" | "epub";

export async function extractText(
  sourceType: SourceType,
  input: Buffer | string
): Promise<{ text: string; metadata: Record<string, unknown> }> {
  switch (sourceType) {
    case "pdf":
      if (!(input instanceof Buffer)) throw new Error("PDF input must be a Buffer");
      return extractFromPdf(input);
    case "docx":
      if (!(input instanceof Buffer)) throw new Error("DOCX input must be a Buffer");
      return extractFromDocx(input);
    case "epub":
      if (!(input instanceof Buffer)) throw new Error("EPUB input must be a Buffer");
      return extractFromEpub(input);
    case "url":
      if (typeof input !== "string") throw new Error("URL input must be a string");
      return extractFromUrl(input);
    case "youtube":
      if (typeof input !== "string") throw new Error("YouTube input must be a string");
      return extractFromYoutube(input);
    case "text":
    case "txt":
      if (typeof input !== "string") throw new Error("Text input must be a string");
      return extractFromText(input);
    default:
      throw new Error(`Unsupported source type: ${sourceType}`);
  }
}
