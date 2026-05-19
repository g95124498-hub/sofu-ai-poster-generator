"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, Wand2, Download, Layers, ShieldCheck } from "lucide-react";

type Key = "source" | "style" | "logo" | "plate";
const items: { key: Key; label: string; required?: boolean }[] = [
  { key: "source", label: "原始人車照", required: true },
  { key: "style", label: "參考海報", required: true },
  { key: "logo", label: "SOFU Logo PNG" },
  { key: "plate", label: "車牌 PNG" }
];

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

async function compressImage(file: File, maxSize = 1200, quality = 0.72): Promise<File> {
  const img = document.createElement("img");
  const url = URL.createObjectURL(file);
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject();
    img.src = url;
  });
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(url);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => b ? resolve(b) : reject(), "image/jpeg", quality);
  });
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}

export default function Home() {
  const refs = useRef<Partial<Record<Key, HTMLInputElement | null>>>({});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [files, setFiles] = useState<Partial<Record<Key, File>>>({});
  const [urls, setUrls] = useState<Partial<Record<Key, string>>>({});
  const [cutoutUrl, setCutoutUrl] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [status, setStatus] = useState("請上傳原始人車照與參考海報，然後按「一鍵生成」。");
  const [loading, setLoading] = useState(false);

  const [carModel, setCarModel] = useState("2025 NISSAN X-TRAIL 1.5T");
  const [headline, setHeadline] = useState("新貨到");
  const [jpText, setJpText] = useState("新入荷しました");
  const [feature, setFeature] = useState("超值 / 輕油電 / 現省大價差");
  const [price, setPrice] = useState("75.9");
  const [extra, setExtra] = useState("參考圖風格：黑色工業 showroom、紅橘速度光、濕亮反射地板、煙霧、厚重金屬字氛圍。背景不要出現車或人物。");

  const bgPrompt = useMemo(() => `只根據參考海報生成「背景與氣氛」，不要生成任何車、人物、價格、Logo、中文字。
請輸出 4:3 橫式背景：
- 黑色高級工業 showroom
- 紅橘速度光從左向右爆發
- 濕亮反射地板
- 車展舞台光
- cinematic smoke
- 左側斜切黑色金屬牆
- 高級台灣中古車廣告氛圍
禁止出現：車輛、人物、假中文字、價格、Logo。
${extra}`, [extra]);

  function pick(key: Key, file?: File) {
    if (!file) return;
    setFiles((p) => ({ ...p, [key]: file }));
    setUrls((p) => ({ ...p, [key]: URL.createObjectURL(file) }));
    setStatus(`已上傳：${items.find((item) => item.key === key)?.label}`);
  }

  function drawMetalText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) {
    ctx.save();
    ctx.font = `900 ${size}px Microsoft JhengHei, Arial`;
    ctx.lineJoin = "round";
    ctx.lineWidth = 18;
    ctx.strokeStyle = "rgba(0,0,0,.95)";
    ctx.strokeText(text, x + 8, y + 12);

    const g = ctx.createLinearGradient(0, y - size, 0, y + 25);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(.18, "#bfbfbf");
    g.addColorStop(.36, "#6f6f6f");
    g.addColorStop(.52, "#f5f5f5");
    g.addColorStop(.72, "#8b8b8b");
    g.addColorStop(1, "#eeeeee");

    ctx.fillStyle = g;
    ctx.fillText(text, x, y);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,255,.75)";
    ctx.strokeText(text, x, y);
    ctx.restore();
  }

  async function removeBg() {
    if (!files.source) throw new Error("請先上傳原始人車照");
    const formData = new FormData();
    formData.append("image", await compressImage(files.source, 1500, 0.78));
    const res = await fetch("/api/remove-bg", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok || !data.imageUrl) throw new Error(data.error || "去背失敗");
    setCutoutUrl(data.imageUrl);
    return data.imageUrl as string;
  }

  async function generateBackground() {
    if (!files.style) throw new Error("請先上傳參考海報");
    const formData = new FormData();
    formData.append("style", await compressImage(files.style, 1200, 0.72));
    formData.append("prompt", bgPrompt);
    const res = await fetch("/api/generate-background", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok || !data.imageUrl) throw new Error(data.error || "背景生成失敗");
    setBackgroundUrl(data.imageUrl);
    return data.imageUrl as string;
  }

  async function compose(bgUrl: string, subjectUrl: string) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = 1600, H = 1200;
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d")!;
    const bg = await loadImage(bgUrl);
    ctx.drawImage(bg, 0, 0, W, H);

    // dark top gradient for title readability
    const topShade = ctx.createLinearGradient(0, 0, 0, 360);
    topShade.addColorStop(0, "rgba(0,0,0,.65)");
    topShade.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = topShade;
    ctx.fillRect(0, 0, W, 360);

    // Main subject
    const subject = await loadImage(subjectUrl);
    const targetW = 1240;
    const ratio = subject.height / subject.width;
    const targetH = targetW * ratio;
    const x = 95;
    const y = 360;

    // shadow
    ctx.save();
    ctx.globalAlpha = .55;
    ctx.filter = "blur(18px)";
    ctx.fillStyle = "rgba(0,0,0,.85)";
    ctx.beginPath();
    ctx.ellipse(700, 895, 520, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // reflection
    ctx.save();
    ctx.translate(0, 1030);
    ctx.scale(1, -0.22);
    ctx.globalAlpha = .18;
    ctx.filter = "blur(2px)";
    ctx.drawImage(subject, x, y, targetW, targetH);
    ctx.restore();

    ctx.drawImage(subject, x, y, targetW, targetH);

    // headlight glow vibe
    ctx.save();
    const glow = ctx.createRadialGradient(1160, 660, 0, 1160, 660, 260);
    glow.addColorStop(0, "rgba(255,255,255,.45)");
    glow.addColorStop(.35, "rgba(255,90,20,.20)");
    glow.addColorStop(1, "rgba(255,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(850, 440, 620, 400);
    ctx.restore();

    // Japanese red text
    ctx.save();
    ctx.font = "900 86px Microsoft JhengHei, Arial";
    ctx.fillStyle = "#e60012";
    ctx.shadowColor = "rgba(0,0,0,.95)";
    ctx.shadowBlur = 10;
    ctx.fillText(jpText, 58, 118);
    ctx.restore();

    // slanted white info bar
    ctx.save();
    ctx.translate(58, 158);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(740, 0);
    ctx.lineTo(695, 78);
    ctx.lineTo(-30, 78);
    ctx.closePath();
    ctx.fillStyle = "#f7f7f7";
    ctx.fill();
    ctx.font = "900 46px Microsoft JhengHei, Arial";
    ctx.fillStyle = "#070707";
    ctx.fillText(feature, 28, 53);
    ctx.restore();

    // title metal
    drawMetalText(ctx, headline, 640, 158, 175);

    // price tag
    ctx.save();
    ctx.translate(1045, 295);
    ctx.rotate(-0.045);
    ctx.fillStyle = "#d2a45c";
    ctx.fillRect(0, 0, 372, 216);
    ctx.strokeStyle = "#231100";
    ctx.lineWidth = 7;
    ctx.strokeRect(0, 0, 372, 216);
    ctx.font = "900 48px Microsoft JhengHei";
    ctx.fillStyle = "#111";
    ctx.fillText("真的就賣！", 36, 62);
    ctx.font = "900 106px Arial Black";
    ctx.fillStyle = "#e60012";
    ctx.fillText(price, 34, 165);
    ctx.font = "900 42px Microsoft JhengHei";
    ctx.fillText("萬", 282, 158);
    ctx.restore();

    // bottom bar
    const bar = ctx.createLinearGradient(0, 925, W, 925);
    bar.addColorStop(0, "#230000");
    bar.addColorStop(.22, "#b40000");
    bar.addColorStop(.5, "#151515");
    bar.addColorStop(.78, "#b40000");
    bar.addColorStop(1, "#230000");
    ctx.fillStyle = bar;
    ctx.fillRect(0, 930, W, 160);
    ctx.strokeStyle = "rgba(255,255,255,.25)";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 930, W, 160);

    ctx.save();
    ctx.font = "900 88px Arial Black, Microsoft JhengHei";
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0,0,0,.9)";
    ctx.shadowBlur = 8;
    ctx.fillText(carModel, 64, 1036);
    ctx.restore();

    // logo
    if (urls.logo) {
      const logo = await loadImage(urls.logo);
      ctx.drawImage(logo, 54, 1088, 310, 78);
    } else {
      ctx.font = "900 58px Arial Black";
      ctx.fillStyle = "#fff";
      ctx.fillText("SOFU", 68, 1140);
      ctx.font = "700 26px Arial";
      ctx.fillText("Used Car Dealers", 68, 1172);
    }

    // plate overlay optional
    if (urls.plate) {
      const plate = await loadImage(urls.plate);
      ctx.save();
      ctx.globalAlpha = .95;
      ctx.drawImage(plate, 660, 790, 250, 82);
      ctx.restore();
    }

    setStatus("完成：v6 已自動去背、AI 生成背景、程式合成真中文字與價格。");
  }

  async function oneClick() {
    setLoading(true);
    try {
      setStatus("步驟 1/3：自動去背中...");
      const subject = await removeBg();
      setStatus("步驟 2/3：AI 生成 showroom 背景中...");
      const bg = await generateBackground();
      setStatus("步驟 3/3：Canvas 商業合成中...");
      await compose(bg, subject);
    } catch (error: any) {
      setStatus("生成失敗：" + (error?.message || "未知錯誤"));
    } finally {
      setLoading(false);
    }
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${carModel.replaceAll(" ", "_")}_SOFU_v6.png`;
    a.click();
  }

  return (
    <main className="page">
      <div className="wrap">
        <div className="badge">🚗 SOFU v6 一鍵中古車商業海報生產線</div>
        <h1 className="title">SOFU AI Production Line</h1>
        <p className="sub">v6 流程：原始照片自動去背 → AI 只做 showroom 背景 → 原本人車貼回 → 程式產生繁體中文、價格牌、Logo、車牌。</p>

        <section className="grid">
          <div className="card">
            <h2 className="h"><Upload size={20}/> STEP 1｜上傳素材</h2>
            <div className="notice">必須設定 Vercel 環境變數：OPENAI_API_KEY 和 REMOVE_BG_API_KEY。第一格直接上傳原始人車照，不用手動去背。</div>
            <div className="uploadGrid">
              {items.map((item) => (
                <div key={item.key}>
                  <button className="upload" onClick={() => refs.current[item.key]?.click()}>
                    {urls[item.key] ? <img src={urls[item.key]} alt={item.label}/> : <span>{item.label}{item.required ? " *" : ""}</span>}
                  </button>
                  <input
                    hidden
                    ref={(el) => { refs.current[item.key] = el; }}
                    type="file"
                    accept="image/*"
                    onChange={(e) => pick(item.key, e.target.files?.[0])}
                  />
                </div>
              ))}
            </div>

            <h2 className="h" style={{marginTop:18}}>STEP 2｜內容</h2>
            <Field label="車款" value={carModel} setValue={setCarModel}/>
            <Field label="主標金屬字" value={headline} setValue={setHeadline}/>
            <Field label="左上日文" value={jpText} setValue={setJpText}/>
            <Field label="白色資訊條" value={feature} setValue={setFeature}/>
            <Field label="價格數字" value={price} setValue={setPrice}/>
            <label className="field"><span>背景補充要求</span><textarea value={extra} onChange={(e) => setExtra(e.target.value)}/></label>

            <button className="btn" disabled={loading} onClick={oneClick}><Wand2 size={16}/> {loading ? "生成中..." : "一鍵生成 v6"}</button>
            <button className="btn2" onClick={download}><Download size={16}/> 下載 PNG</button>
          </div>

          <div className="card">
            <h2 className="h"><Layers size={20}/> STEP 3｜4:3 海報輸出</h2>
            <div className="canvasWrap">
              <canvas ref={canvasRef} width={1600} height={1200}/>
            </div>
            <div className="status">{status}</div>
            <div className="preview" style={{marginTop:12}}>
              <Box title="去背結果" url={cutoutUrl}/>
              <Box title="AI 背景" url={backgroundUrl}/>
            </div>
          </div>

          <div className="card">
            <h2 className="h"><ShieldCheck size={20}/> v6 核心規則</h2>
            <div className="rule">✓ 原始人車照不用手動去背</div>
            <div className="rule">✓ AI 不再生成中文字與價格</div>
            <div className="rule">✓ 車與人物由去背主體貼回</div>
            <div className="rule">✓ 背景才交給 AI 生成</div>
            <div className="rule">✓ 4:3 固定輸出</div>
            <p className="small">若 remove.bg 去背不準，下一版可改接 BiRefNet / Replicate，更適合車輛輪廓。</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, value, setValue }: { label: string; value: string; setValue: (v: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
    </label>
  );
}

function Box({ title, url }: { title: string; url?: string }) {
  return (
    <div className="box">
      <div className="boxTitle">{title}</div>
      <div className="boxImg">{url ? <img src={url} alt={title}/> : "尚未產生"}</div>
    </div>
  );
}
