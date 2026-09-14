import { createHash } from "node:crypto";
import type { NormalizedItem,RawItem,SourceConfig } from "./types.js";
import { sourceScore } from "./scoring.js";

export function canonicalizeUrl(value:string){
  try{
    const url=new URL(value);
    [...url.searchParams.keys()].filter(k=>k.startsWith("utm_")||["fbclid","gclid"].includes(k)).forEach(k=>url.searchParams.delete(k));
    url.hash="";
    return url.toString();
  }catch{return value.trim();}
}
export function normalizeTitle(value:string){return value.normalize("NFKC").replace(/\s+/g," ").trim();}
export function fingerprint(title:string,url:string){return createHash("sha256").update(`${normalizeTitle(title).toLowerCase()}|${canonicalizeUrl(url)}`).digest("hex");}
export function normalizeItem(raw:RawItem,source:SourceConfig):NormalizedItem{
  const url=canonicalizeUrl(raw.url);
  const title=normalizeTitle(raw.title);
  return{
    id:raw.externalId??fingerprint(title,url),
    sourceId:source.id,
    publisher:source.publisher,
    headline:title,
    canonicalUrl:url,
    summary:(raw.summary??"").trim(),
    content:(raw.content??raw.summary??"").trim(),
    publishedAt:raw.publishedAt??null,
    author:raw.author??raw.authors?.[0]??null,
    authors:raw.authors??(raw.author?[raw.author]:[]),
    credits:raw.credits??[],
    desk:source.desk,
    geography:source.geography,
    sourceTier:source.tier,
    sourceScore:sourceScore(source.tier,Boolean(raw.publishedAt),Boolean(url)),
    fingerprint:fingerprint(title,url),
    extraction:raw.extraction??null,
    ingestedAt:new Date().toISOString()
  };
}
