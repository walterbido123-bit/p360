import OpenAI from "openai";
import { prompts } from "./prompts.js";
import type { AgentRequest, AgentResult } from "./types.js";

function client() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function parseJson(text: string): Record<string, unknown> {
  const value = JSON.parse(text);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Agent returned non-object JSON");
  return value;
}

export async function runAgent(request: AgentRequest): Promise<AgentResult> {
  const started = Date.now();
  if (request.dryRun) return { workflowId:request.workflowId,eventId:request.eventId,agent:request.agent,status:"completed",output:{dryRun:true},sources:request.sources ?? [],durationMs:Date.now()-started };
  const model = process.env.OPENAI_EDITORIAL_MODEL ?? "gpt-5.6";
  const response = await client().responses.create({
    model,
    instructions: prompts[request.agent],
    input: JSON.stringify({ input: request.input, sources: request.sources ?? [] })
  });
  const output = parseJson(response.output_text);
  const humanReviewRequired = output.humanReviewRequired === true;
  return { workflowId:request.workflowId,eventId:request.eventId,agent:request.agent,status:humanReviewRequired?"human_review":"completed",output,sources:request.sources ?? [],model,durationMs:Date.now()-started };
}
