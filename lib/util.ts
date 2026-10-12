export const YT_REGEX =
  /^(?:https?:\/\/)?(?:www\.|music\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})(?:[?&][^\s]*)?$/;

export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // 1. Primary Regex Match
  const match = trimmed.match(YT_REGEX);
  if (match && match[1] && match[1].length === 11) {
    return match[1];
  }

  // 2. Comprehensive URL Parser Fallback
  try {
    const fullUrl = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(fullUrl);

    // youtu.be/ID
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace(/^\//, "").split("/")[0]?.split("?")[0];
      if (id && id.length === 11) return id;
    }

    // youtube.com/watch?v=ID
    const v = parsed.searchParams.get("v");
    if (v && v.length === 11) return v;

    // youtube.com/shorts/ID
    const paths = parsed.pathname.split("/").filter(Boolean);
    const shortsIdx = paths.indexOf("shorts");
    if (shortsIdx !== -1 && paths[shortsIdx + 1]?.length === 11) {
      return paths[shortsIdx + 1];
    }

    // youtube.com/embed/ID
    const embedIdx = paths.indexOf("embed");
    if (embedIdx !== -1 && paths[embedIdx + 1]?.length === 11) {
      return paths[embedIdx + 1];
    }
  } catch {}

  return null;
}
