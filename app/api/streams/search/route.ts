import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.YOUTUBE_API_KEY;

// Helper to decode common HTML entities returned by YouTube API (e.g. &amp;, &#39;, &quot;)
function decodeHtmlEntities(text: string): string {
  if (!text) return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    if (!API_KEY) {
      return NextResponse.json(
        { error: "YouTube API key not configured on server" },
        { status: 500 }
      );
    }

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=6&q=${encodeURIComponent(
      query.trim()
    )}&key=${API_KEY}`;

    const res = await fetch(searchUrl);
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[YouTube Search] API error:", res.status, errorText);
      return NextResponse.json(
        { error: "Failed to search YouTube", details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    const items = data.items || [];

    const results = items
      .filter((item: any) => item.id?.videoId)
      .map((item: any) => {
        const videoId = item.id.videoId;
        const snippet = item.snippet || {};
        const thumbnail =
          snippet.thumbnails?.medium?.url ||
          snippet.thumbnails?.default?.url ||
          `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

        return {
          id: videoId,
          title: decodeHtmlEntities(snippet.title || "Untitled Video"),
          channelTitle: decodeHtmlEntities(snippet.channelTitle || ""),
          thumbnail,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        };
      });

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("[YouTube Search] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error while searching" },
      { status: 500 }
    );
  }
}
