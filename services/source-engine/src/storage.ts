import pg from "pg";
import { createClient } from "redis";
import type { SourceItem } from "./types.js";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const redis = createClient({ url: process.env.REDIS_URL });
let redisReady=false;
async function cache(){if(!redisReady){redis.on("error",()=>{});await redis.connect();redisReady=true;}return redis;}

export async function ensureSchema(){await pool.query(`CREATE TABLE IF NOT EXISTS source_items (id text PRIMARY KEY, fingerprint text NOT NULL, source_id text NOT NULL, publisher text NOT NULL, headline text NOT NULL, canonical_url text NOT NULL, payload jsonb NOT NULL, ingested_at timestamptz NOT NULL DEFAULT now()); CREATE UNIQUE INDEX IF NOT EXISTS source_items_fingerprint_idx ON source_items(fingerprint); CREATE INDEX IF NOT EXISTS source_items_ingested_at_idx ON source_items(ingested_at DESC);`);}

export async function persistItem(item:SourceItem){await ensureSchema();const result=await pool.query(`INSERT INTO source_items(id,fingerprint,source_id,publisher,headline,canonical_url,payload) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (fingerprint) DO NOTHING RETURNING id`,[item.id,item.fingerprint,item.sourceId,item.publisher,item.headline,item.canonicalUrl,item]);return result.rowCount===1;}

export async function claimIdempotency(key:string,ttlSeconds=86400){const c=await cache();return (await c.set(`p360:ingest:${key}`,"1",{NX:true,EX:ttlSeconds}))==="OK";}
