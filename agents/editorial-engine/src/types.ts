export const agentNames = ["supervisor","research","classifier","writer","factcheck","editor","seo","multimedia"] as const;
export type AgentName = typeof agentNames[number];

export type Source = { url: string; publisher: string; publishedAt?: string; evidence?: string };
export type AgentRequest = { workflowId: string; eventId: string; agent: AgentName; input: Record<string, unknown>; sources?: Source[]; dryRun?: boolean };
export type AgentResult = { workflowId: string; eventId: string; agent: AgentName; status: "completed"|"human_review"|"failed"; output: Record<string, unknown>; sources: Source[]; model?: string; durationMs: number };

export type StoryState = {
  workflowId: string;
  raw: Record<string, unknown>;
  sources: Source[];
  research?: Record<string, unknown>;
  classification?: Record<string, unknown>;
  draft?: Record<string, unknown>;
  factcheck?: Record<string, unknown>;
  edited?: Record<string, unknown>;
  seo?: Record<string, unknown>;
  multimedia?: Record<string, unknown>;
};
