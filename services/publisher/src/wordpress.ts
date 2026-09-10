type PublishPayload = { title: string; content: string; excerpt?: string; status?: "draft" | "pending" | "publish" };

function config() {
  const base = process.env.WORDPRESS_API_URL;
  const username = process.env.WORDPRESS_USERNAME;
  const password = process.env.WORDPRESS_APPLICATION_PASSWORD;
  if (!base || !username || !password) throw new Error("WordPress publisher credentials are not configured");
  return { base: base.replace(/\/$/, ""), auth: Buffer.from(`${username}:${password}`).toString("base64") };
}

export async function publishToWordPress(payload: PublishPayload) {
  const { base, auth } = config();
  const response = await fetch(`${base}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Basic ${auth}` },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`WordPress publish failed: ${response.status}`);
  return response.json();
}
