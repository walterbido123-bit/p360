export type NewsCategory =
  | "nacionales"
  | "economicas"
  | "globales"
  | "deportes"
  | "entretenimiento"
  | "tecnologia"
  | "actualidad";

export type EditorialRisk = "low" | "medium" | "high";
export type NewsStatus = "ingested" | "researching" | "draft" | "review" | "approved" | "published" | "rejected";

export interface NewsSource {
  url: string;
  publisher: string;
  publishedAt?: string | null;
}

export interface NewsItem {
  workflowId: string;
  headline: string;
  dek?: string;
  body?: string;
  category: NewsCategory;
  sources: NewsSource[];
  quality: {
    confidence: number;
    risk: EditorialRisk;
    duplicateScore: number;
  };
  status: NewsStatus;
}
