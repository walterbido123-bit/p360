#!/bin/sh
set -eu
: "${SOURCE_SERVICE_TOKEN:?required}"
: "${AGENT_SERVICE_TOKEN:?required}"
SOURCE_URL=${SOURCE_SERVICE_URL:-http://localhost:3003}
AGENT_URL=${AGENT_SERVICE_URL:-http://localhost:3002}

echo "[1/4] health"
curl -fsS "$SOURCE_URL/health"; echo
curl -fsS "$AGENT_URL/health"; echo

echo "[2/4] ingest real public RSS into PostgreSQL/Redis"
INGEST=$(curl -fsS -X POST "$SOURCE_URL/v1/ingest/rss" -H "Authorization: Bearer $SOURCE_SERVICE_TOKEN" -H 'Content-Type: application/json' --data '{"id":"staging-europarl","name":"European Parliament News","kind":"rss","url":"https://www.europarl.europa.eu/rss/doc/top-stories/en.xml","publisher":"European Parliament","desk":"globales","geography":"EU","tier":"primary","enabled":true,"pollMinutes":60}')
printf '%s\n' "$INGEST" > /tmp/p360-ingest.json

ITEM=$(node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync("/tmp/p360-ingest.json"));if(!x.items?.length){console.error("No new item (possibly idempotent). Reset staging volumes or use a fresh feed item.");process.exit(2)};process.stdout.write(JSON.stringify(x.items[0]))')

echo "[3/4] run editorial chain in dry-run mode (no model cost, no WordPress)"
WORKFLOW_ID="staging-$(date +%s)"
for AGENT in supervisor research classifier writer factcheck editor seo; do
  PAYLOAD=$(node -e 'const item=JSON.parse(process.argv[1]);const wf=process.argv[2];process.stdout.write(JSON.stringify({workflowId:wf,eventId:wf+"-"+process.argv[3],input:item,sources:[{url:item.canonicalUrl,publisher:item.publisher}],dryRun:true}))' "$ITEM" "$WORKFLOW_ID" "$AGENT")
  curl -fsS -X POST "$AGENT_URL/v1/agents/$AGENT" -H "Authorization: Bearer $AGENT_SERVICE_TOKEN" -H 'Content-Type: application/json' --data "$PAYLOAD"; echo
done

echo "[4/4] PASS: Internet -> Source Engine -> Redis/PostgreSQL -> editorial agents; WordPress was never called."
