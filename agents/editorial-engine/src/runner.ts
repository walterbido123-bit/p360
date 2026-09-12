import { prompts } from "./prompts.js";
import type { AgentRequest, AgentResult } from "./types.js";

type ClaudeTextBlock = { type: "text"; text: string };
type ClaudeResponse = { content?: Array<ClaudeTextBlock | { type: string }> };

function config() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.CLAUDE_EDITORIAL_MODEL;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
  if (!model) throw new Error("CLAUDE_EDITORIAL_MODEL is not configured");
  return { apiKey, model };
}

function parseJson(text: string): Record<string, unknown> {
  const trimmed = text.trim().replace(/^\`\`\`(?:json)?\s*/i, "").replace(/\s*\`\`\`$/, "");
  const value = JSON.parse(trimmed);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Agent returned non-object JSON");
  }
  return value;
}

async function callClaude(request: AgentRequest) {
  const { apiKey, model } = config();
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
      messages: [{
        role: "user",
        content: JSON.stringify({ input: request.input, sources: request.sources ?? [] })
      }]
    }),
    signal: AbortSignal.timeout(120000)
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Claude API error ${response.status}: ${detail}`);
  }

  const data = await response.json() as ClaudeResponse;
  const text = data.content
    ?.filter((block): block is ClaudeTextBlock => block.type === "text" && "text" in block)
    .map(block => block.text)
    .join("\n")
    .trim();

  if (!text) throw new Error("Claude returned no text content");
  return { model, output: parseJson(text) };
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

  const { model, output } = await callClaude(request);
  const humanReviewRequired = output.humanReviewRequired === true;
  return {
    workflowId: request.workflowId,
    eventId: request.eventId,
    agent: request.agent,
    status: humanReviewRequired ? "human_review" : "completed",
    output,
    sources: request.sources ?? [],
    model,
    durationMs: Date.now() - started
  };
}
