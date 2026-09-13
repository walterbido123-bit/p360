import { afterEach, describe, expect, it } from "vitest";
import { getProviderStatus, supportsCustomTemperature } from "./runner.js";

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

describe("OpenAI generation options", () => {
  it("omits custom temperature for GPT-5 and reasoning models", () => {
    expect(supportsCustomTemperature("gpt-5-mini")).toBe(false);
    expect(supportsCustomTemperature("o3-mini")).toBe(false);
  });

  it("keeps editorial temperature for compatible chat models", () => {
    expect(supportsCustomTemperature("gpt-4.1-mini")).toBe(true);
  });
});
