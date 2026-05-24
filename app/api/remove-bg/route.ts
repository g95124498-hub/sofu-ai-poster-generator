import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(req: Request) {
  try {
    if (!process.env.REMOVE_BG_API_KEY) {
      return NextResponse.json({ error: "REMOVE_BG_API_KEY 尚未設定" }, { status: 500 });
    }
    const form = await req.formData();
    const image = form.get("image");
    if (!(image instanceof File)) return NextResponse.json({ error: "請上傳圖片" }, { status: 400 });

    const out = new FormData();
    out.append("image_file", image);
    out.append("size", "auto");

    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": process.env.REMOVE_BG_API_KEY },
      body: out
    });

    if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 500 });

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return NextResponse.json({ imageUrl: `data:image/png;base64,${base64}` });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "去背失敗" }, { status: 500 });
  }
}
