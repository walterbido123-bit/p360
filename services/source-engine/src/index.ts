import Fastify from "fastify";
import { timingSafeEqual } from "node:crypto";
import { fetchRss } from "./rss.js";
import { enrichArticle } from "./article.js";
import { normalizeItem } from "./normalize.js";
import { editorialEligibility } from "./scoring.js";
import { persistItem,claimIdempotency } from "./storage.js";
import { fetchMlb,fetchApiFootball,fetchSportsDataIo } from "./sports.js";
import { fetchApiBaseball } from "./baseball.js";
import type { SourceConfig } from "./types.js";

const app=Fastify({logger:true});
function authorized(value?:string){
  const expected=process.env.SOURCE_SERVICE_TOKEN;
  if(!expected||!value?.startsWith("Bearer "))return false;
  const a=Buffer.from(expected),b=Buffer.from(value.slice(7));
  return a.length===b.length&&timingSafeEqual(a,b);
}
app.get("/health",async()=>({service:"p360-source-engine",status:"ok",database:Boolean(process.env.DATABASE_URL),redis:Boolean(process.env.REDIS_URL),articleExtraction:"full-text-v1"}));
app.post("/v1/ingest/rss",async(req,reply)=>{
  if(!authorized(req.headers.authorization))return reply.code(401).send({error:"unauthorized"});
  const source=req.body as SourceConfig;
  if(source.kind!=="rss"||!source.enabled)return reply.code(400).send({error:"source_not_enabled_or_not_rss"});
  try{
    const raw=await fetchRss(source);
    const items=[];
    for(const candidate of raw){
      const preliminary=normalizeItem(candidate,source);
      if(!(await claimIdempotency(preliminary.fingerprint)))continue;
      const enriched=await enrichArticle(candidate);
      const item=normalizeItem(enriched,source);
      const inserted=await persistItem(item);
      if(inserted)items.push({...item,eligibility:editorialEligibility(item.sourceScore)});
    }
    return{sourceId:source.id,count:items.length,items};
  }catch(error){
    req.log.error({err:error,sourceId:source.id},"source ingest failed");
    return reply.code(502).send({error:"source_ingest_failed",sourceId:source.id});
  }
});
app.get("/v1/sports/mlb/:date",async(req,reply)=>{if(!authorized(req.headers.authorization))return reply.code(401).send({error:"unauthorized"});return fetchMlb((req.params as any).date)});
app.get("/v1/sports/football/:league/:season/:date",async(req,reply)=>{if(!authorized(req.headers.authorization))return reply.code(401).send({error:"unauthorized"});const p=req.params as any;return fetchApiFootball(Number(p.league),Number(p.season),p.date)});
app.get("/v1/sports/nba/:date",async(req,reply)=>{if(!authorized(req.headers.authorization))return reply.code(401).send({error:"unauthorized"});return fetchSportsDataIo(`scores/json/GamesByDate/${(req.params as any).date}`,"basketball","NBA")});
app.get("/v1/sports/caribbean/:league/:season/:date",async(req,reply)=>{if(!authorized(req.headers.authorization))return reply.code(401).send({error:"unauthorized"});const p=req.params as any;return fetchApiBaseball(Number(p.league),Number(p.season),p.date,"Caribbean Baseball")});
app.listen({port:Number(process.env.PORT??3003),host:"0.0.0.0"}).catch(e=>{app.log.error(e);process.exit(1)});
