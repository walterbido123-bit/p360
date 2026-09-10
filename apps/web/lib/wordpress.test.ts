import { describe, expect, it } from "vitest";
import { WordPressConfigurationError, getWordPressApiBase } from "./wordpress";

describe("WordPress adapter", () => {
  it("fails closed when WordPress is not configured", () => {
    if (process.env.WORDPRESS_API_URL) return;
    expect(() => getWordPressApiBase()).toThrow(WordPressConfigurationError);
  });
});
