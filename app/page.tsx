"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, Wand2, Download, Layers, ShieldCheck, RefreshCw } from "lucide-react";

type Key = "source" | "style" | "logo" | "plate" | "face";
const items: { key: Key; label: string; required?: boolean }[] = [
  { key: "source", label: "原始人車照", required: true },
  { key: "style", label: "參考海報", required: true },
  { key: "face", label: "人臉參考圖" },
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
  const [status, setStatus] = useState("v7 節點式合成：上傳原始人車照 + 參考海報，按一鍵生成。");
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState<string[]>(["v7.1 Debug 面板已啟用。"]);
  const addDebug = (line: string) => setDebug((p) => [`${new Date().toLocaleTimeString()}  ${line}`, ...p].slice(0, 16));

  const [carModel, setCarModel] = useState("2025 NISSAN X-TRAIL 1.5T");
  const [headline, setHeadline] = useState("新貨到");
  const [jpText, setJpText] = useState("新入荷しました");
  const [feature, setFeature] = useState("超值 / 輕油電 / 現省大價差");
  const [price, setPrice] = useState("75.9");
  const [extra, setExtra] = useState("參考圖風格：黑色工業 showroom、紅橘速度光、濕亮反射地板、煙霧、厚重 hammered 金屬字氛圍。背景不要出現車或人物。");

  const [subjectX, setSubjectX] = useState("40");
  const [subjectY, setSubjectY] = useState("305");
  const [subjectW, setSubjectW] = useState("1480");
  const [bottomTitleSize, setBottomTitleSize] = useState("88");
  const [priceX, setPriceX] = useState("1045");
  const [priceY, setPriceY] = useState("285");
  const [titleX, setTitleX] = useState("650");
  const [titleY, setTitleY] = useState("160");
  const [logoX, setLogoX] = useState("54");
  const [logoY, setLogoY] = useState("1088");

  const bgPrompt = useMemo(() => `只生成背景，不要生成車、人、Logo、價格牌、中文字。
請參考上傳的參考海報，生成 4:3 橫式黑色工業 showroom 背景：
- 黑色金屬牆
- 左側斜切機械結構
- 紅橘速度光線
- 濕亮反射地板
- 車展舞台光
- 煙霧與高級商業廣告氣氛
- 畫面中央下方要留給真車主體
- 右上留給價格牌
禁止任何文字、假字、車、人、車牌、logo。
${extra}`, [extra]);

  const fullFallbackPrompt = useMemo(() => `【SOFU v7 備援模式】
如果沒有 REMOVE_BG_API_KEY，請直接生成完整 4:3 中古車商業海報。
原始人車照是主體來源，參考海報只學版型與風格，不學車型。
請避免多餘側欄、icon 清單、小框、無關文案。
文字：
左上：${jpText}
主標：${headline}
資訊條：${feature}
價格牌：真的就賣！ ${price}萬
底部：${carModel}
人物不可缺腳，車型盡量接近原圖。`, [jpText, headline, feature, price, carModel]);

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
    ctx.lineWidth = 20;
    ctx.strokeStyle = "rgba(0,0,0,.98)";
    ctx.strokeText(text, x + 9, y + 13);

    const g = ctx.createLinearGradient(0, y - size, 0, y + 25);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(.16, "#cfcfcf");
    g.addColorStop(.34, "#656565");
    g.addColorStop(.52, "#f7f7f7");
    g.addColorStop(.72, "#888888");
    g.addColorStop(1, "#eeeeee");
    ctx.fillStyle = g;
    ctx.fillText(text, x, y);

    // hammered texture scratches
    ctx.globalCompositeOperation = "multiply";
    ctx.strokeStyle = "rgba(30,30,30,.28)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 55; i++) {
      const sx = x + Math.random() * 520;
      const sy = y - size + Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 28 * Math.random(), sy + 12 * Math.random());
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";

    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,255,.75)";
    ctx.strokeText(text, x, y);
    ctx.restore();
  }

  function drawSpeedLines(ctx: CanvasRenderingContext2D, W: number, H: number) {
    ctx.save();
    for (let i = 0; i < 26; i++) {
      const y = 170 + i * 22;
      const grad = ctx.createLinearGradient(0, y, W, y - 170);
      grad.addColorStop(0, "rgba(255,0,0,0)");
      grad.addColorStop(.2, i % 4 === 0 ? "rgba(255,0,0,.88)" : "rgba(255,80,0,.35)");
      grad.addColorStop(.75, i % 4 === 0 ? "rgba(255,150,20,.75)" : "rgba(255,60,0,.25)");
      grad.addColorStop(1, "rgba(255,0,0,0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = i % 4 === 0 ? 6 : 3;
      ctx.beginPath();
      ctx.moveTo(-160, y + 60);
      ctx.lineTo(W + 200, y - 120);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPriceTag(ctx: CanvasRenderingContext2D) {
    const x = Number(priceX) || 1045;
    const y = Number(priceY) || 285;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.045);
    ctx.shadowColor = "rgba(0,0,0,.55)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = "#d2a45c";
    ctx.fillRect(0, 0, 372, 216);
    ctx.shadowBlur = 0;
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
  }

  async function removeBg() {
    if (!files.source) throw new Error("請先上傳原始人車照");
    const formData = new FormData();
    formData.append("image", await compressImage(files.source, 1500, 0.78));
    addDebug("呼叫 /api/remove-bg...");
    const res = await fetch("/api/remove-bg", { method: "POST", body: formData });
    const data = await res.json();
    addDebug(`remove-bg HTTP ${res.status}`);
    if (!res.ok || !data.imageUrl) throw new Error(data.error || "去背失敗");
    setCutoutUrl(data.imageUrl);
    return data.imageUrl as string;
  }

  async function generateBackground() {
    if (!files.style) throw new Error("請先上傳參考海報");
    const formData = new FormData();
    formData.append("style", await compressImage(files.style, 1200, 0.72));
    formData.append("prompt", bgPrompt);
    addDebug("呼叫 /api/generate-background...");
    const res = await fetch("/api/generate-background", { method: "POST", body: formData });
    const data = await res.json();
    addDebug(`generate-background HTTP ${res.status}，耗時 ${data.elapsedMs || 0}ms`);
    if (!res.ok || !data.imageUrl) throw new Error(data.error || "背景生成失敗");
    setBackgroundUrl(data.imageUrl);
    return data.imageUrl as string;
  }

  async function generateFullFallback() {
    if (!files.source || !files.style) throw new Error("請先上傳原始人車照與參考海報");
    const formData = new FormData();
    formData.append("source", await compressImage(files.source, 1300, 0.74));
    formData.append("style", await compressImage(files.style, 1200, 0.72));
    if (files.logo) formData.append("logo", await compressImage(files.logo, 800, 0.75));
    if (files.face) formData.append("face", await compressImage(files.face, 700, 0.75));
    formData.append("prompt", fullFallbackPrompt);

    addDebug("呼叫 /api/generate-full...");
    const res = await fetch("/api/generate-full", { method: "POST", body: formData });
    const raw = await res.text();
    let data: any;
    try { data = JSON.parse(raw); } catch { throw new Error("API 回傳不是 JSON：" + raw.slice(0, 180)); }
    addDebug(`generate-full HTTP ${res.status}，耗時 ${data.elapsedMs || 0}ms`);
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
    setStatus("完成：v7 備援模式已生成。若要車型/人臉更穩，請設定 REMOVE_BG_API_KEY 後使用主體鎖定合成。");
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

    // vignette and top dark shield
    const topShade = ctx.createLinearGradient(0, 0, 0, 370);
    topShade.addColorStop(0, "rgba(0,0,0,.72)");
    topShade.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = topShade;
    ctx.fillRect(0, 0, W, 370);

    drawSpeedLines(ctx, W, H);

    const subject = await loadImage(subjectUrl);
    const targetW = Number(subjectW) || 1480;
    const ratio = subject.height / subject.width;
    const targetH = targetW * ratio;
    const x = Number(subjectX) || 40;
    const y = Number(subjectY) || 305;

    // contact shadow
    ctx.save();
    ctx.globalAlpha = .62;
    ctx.filter = "blur(22px)";
    ctx.fillStyle = "rgba(0,0,0,.92)";
    ctx.beginPath();
    ctx.ellipse(790, 910, 660, 92, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // floor reflection
    ctx.save();
    ctx.translate(0, 1035);
    ctx.scale(1, -0.24);
    ctx.globalAlpha = .20;
    ctx.filter = "blur(3px)";
    ctx.drawImage(subject, x, y, targetW, targetH);
    ctx.restore();

    // true subject
    ctx.drawImage(subject, x, y, targetW, targetH);

    // foreground smoke
    ctx.save();
    const smoke = ctx.createRadialGradient(230, 790, 0, 230, 790, 520);
    smoke.addColorStop(0, "rgba(255,255,255,.18)");
    smoke.addColorStop(.46, "rgba(180,180,180,.08)");
    smoke.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = smoke;
    ctx.fillRect(0, 520, W, 420);
    ctx.restore();

    // headlight glow
    ctx.save();
    const glow = ctx.createRadialGradient(1120, 660, 0, 1120, 660, 280);
    glow.addColorStop(0, "rgba(255,255,255,.45)");
    glow.addColorStop(.36, "rgba(255,100,20,.18)");
    glow.addColorStop(1, "rgba(255,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(820, 430, 640, 420);
    ctx.restore();

    // Japanese red text
    ctx.save();
    ctx.font = "900 86px Microsoft JhengHei, Arial";
    ctx.fillStyle = "#e60012";
    ctx.shadowColor = "rgba(0,0,0,.95)";
    ctx.shadowBlur = 10;
    ctx.fillText(jpText, 58, 118);
    ctx.restore();

    // white info bar
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

    drawMetalText(ctx, headline, Number(titleX) || 650, Number(titleY) || 160, 175);
    drawPriceTag(ctx);

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

    if (urls.logo) {
      const logo = await loadImage(urls.logo);
      ctx.drawImage(logo, Number(logoX) || 54, Number(logoY) || 1088, 310, 78);
    } else {
      ctx.font = "900 58px Arial Black";
      ctx.fillStyle = "#fff";
      ctx.fillText("SOFU", 68, 1140);
      ctx.font = "700 26px Arial";
      ctx.fillText("Used Car Dealers", 68, 1172);
    }

    if (urls.plate) {
      const plate = await loadImage(urls.plate);
      ctx.save();
      ctx.globalAlpha = .96;
      ctx.drawImage(plate, 660, 790, 250, 82);
      ctx.restore();
    }

    setStatus("完成：v7 節點式合成。真車真人貼回、AI 背景、程式真字、價格牌與反射陰影。");
  }

  async function oneClick() {
    setLoading(true);
    try {
      setStatus("NODE 1/5：嘗試自動去背主體鎖定...");
      const subject = await removeBg();
      setStatus("NODE 2/5：AI 生成純背景...");
      const bg = await generateBackground();
      setStatus("NODE 3/5：合成真實人車...");
      await compose(bg, subject);
    } catch (error: any) {
      const msg = String(error?.message || "");
      if (msg.includes("REMOVE_BG_API_KEY") || msg.includes("remove.bg") || msg.includes("去背")) {
        setStatus("偵測到 remove.bg 尚未設定，改用 v7 備援模式：AI 直接生成完整商業海報...");
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

  async function recompositeOnly() {
    if (!backgroundUrl || !cutoutUrl) {
      setStatus("需要先產生 AI 背景與去背結果，才能只重新合成。");
      return;
    }
    await compose(backgroundUrl, cutoutUrl);
  }


  async function checkHealth() {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      addDebug(`Health：OPENAI_API_KEY=${data.openaiKey ? "OK" : "未設定"}，REMOVE_BG_API_KEY=${data.removeBgKey ? "OK" : "未設定"}`);
      setStatus(`API 檢查：OPENAI_API_KEY=${data.openaiKey ? "已設定" : "未設定"}；REMOVE_BG_API_KEY=${data.removeBgKey ? "已設定" : "未設定"}`);
    } catch (e: any) {
      addDebug("Health 檢查失敗：" + (e?.message || "未知錯誤"));
    }
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${carModel.replaceAll(" ", "_")}_SOFU_v7.png`;
    a.click();
  }

  return (
    <main className="page">
      <div className="wrap">
        <div className="badge">🚗 SOFU v7.1 Debug 節點式中古車商業視覺引擎</div>
        <h1 className="title">SOFU Layered Poster Engine v7.1</h1>
        <p className="sub">v7 核心：AI 不再一張圖打天下。AI 只做背景，真實人車貼回，中文字、價格、Logo、車牌由程式合成。</p>

        <section className="grid">
          <div className="card">
            <h2 className="h"><Upload size={20}/> STEP 1｜上傳素材</h2>
            <div className="notice">OPENAI_API_KEY 必要。REMOVE_BG_API_KEY 可選：有設定＝真實主體鎖定；沒設定＝AI 備援生成。</div>
            <div className="uploadGrid">
              {items.map((item) => (
                <div key={item.key}>
                  <button className="upload" onClick={() => refs.current[item.key]?.click()}>
                    {urls[item.key] ? <img src={urls[item.key]} alt={item.label}/> : <span>{item.label}{item.required ? " *" : ""}</span>}
                  </button>
                  <input hidden ref={(el) => { refs.current[item.key] = el; }} type="file" accept="image/*" onChange={(e) => pick(item.key, e.target.files?.[0])}/>
                </div>
              ))}
            </div>

            <h2 className="h" style={{marginTop:18}}>STEP 2｜內容</h2>
            <Field label="車款" value={carModel} setValue={setCarModel}/>
            <Field label="主標金屬字" value={headline} setValue={setHeadline}/>
            <Field label="左上日文" value={jpText} setValue={setJpText}/>
            <Field label="白色資訊條" value={feature} setValue={setFeature}/>
            <Field label="價格數字" value={price} setValue={setPrice}/>

            <h2 className="h" style={{marginTop:18}}>STEP 2.5｜版型微調</h2>
            <Field label="人車 X" value={subjectX} setValue={setSubjectX}/>
            <Field label="人車 Y" value={subjectY} setValue={setSubjectY}/>
            <Field label="人車寬度" value={subjectW} setValue={setSubjectW}/>
            <Field label="底部車名字級" value={bottomTitleSize} setValue={setBottomTitleSize}/>
            <Field label="價格牌 X" value={priceX} setValue={setPriceX}/>
            <Field label="價格牌 Y" value={priceY} setValue={setPriceY}/>
            <Field label="金屬字 X" value={titleX} setValue={setTitleX}/>
            <Field label="金屬字 Y" value={titleY} setValue={setTitleY}/>
            <Field label="Logo X" value={logoX} setValue={setLogoX}/>
            <Field label="Logo Y" value={logoY} setValue={setLogoY}/>

            <label className="field"><span>背景補充要求</span><textarea value={extra} onChange={(e) => setExtra(e.target.value)}/></label>

            <button className="btn" disabled={loading} onClick={oneClick}><Wand2 size={16}/> {loading ? "生成中..." : "一鍵生成 v7.1"}</button>
            <button className="btn2" onClick={checkHealth}>檢查 API Key 狀態</button>
            <button className="btn2" onClick={recompositeOnly}><RefreshCw size={16}/> 只重新合成位置</button>
            <button className="btn2" onClick={download}><Download size={16}/> 下載 PNG</button>
          </div>

          <div className="card">
            <h2 className="h"><Layers size={20}/> STEP 3｜4:3 海報輸出</h2>
            <div className="canvasWrap">
              <canvas ref={canvasRef} width={1600} height={1200}/>
            </div>
            <div className="status">{status}</div>
            <div className="preview" style={{marginTop:12}}>
              <Box title="去背主體" url={cutoutUrl}/>
              <Box title="AI 純背景 / 備援圖" url={backgroundUrl}/>
            </div>
          </div>

          <div className="card">
            <h2 className="h"><ShieldCheck size={20}/> v7 節點規則</h2>
            <div className="rule">✓ NODE 1：原始人車主體</div>
            <div className="rule">✓ NODE 2：自動去背主體鎖定</div>
            <div className="rule">✓ NODE 3：AI 只生成背景</div>
            <div className="rule">✓ NODE 4：Canvas 真字與價格牌</div>
            <div className="rule">✓ NODE 5：陰影、反射、速度線後製</div>
            <h2 className="h" style={{marginTop:18}}>Debug 面板</h2>
            <div className="status" style={{fontSize:12, maxHeight:260, overflow:"auto"}}>
              {debug.map((line, i) => <div key={i}>{line}</div>)}
            </div>
            <p className="small">有 remove.bg key 時才會真正保留真人車。沒有 key 時會進 AI 備援模式，方便先測試流程。</p>
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
