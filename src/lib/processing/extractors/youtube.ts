import { YoutubeTranscript } from "youtube-transcript";

const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function isYoutubeUrl(url: string): boolean {
  return YOUTUBE_REGEX.test(url);
}

export function extractVideoId(url: string): string | null {
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

export async function extractFromYoutube(
  url: string
): Promise<{ text: string; metadata: Record<string, unknown> }> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  const transcript = await YoutubeTranscript.fetchTranscript(videoId);

  if (!transcript || transcript.length === 0) {
    throw new Error(
      "No transcript available for this video. The video may not have captions."
    );
  }

  const text = transcript.map((entry) => entry.text).join(" ");

  return {
    text,
    metadata: {
      videoId,
      url,
      source: "youtube",
      segments: transcript.length,
      durationEstimate: transcript[transcript.length - 1]?.offset ?? 0,
    },
  };
}
