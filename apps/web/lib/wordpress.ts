const apiBase = process.env.WORDPRESS_API_URL;

export class WordPressConfigurationError extends Error {}

export function getWordPressApiBase(): string {
  if (!apiBase) {
    throw new WordPressConfigurationError("WORDPRESS_API_URL is not configured");
  }
  return apiBase.replace(/\/$/, "");
}

export async function fetchPublishedPosts(limit = 10) {
  const base = getWordPressApiBase();
  const response = await fetch(`${base}/wp-json/wp/v2/posts?status=publish&per_page=${limit}&_embed=1`, {
    next: { revalidate: 60 }
  });
  if (!response.ok) throw new Error(`WordPress read failed: ${response.status}`);
  return response.json();
}

export async function checkWordPressHealth() {
  if (!apiBase) return { status: "unconfigured" as const };
  try {
    const response = await fetch(`${getWordPressApiBase()}/wp-json/`, { cache: "no-store" });
    return { status: response.ok ? "ok" as const : "down" as const, httpStatus: response.status };
  } catch {
    return { status: "down" as const };
  }
}

// Deliberately no write/publish function in the public frontend.
