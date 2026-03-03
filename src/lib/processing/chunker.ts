export interface ChunkOptions {
  maxChunkSize: number; // characters
  overlapSize: number; // characters of overlap between chunks
  separator: string; // preferred split point
}

const DEFAULT_OPTIONS: ChunkOptions = {
  maxChunkSize: 4000,
  overlapSize: 300,
  separator: "\n\n",
};

export function chunkText(
  text: string,
  options: Partial<ChunkOptions> = {}
): string[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chunks: string[] = [];

  if (text.length <= opts.maxChunkSize) {
    return [text.trim()];
  }

  // Split by preferred separator (paragraphs)
  const paragraphs = text.split(opts.separator).filter((p) => p.trim());
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed max size and we already have content
    if (
      currentChunk.length + paragraph.length + opts.separator.length >
        opts.maxChunkSize &&
      currentChunk.length > 0
    ) {
      chunks.push(currentChunk.trim());

      // Start new chunk with overlap from end of previous
      const overlapStart = Math.max(
        0,
        currentChunk.length - opts.overlapSize
      );
      const overlap = currentChunk.slice(overlapStart);
      currentChunk = overlap + opts.separator + paragraph;
    } else {
      currentChunk += (currentChunk ? opts.separator : "") + paragraph;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // Handle case where a single paragraph exceeds max size
  return chunks.flatMap((chunk) => {
    if (chunk.length <= opts.maxChunkSize) return [chunk];
    // Force-split long chunks by sentences
    return splitBySentences(chunk, opts.maxChunkSize, opts.overlapSize);
  });
}

function splitBySentences(
  text: string,
  maxSize: number,
  overlapSize: number
): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (current.length + sentence.length > maxSize && current.length > 0) {
      chunks.push(current.trim());
      const overlapStart = Math.max(0, current.length - overlapSize);
      current = current.slice(overlapStart) + sentence;
    } else {
      current += sentence;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

/** Rough token estimation: ~4 chars per token for English */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
