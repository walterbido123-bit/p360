import { NextResponse } from "next/server";
import { checkWordPressHealth } from "../../../lib/wordpress";

export async function GET() {
  const wordpress = await checkWordPressHealth();
  const ok = wordpress.status !== "down";
  return NextResponse.json({ service: "p360-web", status: ok ? "ok" : "degraded", wordpress, timestamp: new Date().toISOString() }, { status: ok ? 200 : 503 });
}
