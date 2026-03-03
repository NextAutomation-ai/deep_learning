export async function extractFromText(
  input: string
): Promise<{ text: string; metadata: Record<string, unknown> }> {
  return {
    text: input.trim(),
    metadata: {
      charCount: input.length,
    },
  };
}
