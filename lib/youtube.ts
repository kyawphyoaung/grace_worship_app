/** Extract a YouTube video id from common URL shapes. */
export function youtubeVideoId(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const raw = url.trim();
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (u.pathname === "/watch") {
        const v = u.searchParams.get("v");
        return v || null;
      }
      const parts = u.pathname.split("/").filter(Boolean);
      if (
        (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") &&
        parts[1]
      ) {
        return parts[1];
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function youtubeEmbedUrl(url: string | null | undefined): string | null {
  const id = youtubeVideoId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?playsinline=1&rel=0`;
}
