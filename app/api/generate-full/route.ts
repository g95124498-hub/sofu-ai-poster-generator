import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function cleanError(error: any) {
  const msg = String(error?.message || error || "未知錯誤");
  if (msg.includes("billing") || msg.includes("quota") || msg.includes("insufficient_quota")) {
    return "OpenAI 額度或付款問題：請確認 Billing / Usage。原始錯誤：" + msg;
  }
  if (msg.includes("401") || msg.includes("api key") || msg.includes("Incorrect API key")) {
    return "OPENAI_API_KEY 錯誤或無效。原始錯誤：" + msg;
  }
  if (msg.includes("rate") || msg.includes("429")) {
    return "OpenAI 目前請求太多或速率限制，請稍後再試。原始錯誤：" + msg;
  }
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return "OpenAI 圖片生成逾時，請縮小圖片或稍後再試。原始錯誤：" + msg;
  }
  return msg;
}

export async function POST(req: Request) {
  const started = Date.now();

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY 尚未設定。請到 Vercel Environment Variables 新增。" }, { status: 500 });
    }

    const formData = await req.formData();
    const source = formData.get("source");
    const style = formData.get("style");
    const logo = formData.get("logo");
    const face = formData.get("face");
    const prompt = String(formData.get("prompt") || "");

    const images: File[] = [];
    if (source instanceof File) images.push(source);
    if (style instanceof File) images.push(style);
    if (face instanceof File) images.push(face);
    if (logo instanceof File) images.push(logo);

    if (images.length < 2) {
      return NextResponse.json({ error: "請至少上傳原始人車照與參考海報" }, { status: 400 });
    }

    const totalSize = images.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > 7_000_000) {
      return NextResponse.json({ error: "圖片總大小太大，請降低解析度後再試。" }, { status: 413 });
    }

    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: images,
      prompt,
      size: "1536x1024",
      quality: "medium"
    });

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({
        error: "OpenAI 有回應，但沒有回傳圖片資料。",
        elapsedMs: Date.now() - started
      }, { status: 500 });
    }

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${b64}`,
      elapsedMs: Date.now() - started
    });
  } catch (error: any) {
    return NextResponse.json({
      error: cleanError(error),
      elapsedMs: Date.now() - started
    }, { status: 500 });
  }
}
