import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

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

    const totalBytes = images.reduce((sum, img) => sum + img.size, 0);
    if (totalBytes > 4_000_000) {
      return NextResponse.json({ error: "圖片總大小仍太大，請先只上傳 2~3 張參考圖測試" }, { status: 413 });
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
  } catch (error: any) {
    console.error(error);
    const message = error?.message || "未知錯誤";
    return NextResponse.json(
      { error: "生成失敗：" + message },
      { status: 500 }
    );
  }
}
