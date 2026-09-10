import { describe, expect, it } from "vitest";
import { storyFingerprint, tokenSimilarity } from "./dedupe.js";

describe("dedupe", () => {
  it("normalizes equivalent headlines", () => expect(storyFingerprint("España gana 2-0", "https://example.com/a")).toBe(storyFingerprint("ESPAÑA gana 2 0!", "https://example.com/a")));
  it("scores identical token sets as one", () => expect(tokenSimilarity("Mercados suben hoy", "mercados suben hoy")).toBe(1));
});
