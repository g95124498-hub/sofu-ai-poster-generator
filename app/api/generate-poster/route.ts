import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json({
    error: "v3 固定版型不使用 OpenAI API。請在前端上傳去背 PNG，按『生成 v3 固定版型』。"
  }, { status: 400 });
}
