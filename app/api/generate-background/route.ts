import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function cleanError(error: any) {
  const msg = String(error?.message || error || "未知錯誤");
  if (msg.includes("billing") || msg.includes("quota") || msg.includes("insufficient_quota")) return "OpenAI 額度或付款問題：" + msg;
  if (msg.includes("401") || msg.includes("api key") || msg.includes("Incorrect API key")) return "OPENAI_API_KEY 錯誤或無效：" + msg;
  if (msg.includes("rate") || msg.includes("429")) return "OpenAI 速率限制，請稍後再試：" + msg;
  return msg;
}

export async function POST(req: Request) {
  const started = Date.now();

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY 尚未設定" }, { status: 500 });
    }

    const formData = await req.formData();
    const style = formData.get("style");
    const prompt = String(formData.get("prompt") || "");

    if (!(style instanceof File)) {
      return NextResponse.json({ error: "請上傳參考海報" }, { status: 400 });
    }

    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: style,
      prompt,
      size: "1536x1024",
      quality: "medium"
    });

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({ error: "OpenAI 沒有回傳背景圖", elapsedMs: Date.now() - started }, { status: 500 });
    }

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${b64}`,
      elapsedMs: Date.now() - started
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: cleanError(error), elapsedMs: Date.now() - started },
      { status: 500 }
    );
  }
}
