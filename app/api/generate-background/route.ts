import OpenAI from "openai";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const maxDuration = 300;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY 尚未設定" }, { status: 500 });
    }
    const form = await req.formData();
    const style = form.get("style");
    const prompt = String(form.get("prompt") || "");
    if (!(style instanceof File)) return NextResponse.json({ error: "請上傳參考海報" }, { status: 400 });

    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: style,
      prompt,
      size: "1536x1024",
      quality: "medium"
    });

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) return NextResponse.json({ error: "OpenAI 沒有回傳背景圖" }, { status: 500 });
    return NextResponse.json({ imageUrl: `data:image/png;base64,${b64}` });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "背景生成失敗" }, { status: 500 });
  }
}
