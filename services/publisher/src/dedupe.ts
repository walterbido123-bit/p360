import { createHash } from "node:crypto";

export function normalizeHeadline(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

export function storyFingerprint(headline: string, canonicalSourceUrl?: string) {
  const normalized = `${normalizeHeadline(headline)}|${canonicalSourceUrl ?? ""}`;
  return createHash("sha256").update(normalized).digest("hex");
}

export function tokenSimilarity(a: string, b: string) {
  const left = new Set(normalizeHeadline(a).split(" ").filter(Boolean));
  const right = new Set(normalizeHeadline(b).split(" ").filter(Boolean));
  if (!left.size && !right.size) return 1;
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}
