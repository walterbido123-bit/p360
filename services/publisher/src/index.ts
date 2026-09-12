import Fastify from "fastify";
import { timingSafeEqual } from "node:crypto";
import { editorialGate } from "./policy.js";
import { publishToWordPress } from "./wordpress.js";

const app = Fastify({ logger: true });

function authorized(value?: string) {
  const expected = process.env.PUBLISHER_SERVICE_TOKEN;
  if (!expected || !value?.startsWith("Bearer ")) return false;
  const supplied = value.slice(7);
  const a = Buffer.from(expected); const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

app.get("/health", async () => ({ service: "p360-publisher", status: "ok", publishingConfigured: Boolean(process.env.WORDPRESS_API_URL && process.env.WORDPRESS_USERNAME && process.env.WORDPRESS_APPLICATION_PASSWORD) }));

app.post("/v1/publish", async (request, reply) => {
  if (!authorized(request.headers.authorization)) return reply.code(401).send({ error: "unauthorized" });
  const body = request.body as any;
  const decision = editorialGate(body.quality ?? {});
  request.log.info({ workflowId: body.workflowId, decision }, "editorial gate decision");
  if (decision !== "auto_publish") return reply.code(409).send({ decision });
  if (process.env.PUBLISHING_ENABLED !== "true") return reply.code(423).send({ error: "publishing_disabled", decision });
  const post = await publishToWordPress({ title: body.headline, content: body.body, excerpt: body.dek, status: "publish" });
  return reply.code(201).send({ decision, post });
});

const port = Number(process.env.PORT ?? 3001);
app.listen({ port, host: "0.0.0.0" }).catch((error) => { app.log.error(error); process.exit(1); });
