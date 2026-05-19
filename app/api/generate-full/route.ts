import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY 尚未設定" }, { status: 500 });
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

    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: images,
      prompt,
      size: "1536x1024",
      quality: "medium"
    });

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({ error: "OpenAI 沒有回傳圖片" }, { status: 500 });
    }

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${b64}`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "完整海報生成失敗" }, { status: 500 });
  }
}
