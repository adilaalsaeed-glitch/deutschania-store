// Client-safe utilities only (no prisma/Node imports) — this file gets imported by client
// components (e.g. the admin queue table). The prisma-backed query lives in
// lib/testimonials-data.ts, imported only from server components/routes.

export type Platform = "instagram" | "tiktok" | "other";

export type TestimonialItem = {
  id: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  platform: Platform;
  firstName: string;
  createdAt: Date;
};

export function detectPlatform(url: string): Platform {
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/tiktok\.com/i.test(url)) return "tiktok";
  return "other";
}

export const EMBED_SCRIPT_SRC: Record<"instagram" | "tiktok", string> = {
  instagram: "https://www.instagram.com/embed.js",
  tiktok: "https://www.tiktok.com/embed.js",
};

// TikTok's oEmbed endpoint is public and needs no auth, so we can auto-fetch a real thumbnail
// at approval time. Instagram's oEmbed has required a Meta app + access token since 2020 — no
// equivalent here; that thumbnail stays admin-provided (see the approve endpoint).
export async function fetchTikTokThumbnail(videoUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.thumbnail_url === "string" ? data.thumbnail_url : null;
  } catch {
    return null;
  }
}
