import { XMLParser } from "fast-xml-parser";
import type { RawItem,SourceConfig } from "./types.js";
const parser=new XMLParser({ignoreAttributes:false,attributeNamePrefix:"@_"});
const array=<T>(v:T|T[]|undefined):T[]=>v===undefined?[]:Array.isArray(v)?v:[v];
function text(v:any):string{if(typeof v==="string")return v;if(v&&typeof v==="object")return String(v["#text"]??v["@_href"]??"");return "";}
export async function fetchRss(source:SourceConfig):Promise<RawItem[]>{
 const response=await fetch(source.url,{headers:{"user-agent":"Periodismo360-Newsroom/1.0"},signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error(`RSS ${source.id} failed: ${response.status}`);
 const doc=parser.parse(await response.text());const items=doc?.rss?.channel?.item??doc?.feed?.entry;
 return array<any>(items).slice(0,100).map(item=>({sourceId:source.id,title:text(item.title),url:text(item.link)||text(item.guid),summary:text(item.description)||text(item.summary)||text(item.content),publishedAt:text(item.pubDate)||text(item.published)||text(item.updated)||undefined,author:text(item.author?.name??item.author)||undefined,externalId:text(item.guid)||text(item.id)||undefined})).filter(x=>x.title&&x.url);
}
