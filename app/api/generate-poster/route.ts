import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get("source_image");
    const prompt = String(formData.get("prompt") || "");
    const size = String(formData.get("size") || "1024x1024") as "1024x1024" | "1536x1024" | "1024x1536";

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY 尚未設定" },
        { status: 500 }
      );
    }

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "請上傳人車照片" },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt 不可空白" },
        { status: 400 }
      );
    }

    const result = await openai.images.edit({
      model: "gpt-image-1",
      image,
      prompt,
      size
    });

    const base64 = result.data?.[0]?.b64_json;

    if (!base64) {
      return NextResponse.json(
        { error: "AI 沒有回傳圖片" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${base64}`
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "生成失敗，請檢查 API Key、帳戶額度或圖片格式" },
      { status: 500 }
    );
  }
}
