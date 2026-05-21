import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    openaiKey: Boolean(process.env.OPENAI_API_KEY),
    removeBgKey: Boolean(process.env.REMOVE_BG_API_KEY),
    version: "real-v22",
    time: new Date().toISOString()
  });
}
