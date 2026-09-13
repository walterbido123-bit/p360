import { prompts } from "./prompts.js";
import type { AgentRequest, AgentResult, EditorialProvider } from "./types.js";

type ClaudeTextBlock = { type: "text"; text: string };
type ClaudeResponse = { content?: Array<ClaudeTextBlock | { type: string }> };
type OpenAIResponse = { choices?: Array<{ message?: { content?: string | null } }> };
type ProviderStatus = {
  requested: "auto" | EditorialProvider;
  provider: EditorialProvider;
  model: string | null;
  configured: boolean;
};

export function getProviderStatus(env: NodeJS.ProcessEnv = process.env): ProviderStatus {
  const requested = (env.EDITORIAL_PROVIDER ?? "auto").trim().toLowerCase();
  if (!["auto", "anthropic", "openai"].includes(requested)) {
    throw new Error("EDITORIAL_PROVIDER must be auto, anthropic, or openai");
  }

  const provider: EditorialProvider = requested === "auto"
    ? (env.ANTHROPIC_API_KEY ? "anthropic" : env.OPENAI_API_KEY ? "openai" : "anthropic")
    : requested as EditorialProvider;
  const model = provider === "anthropic"
    ? env.CLAUDE_EDITORIAL_MODEL ?? null
    : env.OPENAI_EDITORIAL_MODEL ?? null;
  const apiKey = provider === "anthropic" ? env.ANTHROPIC_API_KEY : env.OPENAI_API_KEY;

  return {
    requested: requested as ProviderStatus["requested"],
    provider,
    model,
    configured: Boolean(apiKey && model)
  };
}

function parseJson(text: string): Record<string, unknown> {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const value = JSON.parse(trimmed);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Agent returned non-object JSON");
  }
  return value;
}

function requestPayload(request: AgentRequest) {
  return JSON.stringify({ input: request.input, sources: request.sources ?? [] });
}

export function supportsCustomTemperature(model: string) {
  const normalized = model.trim().toLowerCase();
  return !/^(?:gpt-5|o[1-9])(?:[.-]|$)/.test(normalized);
}

async function callAnthropic(request: AgentRequest, apiKey: string, model: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: 0.2,
      system: prompts[request.agent],
      messages: [{ role: "user", content: requestPayload(request) }]
    }),
    signal: AbortSignal.timeout(120000)
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Anthropic API error ${response.status}: ${detail}`);
  }

  const data = await response.json() as ClaudeResponse;
  const text = data.content
    ?.filter((block): block is ClaudeTextBlock => block.type === "text" && "text" in block)
    .map(block => block.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("Anthropic returned no text content");
  return parseJson(text);
}

async function callOpenAI(request: AgentRequest, apiKey: string, model: string) {
  const generationOptions = supportsCustomTemperature(model)
    ? { temperature: 0.2 }
    : {};
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      ...generationOptions,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `${prompts[request.agent]}\nReturn one valid JSON object and no markdown.` },
        { role: "user", content: requestPayload(request) }
      ]
    }),
    signal: AbortSignal.timeout(120000)
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`OpenAI API error ${response.status}: ${detail}`);
  }

  const data = await response.json() as OpenAIResponse;
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenAI returned no text content");
  return parseJson(text);
}

async function callProvider(request: AgentRequest) {
  const status = getProviderStatus();
  if (!status.configured || !status.model) {
    throw new Error(`${status.provider} editorial provider is not configured`);
  }

  const apiKey = status.provider === "anthropic"
    ? process.env.ANTHROPIC_API_KEY
    : process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error(`${status.provider} API key is not configured`);

  const output = status.provider === "anthropic"
    ? await callAnthropic(request, apiKey, status.model)
    : await callOpenAI(request, apiKey, status.model);
  return { provider: status.provider, model: status.model, output };
}

export async function runAgent(request: AgentRequest): Promise<AgentResult> {
  const started = Date.now();
  if (request.dryRun) {
    return {
      workflowId: request.workflowId,
      eventId: request.eventId,
      agent: request.agent,
      status: "completed",
      output: { dryRun: true },
      sources: request.sources ?? [],
      durationMs: Date.now() - started
    };
  }

  const { provider, model, output } = await callProvider(request);
  const humanReviewRequired = output.humanReviewRequired === true;
  return {
    workflowId: request.workflowId,
    eventId: request.eventId,
    agent: request.agent,
    status: humanReviewRequired ? "human_review" : "completed",
    output,
    sources: request.sources ?? [],
    provider,
    model,
    durationMs: Date.now() - started
  };
}
