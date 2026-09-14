import type { RawItem } from "./types.js";

const MAX_HTML_BYTES = 2_500_000;
const MAX_CONTENT_CHARS = 40_000;

function decodeEntities(value: string) {
  const named: Record<string, string> = {
    amp: "&", apos: "'", quot: '"', lt: "<", gt: ">", nbsp: " ",
    ndash: "–", mdash: "—", hellip: "…", rsquo: "’", lsquo: "‘",
    rdquo: "”", ldquo: "“",
  };
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_match, entity: string) => {
    if (entity[0] === "#") {
      const hexadecimal = entity[1]?.toLowerCase() === "x";
      const code = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : " ";
    }
    return named[entity.toLowerCase()] ?? " ";
  });
}

function cleanText(value: string) {
  return decodeEntities(
    value
      .replace(/<(script|style|noscript|svg|nav|footer|form)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|section|article|h[1-6]|li|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function meta(html: string, names: string[]) {
  for (const name of names) {
    const escaped = name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const first = new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i").exec(html)?.[1];
    const reversed = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${escaped}["'][^>]*>`, "i").exec(html)?.[1];
    const found = first ?? reversed;
    if (found) return cleanText(found);
  }
  return "";
}

function jsonLdObjects(html: string): Record<string, unknown>[] {
  const objects: Record<string, unknown>[] = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1]);
      const values = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.["@graph"]) ? parsed["@graph"] : [parsed];
      for (const value of values) if (value && typeof value === "object") objects.push(value);
    } catch {
      // Invalid publisher JSON-LD must not abort ingestion.
    }
  }
  return objects;
}

function strings(value: unknown): string[] {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  return values.flatMap((entry) => {
    if (typeof entry === "string") return [entry];
    if (entry && typeof entry === "object") {
      const name = (entry as Record<string, unknown>).name;
      return typeof name === "string" ? [name] : [];
    }
    return [];
  }).map(cleanText).filter(Boolean);
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function mainHtml(html: string) {
  return /<article\b[^>]*>([\s\S]*?)<\/article>/i.exec(html)?.[1]
    ?? /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1]
    ?? /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(html)?.[1]
    ?? html;
}

function labelledValues(content: string, labels: string[]) {
  const results: string[] = [];
  for (const line of content.split("\n")) {
    for (const label of labels) {
      const pattern = new RegExp(`^${label}\\s*:?\\s*(.+)$`, "i");
      const value = pattern.exec(line.trim())?.[1];
      if (value) results.push(value.trim());
    }
  }
  return results;
}

export async function enrichArticle(raw: RawItem): Promise<RawItem> {
  try {
    const response = await fetch(raw.url, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "Periodismo360-Newsroom/1.1 (+https://periodismo360.com)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`article fetch failed: ${response.status}`);
    const type = response.headers.get("content-type") ?? "";
    if (!type.includes("text/html") && !type.includes("application/xhtml+xml")) {
      throw new Error(`unsupported article content type: ${type}`);
    }
    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > MAX_HTML_BYTES) throw new Error("article response too large");
    const html = await response.text();
    if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) throw new Error("article response too large");

    const structured = jsonLdObjects(html);
    const article = structured.find((value) => {
      const typeValue = value["@type"];
      const types = Array.isArray(typeValue) ? typeValue : [typeValue];
      return types.some((entry) => typeof entry === "string" && /Article|NewsArticle|ReportageNewsArticle/i.test(entry));
    });

    const extractedContent = cleanText(
      typeof article?.articleBody === "string" ? article.articleBody : mainHtml(html),
    ).slice(0, MAX_CONTENT_CHARS);
    const authors = unique([
      ...strings(article?.author),
      meta(html, ["author", "article:author"]),
      ...labelledValues(extractedContent, ["Authors? & editors?", "Author", "By"]),
    ]);
    const credits = unique([
      meta(html, ["credit", "copyright", "dc.rights"]),
      ...labelledValues(extractedContent, ["Credit(?: & Copyright)?", "Image Credit", "Video Credit(?: & Copyright)?"]),
    ]);
    const publishedAt = (
      typeof article?.datePublished === "string" ? article.datePublished : ""
    ) || meta(html, ["article:published_time", "date", "datePublished"]) || raw.publishedAt || "";
    const description = (
      typeof article?.description === "string" ? cleanText(article.description) : ""
    ) || meta(html, ["description", "og:description"]) || raw.summary || "";

    return {
      ...raw,
      url: response.url || raw.url,
      summary: description,
      content: extractedContent || raw.summary,
      publishedAt: publishedAt || undefined,
      author: authors[0] || raw.author,
      authors,
      credits,
      extraction: {
        status: extractedContent ? "complete" : "summary_only",
        fetchedAt: new Date().toISOString(),
        contentCharacters: extractedContent.length,
      },
    };
  } catch (error) {
    return {
      ...raw,
      extraction: {
        status: "failed",
        fetchedAt: new Date().toISOString(),
        contentCharacters: 0,
        error: error instanceof Error ? error.message : "article extraction failed",
      },
    };
  }
}
