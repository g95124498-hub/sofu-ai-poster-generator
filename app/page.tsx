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
  const [subjectX, setSubjectX] = useState("55");
  const [subjectY, setSubjectY] = useState("300");
  const [subjectW, setSubjectW] = useState("1420");
  const [bottomTitleSize, setBottomTitleSize] = useState("88");

  const fullPrompt = useMemo(() => `【SOFU v6.2 備援 AI 商業生成模式】

當自動去背 API 未設定時，請直接根據「原始人車照」與「參考海報」生成一張 4:3 橫式中古車商業海報。

重要：
- 參考海報只學排版、燈光、黑色工業 showroom、紅橘速度線、金屬字、底部紅黑車名條。
- 不要學參考海報的車型。
- 原始人車照是主體來源，車型、車色、人物姿勢盡量接近原圖。
- 不要出現多餘 icon、功能清單、側欄、小框、無關文案。
- 繁體中文與日文要清楚，不要亂碼。
- 人物不可缺腳、不可半身、不可被車吃掉。
- 車頭要有壓迫感，接近參考圖風格。

固定文字：
左上日文：${jpText}
巨大金屬字：${headline}
白色資訊條：${feature}
價格牌：真的就賣！ ${price}萬
底部車款：${carModel}

補充：
${extra}
`, [carModel, headline, jpText, feature, price, extra]);

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
背景要像參考海報，但保持乾淨，讓程式後製疊上真車、真人、真中文字。
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
    const targetW = Number(subjectW) || 1420;
    const ratio = subject.height / subject.width;
    const targetH = targetW * ratio;
    const x = Number(subjectX) || 55;
    const y = Number(subjectY) || 300;

    // shadow
    ctx.save();
    ctx.globalAlpha = .55;
    ctx.filter = "blur(18px)";
    ctx.fillStyle = "rgba(0,0,0,.85)";
    ctx.beginPath();
    ctx.ellipse(760, 900, 610, 80, 0, 0, Math.PI * 2);
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


    // v6.1 programmed commercial speed lines overlay
    ctx.save();
    for (let i = 0; i < 15; i++) {
      ctx.translate(0, 0);
      ctx.beginPath();
      ctx.moveTo(-120, 250 + i * 22);
      ctx.lineTo(1600, 40 + i * 20);
      ctx.strokeStyle = i % 3 === 0 ? "rgba(255,40,0,.55)" : "rgba(255,115,20,.32)";
      ctx.lineWidth = i % 3 === 0 ? 6 : 3;
      ctx.stroke();
    }
    ctx.restore();

    // v6.1 low smoke and vignette
    ctx.save();
    const smoke = ctx.createRadialGradient(250, 780, 0, 250, 780, 520);
    smoke.addColorStop(0, "rgba(255,255,255,.16)");
    smoke.addColorStop(.45, "rgba(150,150,150,.08)");
    smoke.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = smoke;
    ctx.fillRect(0, 520, W, 420);
    const vignette = ctx.createRadialGradient(W/2, H/2, 250, W/2, H/2, 900);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,.48)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
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
    ctx.font = `900 ${Number(bottomTitleSize) || 88}px Arial Black, Microsoft JhengHei`;
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


  async function generateFullFallback() {
    if (!files.source || !files.style) throw new Error("請先上傳原始人車照與參考海報");
    const formData = new FormData();
    formData.append("source", await compressImage(files.source, 1300, 0.74));
    formData.append("style", await compressImage(files.style, 1200, 0.72));
    if (files.logo) formData.append("logo", await compressImage(files.logo, 800, 0.75));
    formData.append("prompt", fullPrompt);

    const res = await fetch("/api/generate-full", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok || !data.imageUrl) throw new Error(data.error || "AI 備援生成失敗");

    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 1600, H = 1200;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    const img = await loadImage(data.imageUrl);
    ctx.drawImage(img, 0, 0, W, H);

    setBackgroundUrl(data.imageUrl);
    setStatus("完成：目前未使用 remove.bg，自動改用 v6.2 AI 商業生成備援模式。若要更保真人車，之後再設定 REMOVE_BG_API_KEY。");
  }

  async function oneClick() {
    setLoading(true);
    try {
      setStatus("步驟 1/3：嘗試自動去背中...");
      const subject = await removeBg();
      setStatus("步驟 2/3：AI 生成 showroom 背景中...");
      const bg = await generateBackground();
      setStatus("步驟 3/3：Canvas 商業合成中...");
      await compose(bg, subject);
    } catch (error: any) {
      const msg = String(error?.message || "");
      if (msg.includes("REMOVE_BG_API_KEY") || msg.includes("remove.bg") || msg.includes("去背")) {
        setStatus("偵測到 remove.bg 尚未設定，改用 v6.2 備援模式：AI 直接生成完整商業海報...");
        try {
          await generateFullFallback();
        } catch (fallbackError: any) {
          setStatus("備援生成失敗：" + (fallbackError?.message || "未知錯誤"));
        }
      } else {
        setStatus("生成失敗：" + (error?.message || "未知錯誤"));
      }
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
        <div className="badge">🚗 SOFU v6.2 免去背 Key 備援商業海報生產線</div>
        <h1 className="title">SOFU AI Production Line v6.2</h1>
        <p className="sub">v6.2 流程：有 remove.bg key 走自動去背合成；沒有 key 會自動改走 AI 商業生成備援 → AI 只做 showroom 背景 → 原本人車貼回 → 程式產生繁體中文、價格牌、Logo、車牌。</p>

        <section className="grid">
          <div className="card">
            <h2 className="h"><Upload size={20}/> STEP 1｜上傳素材</h2>
            <div className="notice">至少必須設定 OPENAI_API_KEY。REMOVE_BG_API_KEY 可選：有設定會自動去背合成；沒設定會自動改用 AI 商業生成備援。</div>
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

            <h2 className="h" style={{marginTop:18}}>STEP 2.5｜主體位置微調</h2>
            <Field label="人車 X 位置" value={subjectX} setValue={setSubjectX}/>
            <Field label="人車 Y 位置" value={subjectY} setValue={setSubjectY}/>
            <Field label="人車寬度" value={subjectW} setValue={setSubjectW}/>
            <Field label="底部車名字級" value={bottomTitleSize} setValue={setBottomTitleSize}/>

            <label className="field"><span>背景補充要求</span><textarea value={extra} onChange={(e) => setExtra(e.target.value)}/></label>

            <button className="btn" disabled={loading} onClick={oneClick}><Wand2 size={16}/> {loading ? "生成中..." : "一鍵生成 v6.2"}</button>
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
            <div className="rule">✓ 沒有 REMOVE_BG_API_KEY 也可以先生成</div>
            <div className="rule">✓ AI 不再生成中文字與價格</div>
            <div className="rule">✓ 有 remove.bg key 時，車與人物由去背主體貼回</div>
            <div className="rule">✓ 背景才交給 AI 生成</div>
            <div className="rule">✓ 4:3 固定輸出</div>
            <p className="small">v6.2 新增免 remove.bg key 備援：沒有去背 key 也能先用 AI 商業生成模式測試。</p>
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
