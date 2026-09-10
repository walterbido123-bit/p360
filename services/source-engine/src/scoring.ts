import type { SourceTier } from "./types.js";
const base:Record<SourceTier,number>={primary:0.95,high:0.85,standard:0.7,unverified:0.4};
export function sourceScore(tier:SourceTier,hasTimestamp:boolean,hasCanonicalUrl:boolean){
  let score=base[tier];
  if(!hasTimestamp)score-=0.05;
  if(!hasCanonicalUrl)score-=0.15;
  return Math.max(0,Math.min(1,Number(score.toFixed(2))));
}
export function editorialEligibility(score:number){return score>=0.8?"research":score>=0.6?"human_triage":"quarantine" as const;}
