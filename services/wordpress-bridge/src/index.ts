import Fastify from "fastify";
import { timingSafeEqual } from "node:crypto";
import sharp from "sharp";

type DraftPayload = {
  workflowId?: string;
  headline?: string;
  dek?: string;
  body?: string;
  category?: string;
  status?: string;
  imageBrief?: string;
  imageAlt?: string;
  imageCaption?: string;
  [key: string]: unknown;
};

type ImageGenerationResponse = {
  data?: Array<{ b64_json?: string }>;
  error?: { message?: string };
};

type WordPressHealth = {
  mode?: string;
  featured_image?: { required?: boolean; width?: number; height?: number };
};

const app = Fastify({ logger: true, bodyLimit: 15 * 1024 * 1024 });

function authorized(value?: string) {
  const expected = process.env.WORDPRESS_BRIDGE_TOKEN;
  if (!expected || !value?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(value.slice(7));
  const configured = Buffer.from(expected);
  return supplied.length === configured.length && timingSafeEqual(configured, supplied);
}

function config() {
  const base = process.env.WORDPRESS_SITE_URL;
  const wordpressToken = process.env.WORDPRESS_AI_INGEST_TOKEN;
  const openAiKey = process.env.OPENAI_API_KEY;
  if (!base || !wordpressToken) throw new Error("WordPress bridge not configured");
  if (!openAiKey) throw new Error("OpenAI image generation not configured");
  return {
    base: base.replace(/\/$/, ""),
    wordpressToken,
    openAiKey,
    imageModel: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-sunburst",
    imageQuality: process.env.OPENAI_IMAGE_QUALITY || "low",
  };
}

function imagePrompt(body: DraftPayload) {
  const brief = typeof body.imageBrief === "string" ? body.imageBrief.trim() : "";
  const subject = brief || `${body.headline || "Actualidad"}. ${body.dek || ""}`;
  return [
    "Create a landscape editorial illustration for a Spanish-language digital news article.",
    `Story: ${subject}`,
    `News desk: ${body.category || "actualidad"}.`,
    "Documentary editorial style, realistic lighting, strong single focal point, clean composition with safe crop margins.",
    "Do not add text, letters, captions, logos, watermarks, flags used as propaganda, or fabricated screenshots.",
    "Do not portray a generated scene as photographic proof of the reported event. Avoid recognizable public figures; use symbolic objects, locations, silhouettes, maps, technology, or environmental context instead.",
    "The result will be center-cropped to exactly 800 by 440 pixels.",
  ].join("\n");
}

async function generateFeaturedImage(body: DraftPayload, cfg: ReturnType<typeof config>) {
  const prompt = imagePrompt(body);
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      authorization: `Bearer ${cfg.openAiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: cfg.imageModel,
      prompt,
      size: "1536x1024",
      quality: cfg.imageQuality,
      output_format: "jpeg",
      output_compression: 85,
      n: 1,
    }),
    signal: AbortSignal.timeout(180_000),
  });
  const result = (await response.json()) as ImageGenerationResponse;
  const data = result.data?.[0]?.b64_json;
  if (!response.ok || !data) {
    throw new Error(`Image generation failed (${response.status}): ${result.error?.message || "empty image"}`);
  }
  const normalized = await sharp(Buffer.from(data, "base64"), {
    failOn: "error",
    limitInputPixels: 40_000_000,
  })
    .rotate()
    .resize(800, 440, { fit: "cover", position: "attention" })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
  return {
    data: normalized.toString("base64"),
    mimeType: "image/jpeg",
    filename: `${String(body.workflowId || "p360-news").replace(/[^a-zA-Z0-9_-]/g, "-")}.jpg`,
    alt: String(body.imageAlt || body.headline || "Imagen editorial de Periodismo360").slice(0, 250),
    caption: `Imagen generada con inteligencia artificial para fines ilustrativos.${body.imageCaption ? ` ${String(body.imageCaption).slice(0, 300)}` : ""}`,
    generationModel: cfg.imageModel,
    isGenerated: true,
    targetWidth: 800,
    targetHeight: 440,
  };
}

async function verifyWordPressCapability(cfg: ReturnType<typeof config>) {
  const response = await fetch(`${cfg.base}/wp-json/p360-ai/v1/health`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`WordPress health check failed (${response.status})`);
  const health = (await response.json()) as WordPressHealth;
  const image = health.featured_image;
  if (
    health.mode !== "draft-only" ||
    image?.required !== true ||
    image.width !== 800 ||
    image.height !== 440
  ) {
    throw new Error("WordPress does not advertise required 800x440 featured-image support");
  }
}

app.get("/health", async () => ({
  service: "p360-wordpress-bridge",
  status: "ok",
  configured: Boolean(
    process.env.WORDPRESS_SITE_URL &&
      process.env.WORDPRESS_AI_INGEST_TOKEN &&
      process.env.OPENAI_API_KEY,
  ),
  destination: process.env.WORDPRESS_SITE_URL || null,
  image: { required: true, width: 800, height: 440 },
  mode: "draft-only",
}));

app.post("/v1/drafts", async (request, reply) => {
  if (!authorized(request.headers.authorization)) return reply.code(401).send({ error: "unauthorized" });
  const body = (request.body || {}) as DraftPayload;
  if (body.status && body.status !== "draft") return reply.code(403).send({ error: "publish_forbidden" });
  if (!body.workflowId || !body.headline || !body.body) {
    return reply.code(400).send({ error: "invalid_payload" });
  }

  try {
    const cfg = config();
    await verifyWordPressCapability(cfg);
    const featuredImage = await generateFeaturedImage(body, cfg);
    const response = await fetch(`${cfg.base}/wp-json/p360-ai/v1/draft`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${cfg.wordpressToken}`,
      },
      body: JSON.stringify({ ...body, status: "draft", featuredImage }),
      signal: AbortSignal.timeout(60_000),
    });
    const data = await response.json();
    return reply.code(response.status).send(data);
  } catch (error) {
    request.log.error({ err: error, workflowId: body.workflowId }, "wordpress draft bridge failed");
    return reply.code(502).send({ error: "wordpress_bridge_failed" });
  }
});

app.listen({ port: Number(process.env.PORT ?? 3004), host: "0.0.0.0" }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
