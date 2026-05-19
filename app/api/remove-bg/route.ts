import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    if (!process.env.REMOVE_BG_API_KEY) {
      return NextResponse.json(
        { error: "REMOVE_BG_API_KEY 尚未設定。請到 Vercel Environment Variables 新增 remove.bg API Key。" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "請上傳原始人車照" }, { status: 400 });
    }

    const apiForm = new FormData();
    apiForm.append("image_file", image);
    apiForm.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.REMOVE_BG_API_KEY
      },
      body: apiForm
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: "remove.bg 去背失敗：" + text.slice(0, 200) },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${base64}`
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "去背失敗" },
      { status: 500 }
    );
  }
}
