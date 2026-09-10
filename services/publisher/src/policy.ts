export type EditorialInput = {
  confidence: number;
  duplicateScore: number;
  risk: "low" | "medium" | "high";
  sourceCount: number;
  humanApproved?: boolean;
};

export type EditorialDecision = "auto_publish" | "human_review" | "reject";

export function editorialGate(input: EditorialInput): EditorialDecision {
  if (input.duplicateScore >= 0.88) return "reject";
  if (input.sourceCount < 1 || input.confidence < 0.65) return "reject";
  if (input.risk === "high") return input.humanApproved ? "auto_publish" : "human_review";
  if (input.risk === "medium" || input.confidence < 0.85 || input.sourceCount < 2) {
    return input.humanApproved ? "auto_publish" : "human_review";
  }
  return "auto_publish";
}
