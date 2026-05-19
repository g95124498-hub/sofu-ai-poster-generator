import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Size = "1024x1024" | "1536x1024" | "1024x1536";

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY 尚未設定" }, { status: 500 });
    }

    const formData = await req.formData();
    const prompt = String(formData.get("prompt") || "");
    const size = String(formData.get("size") || "1536x1024") as Size;

    const imageKeys = ["source", "face", "style1", "style2", "price", "logo", "plate"];
    const images = imageKeys
      .map((key) => formData.get(key))
      .filter((file): file is File => file instanceof File);

    if (!images.length) {
      return NextResponse.json({ error: "請至少上傳原始人車照" }, { status: 400 });
    }

    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: images,
      prompt,
      size
    });

    const base64 = result.data?.[0]?.b64_json;
    if (!base64) {
      return NextResponse.json({ error: "AI 沒有回傳圖片" }, { status: 500 });
    }

    return NextResponse.json({ imageUrl: `data:image/png;base64,${base64}` });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "生成失敗：請檢查圖片格式、OpenAI 額度、或圖片是否過大" },
      { status: 500 }
    );
  }
}
