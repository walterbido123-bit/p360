import { afterEach, describe, expect, it } from "vitest";
import { getProviderStatus } from "./runner.js";

const original = { ...process.env };

afterEach(() => {
  process.env = { ...original };
});

describe("editorial provider selection", () => {
  it("selects OpenAI explicitly", () => {
    const status = getProviderStatus({
      EDITORIAL_PROVIDER: "openai",
      OPENAI_API_KEY: "test-key",
      OPENAI_EDITORIAL_MODEL: "gpt-test"
    });
    expect(status).toEqual({
      requested: "openai",
      provider: "openai",
      model: "gpt-test",
      configured: true
    });
  });

  it("keeps Anthropic as the auto preference when both providers exist", () => {
    const status = getProviderStatus({
      EDITORIAL_PROVIDER: "auto",
      ANTHROPIC_API_KEY: "test-key",
      CLAUDE_EDITORIAL_MODEL: "claude-test",
      OPENAI_API_KEY: "test-key",
      OPENAI_EDITORIAL_MODEL: "gpt-test"
    });
    expect(status.provider).toBe("anthropic");
    expect(status.configured).toBe(true);
  });

  it("rejects an unknown provider", () => {
    expect(() => getProviderStatus({ EDITORIAL_PROVIDER: "other" })).toThrow(
      "EDITORIAL_PROVIDER must be auto, anthropic, or openai"
    );
  });
});
