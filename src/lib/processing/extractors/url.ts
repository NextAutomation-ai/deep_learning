import * as cheerio from "cheerio";

export async function extractFromUrl(
  url: string
): Promise<{ text: string; metadata: Record<string, unknown> }> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; DeepLearn/1.0; +http://localhost:3000)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove non-content elements
  $(
    "script, style, nav, footer, header, aside, .ad, .sidebar, .menu, .nav, .cookie-banner, noscript, iframe"
  ).remove();

  // Try to extract main content in order of specificity
  const mainContent =
    $("article").text() ||
    $("main").text() ||
    $('[role="main"]').text() ||
    $(".content, .post-content, .article-content, .entry-content")
      .first()
      .text() ||
    $("body").text();

  // Clean up whitespace
  const text = mainContent.replace(/\s+/g, " ").trim();

  return {
    text,
    metadata: {
      title: $("title").text().trim(),
      description: $('meta[name="description"]').attr("content") || "",
      url,
    },
  };
}
