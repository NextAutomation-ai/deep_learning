import EPub from "epub2";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractFromEpub(
  input: Buffer
): Promise<{ text: string; metadata: Record<string, unknown> }> {
  // epub2 requires a file path, so write buffer to a temp file
  const tmpPath = path.join(os.tmpdir(), `deeplearn-${crypto.randomUUID()}.epub`);
  await writeFile(tmpPath, input);

  try {
    const epub = await EPub.createAsync(tmpPath);

    const chapterTexts: string[] = [];
    const chapterTitles: string[] = [];

    for (const chapter of epub.flow) {
      if (!chapter.id) continue;
      try {
        const html = await epub.getChapterAsync(chapter.id);
        const text = stripHtml(html);
        if (text.length > 50) {
          chapterTexts.push(text);
          chapterTitles.push(chapter.title || `Chapter ${chapterTexts.length}`);
        }
      } catch {
        // Skip chapters that fail to parse
      }
    }

    const text = chapterTexts.join("\n\n");

    if (!text.trim()) {
      throw new Error("Could not extract text from EPUB. The file may be image-based or DRM-protected.");
    }

    return {
      text,
      metadata: {
        title: epub.metadata?.title || "",
        creator: epub.metadata?.creator || "",
        chapters: chapterTitles,
        chapterCount: chapterTitles.length,
      },
    };
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}
