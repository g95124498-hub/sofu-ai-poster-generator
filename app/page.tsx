"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, Wand2, Download, RefreshCw } from "lucide-react";

type Key = "source" | "style" | "cutout" | "logo" | "plate";
const uploadItems: { key: Key; label: string; required?: boolean }[] = [
  { key: "source", label: "原始人車照", required: true },
  { key: "style", label: "參考海報", required: true },
  { key: "cutout", label: "去背人車 PNG" },
  { key: "logo", label: "Logo PNG" },
  { key: "plate", label: "車牌 PNG" }
];

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function compressImage(file: File, maxSize = 1400, quality = 0.76): Promise<File> {
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
  const inputRefs = useRef<Partial<Record<Key, HTMLInputElement | null>>>({});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [files, setFiles] = useState<Partial<Record<Key, File>>>({});
  const [urls, setUrls] = useState<Partial<Record<Key, string>>>({});
  const [cutoutUrl, setCutoutUrl] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("請上傳原始人車照與參考海報，按一鍵生成。");

  const [carModel, setCarModel] = useState("2025 NISSAN X-TRAIL 1.5T");
  const [headline, setHeadline] = useState("新貨到");
  const [jpText, setJpText] = useState("新入荷しました");
  const [feature, setFeature] = useState("超值 / 輕油電 / 現省大價差");
  const [price, setPrice] = useState("75.9");
  const [extra, setExtra] = useState("黑色工業 showroom、紅橘速度線、濕亮反射地板、煙霧、金屬牆。背景不要出現任何車、人、中文字、價格牌、Logo。");

  const [subjectX, setSubjectX] = useState("-260");
  const [subjectY, setSubjectY] = useState("220");
  const [subjectW, setSubjectW] = useState("2100");
  const [headlineX, setHeadlineX] = useState("610");
  const [headlineY, setHeadlineY] = useState("178");
  const [priceX, setPriceX] = useState("990");
  const [priceY, setPriceY] = useState("225");

  const [useLocalBg, setUseLocalBg] = useState(false);
  const [taiwanCtrMode, setTaiwanCtrMode] = useState(true);
  const [showroomIntensity, setShowroomIntensity] = useState("1.35");
  const [floorReflection, setFloorReflection] = useState("0.42");
  const [aoStrength, setAoStrength] = useState("1.55");

  const bgPrompt = useMemo(() => `請只生成空的車商 showroom 背景，不要生成車、人、中文字、價格、Logo、車牌。
風格：台灣中古車高質感 FB 廣告、黑色工業 showroom、紅橘速度光、濕亮反射地板、煙霧、金屬牆、景深。
畫面比例 4:3，中央下方要留給真實人車主體，右上留給價格牌，上方留給金屬大字。
${extra}`, [extra]);

  function pick(key: Key, file?: File) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFiles((p) => ({ ...p, [key]: file }));
    setUrls((p) => ({ ...p, [key]: url }));
    setStatus(`已上傳：${uploadItems.find((x) => x.key === key)?.label}`);
  }

  
  async function getSubject(): Promise<string> {
    // 優先使用使用者上傳的去背 PNG，這是正式商用最穩流程。
    if (urls.cutout) {
      setCutoutUrl(urls.cutout);
      return urls.cutout;
    }

    if (!files.source || !urls.source) {
      throw new Error("請先上傳原始人車照。");
    }

    // 嘗試 remove.bg；失敗時不再卡住，直接進入原圖測試模式。
    try {
      const form = new FormData();
      form.append("image", await compressImage(files.source, 1600, 0.8));
      const res = await fetch("/api/remove-bg", { method: "POST", body: form });
      const data = await res.json();

      if (res.ok && data.imageUrl) {
        setCutoutUrl(data.imageUrl);
        return data.imageUrl;
      }

      setStatus("提醒：沒有可用的 remove.bg 去背。已切換原圖測試模式；正式效果建議上傳『去背人車 PNG』。");
      setCutoutUrl(urls.source);
      return urls.source;
    } catch (err) {
      setStatus("提醒：自動去背失敗。已切換原圖測試模式；正式效果建議上傳『去背人車 PNG』。");
      setCutoutUrl(urls.source);
      return urls.source;
    }
  }

  async function generateBackground(): Promise<string> {
    if (useLocalBg) {
      const local = makeLocalBackground();
      setBackgroundUrl(local);
      return local;
    }
    if (!files.style) throw new Error("請先上傳參考海報，或開啟離線背景備援。");
    const form = new FormData();
    form.append("style", await compressImage(files.style, 1200, 0.72));
    form.append("prompt", bgPrompt);
    const res = await fetch("/api/generate-background", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok || !data.imageUrl) {
      const local = makeLocalBackground();
      setBackgroundUrl(local);
      setStatus("AI背景失敗，已自動切換 v22 離線 showroom 背景。原因：" + (data.error || "背景生成失敗"));
      return local;
    }
    setBackgroundUrl(data.imageUrl);
    return data.imageUrl;
  }

  function drawSpeedLines(ctx: CanvasRenderingContext2D, W: number) {
    ctx.save();
    for (let i = 0; i < 34; i++) {
      const y = 140 + i * 23;
      const grad = ctx.createLinearGradient(-120, y, W + 120, y - 180);
      grad.addColorStop(0, "rgba(255,0,0,0)");
      grad.addColorStop(.22, i % 4 === 0 ? "rgba(255,20,0,.95)" : "rgba(255,100,0,.34)");
      grad.addColorStop(.7, i % 4 === 0 ? "rgba(255,165,30,.70)" : "rgba(255,50,0,.22)");
      grad.addColorStop(1, "rgba(255,0,0,0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = taiwanCtrMode ? (i % 4 === 0 ? 13 : 5) : (i % 4 === 0 ? 7 : 3);
      ctx.beginPath(); ctx.moveTo(-180, y + 78); ctx.lineTo(W + 220, y - 150); ctx.stroke();
    }
    ctx.restore();
  }

  function drawMetalText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
    ctx.save();
    ctx.font = taiwanCtrMode ? "900 190px Microsoft JhengHei, Arial Black" : "900 168px Microsoft JhengHei, Arial Black";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(0,0,0,.9)"; ctx.shadowBlur = taiwanCtrMode ? 44 : 18; ctx.shadowOffsetX = 16; ctx.shadowOffsetY = 18;
    ctx.lineWidth = taiwanCtrMode ? 36 : 22; ctx.strokeStyle = "#050505"; ctx.strokeText(text, x + 10, y + 12);
    const g = ctx.createLinearGradient(0, y - 160, 0, y + 35);
    g.addColorStop(0, "#fff"); g.addColorStop(.18, "#b9b9b9"); g.addColorStop(.34, "#3f3f3f"); g.addColorStop(.52, "#fdfdfd"); g.addColorStop(.72, "#777"); g.addColorStop(1, "#f1f1f1");
    ctx.shadowBlur = 0; ctx.fillStyle = g; ctx.fillText(text, x, y);
    ctx.lineWidth = 4; ctx.strokeStyle = "rgba(255,255,255,.88)"; ctx.strokeText(text, x, y);
    // hammered scratches
    ctx.globalCompositeOperation = "multiply"; ctx.strokeStyle = "rgba(25,25,25,.28)"; ctx.lineWidth = 1;
    for (let i=0;i<90;i++){ const sx=x+Math.random()*560; const sy=y-145+Math.random()*150; ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx+Math.random()*38, sy+Math.random()*14); ctx.stroke(); }
    ctx.restore();
  }

  function drawPriceTag(ctx: CanvasRenderingContext2D) {
    const x = Number(priceX) || 990, y = Number(priceY) || 225;
    const w = taiwanCtrMode ? 485 : 378, h = taiwanCtrMode ? 280 : 220;
    ctx.save(); ctx.translate(x, y); ctx.rotate(taiwanCtrMode ? -0.08 : -0.045);
    ctx.shadowColor = "rgba(0,0,0,.82)"; ctx.shadowBlur = 28; ctx.shadowOffsetX = 16; ctx.shadowOffsetY = 18;
    const bg = ctx.createLinearGradient(0,0,w,h); bg.addColorStop(0,"#ffe46e"); bg.addColorStop(.45,"#d49d32"); bg.addColorStop(1,"#8f4f00");
    ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);
    ctx.shadowBlur = 0; ctx.strokeStyle = "#150700"; ctx.lineWidth = taiwanCtrMode ? 13 : 8; ctx.strokeRect(0,0,w,h);
    ctx.globalAlpha = .92; ctx.fillStyle = "#ffd44c"; ctx.fillRect(18,16,w-36,h-32); ctx.globalAlpha = 1;
    ctx.font = taiwanCtrMode ? "900 64px Microsoft JhengHei" : "900 50px Microsoft JhengHei"; ctx.fillStyle = "#111"; ctx.fillText("真的就賣！", 34, taiwanCtrMode ? 76 : 64);
    ctx.font = taiwanCtrMode ? "900 154px Arial Black" : "900 106px Arial Black"; ctx.lineWidth = 9; ctx.strokeStyle = "#fff"; ctx.strokeText(price, 26, taiwanCtrMode ? 214 : 166); ctx.fillStyle = "#e60012"; ctx.fillText(price, 26, taiwanCtrMode ? 214 : 166);
    ctx.font = taiwanCtrMode ? "900 52px Microsoft JhengHei" : "900 42px Microsoft JhengHei"; ctx.fillStyle = "#e60012"; ctx.fillText("萬", taiwanCtrMode ? 358 : 286, taiwanCtrMode ? 202 : 160);
    ctx.restore();
  }

  async function compose(bgUrl: string, subjectUrl: string) {
    const canvas = canvasRef.current; if (!canvas) return;
    const W = 1600, H = 1200; canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    const bg = await loadImage(bgUrl); ctx.drawImage(bg, 0, 0, W, H);

    const topShade = ctx.createLinearGradient(0, 0, 0, 360); topShade.addColorStop(0, "rgba(0,0,0,.78)"); topShade.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = topShade; ctx.fillRect(0,0,W,360);
    drawSpeedLines(ctx, W);

    const subject = await loadImage(subjectUrl);
    let targetW = Number(subjectW) || 2100; if (taiwanCtrMode) targetW = Math.max(targetW, 2100);
    const ratio = subject.height / subject.width; const targetH = targetW * ratio;
    let x = Number(subjectX) || -260; if (taiwanCtrMode) x = -260;
    const y = Number(subjectY) || 220;

    // heavy AO grounding
    ctx.save(); ctx.globalAlpha = Math.min(.92, Number(aoStrength) * .56); ctx.filter = "blur(26px)"; ctx.fillStyle = "rgba(0,0,0,.96)"; ctx.beginPath(); ctx.ellipse(780, 980, taiwanCtrMode ? 1030 : 700, taiwanCtrMode ? 185 : 95, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();

    // wet floor reflection
    ctx.save(); ctx.translate(0, 1065); ctx.scale(1, -0.30); ctx.globalAlpha = Math.min(0.52, Number(floorReflection) || .42); ctx.filter = "blur(4px)"; ctx.drawImage(subject, x, y, targetW, targetH); ctx.restore();

    ctx.drawImage(subject, x, y, targetW, targetH);

    // red bounce/rim integration
    ctx.save(); ctx.globalCompositeOperation = "screen"; const rim = ctx.createLinearGradient(0, 390, 1500, 860); rim.addColorStop(0, "rgba(255,30,0,0)"); rim.addColorStop(.55, `rgba(255,80,20,${.19 * Number(showroomIntensity)})`); rim.addColorStop(1, "rgba(255,255,255,.18)"); ctx.fillStyle = rim; ctx.fillRect(0,360,W,560); ctx.restore();

    // headlight/bloom
    ctx.save(); ctx.globalCompositeOperation = "screen"; const glow = ctx.createRadialGradient(1140,650,0,1140,650,390); glow.addColorStop(0,"rgba(255,255,255,.50)"); glow.addColorStop(.34,"rgba(255,110,20,.24)"); glow.addColorStop(1,"rgba(255,0,0,0)"); ctx.fillStyle = glow; ctx.fillRect(740,400,760,500); ctx.restore();

    // foreground haze wrap
    ctx.save(); ctx.globalCompositeOperation = "screen";
    for (let i=0;i<4;i++){ const haze=ctx.createRadialGradient(180+i*360,790+i*28,0,180+i*360,790+i*28,430); haze.addColorStop(0,`rgba(255,255,255,${.08*Number(showroomIntensity)})`); haze.addColorStop(.55,`rgba(255,120,40,${.035*Number(showroomIntensity)})`); haze.addColorStop(1,"rgba(255,255,255,0)"); ctx.fillStyle=haze; ctx.fillRect(0,520,W,450); }
    ctx.restore();

    // top texts and bars
    ctx.save(); ctx.font = "900 84px Microsoft JhengHei, Arial Black"; ctx.fillStyle = "#e60012"; ctx.shadowColor = "rgba(0,0,0,.95)"; ctx.shadowBlur = 12; ctx.fillText(jpText, 58, 118); ctx.restore();
    ctx.save(); ctx.translate(58,158); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(755,0); ctx.lineTo(708,80); ctx.lineTo(-30,80); ctx.closePath(); ctx.fillStyle = "#f7f7f7"; ctx.fill(); ctx.font = "900 45px Microsoft JhengHei, Arial"; ctx.fillStyle = "#070707"; ctx.fillText(feature, 26, 54); ctx.restore();

    drawMetalText(ctx, headline, Number(headlineX) || 610, Number(headlineY) || 178);
    drawPriceTag(ctx);

    const barY = taiwanCtrMode ? 1000 : 930; const barH = taiwanCtrMode ? 122 : 160;
    const bar = ctx.createLinearGradient(0, barY, W, barY); bar.addColorStop(0,"#210000"); bar.addColorStop(.25,"#b30000"); bar.addColorStop(.5,"#111"); bar.addColorStop(.78,"#b30000"); bar.addColorStop(1,"#210000");
    ctx.fillStyle = bar; ctx.fillRect(0, barY, W, barH); ctx.strokeStyle = "rgba(255,255,255,.26)"; ctx.lineWidth = 3; ctx.strokeRect(0, barY, W, barH);
    ctx.font = "900 82px Arial Black, Microsoft JhengHei"; ctx.fillStyle = "#fff"; ctx.shadowColor = "rgba(0,0,0,.95)"; ctx.shadowBlur = 9; ctx.fillText(carModel, 60, taiwanCtrMode ? 1082 : 1036);
    if (urls.logo) { const logo = await loadImage(urls.logo); ctx.drawImage(logo, 56, taiwanCtrMode ? 1102 : 1090, 310, 78); }
    else { ctx.shadowBlur = 0; ctx.font = "900 58px Arial Black"; ctx.fillStyle = "#fff"; ctx.fillText("SOFU", 68, 1152); ctx.font = "700 25px Arial"; ctx.fillText("Used Car Dealers", 68, 1180); }
    if (urls.plate) { const plate = await loadImage(urls.plate); ctx.drawImage(plate, 650, 790, 250, 82); }
    setStatus("v22 完成：台灣CTR模式、車體放大、強AO、濕地板反射、暴力價格牌已套用。");
  }

  async function oneClick() {
    setLoading(true);
    try { setStatus("1/3 取得真實人車主體..."); const subject = await getSubject(); setStatus("2/3 生成 showroom 背景..."); const bg = await generateBackground(); setStatus("3/3 v22 台灣CTR合成..."); await compose(bg, subject); }
    catch (err: any) { setStatus("失敗：" + (err?.message || "未知錯誤")); }
    finally { setLoading(false); }
  }

  async function recompositeOnly() { if (!backgroundUrl || !cutoutUrl) { setStatus("需要先生成一次，才可以只重新合成。"); return; } await compose(backgroundUrl, cutoutUrl); }
  async function checkApi() { try { const res = await fetch("/api/health"); const data = await res.json(); setStatus(`API 狀態：\nOPENAI_API_KEY：${data.openaiKey ? "已設定" : "未設定"}\nREMOVE_BG_API_KEY：${data.removeBgKey ? "已設定" : "未設定"}\n版本：${data.version}`); } catch(e:any) { setStatus("API 檢查失敗：" + (e?.message || "未知錯誤")); } }
  function downloadJpg() { const canvas = canvasRef.current; if (!canvas) return; const a = document.createElement("a"); a.href = canvas.toDataURL("image/jpeg", 0.92); a.download = `${carModel.replaceAll(" ", "_")}_SOFU_FB.jpg`; a.click(); }
  function download() { const canvas = canvasRef.current; if (!canvas) return; const a = document.createElement("a"); a.href = canvas.toDataURL("image/png"); a.download = `${carModel.replaceAll(" ", "_")}_SOFU.png`; a.click(); }

  return (
    <main className="page"><div className="wrap">
      <div className="badge">SOFU AI Poster Generator Real v22 Fixed</div>
      <h1 className="title">首福汽車 AI 商業海報網頁軟體 v22</h1>
      <p className="sub">台灣中古車高 CTR 模式：車體壓迫構圖、強 AO 接地、濕地板反射、暴力價格牌、重金屬字。</p>
      <section className="grid">
        <div className="card"><h2 className="h"><Upload size={20}/> 上傳素材</h2>
          <div className="notice">必要：原始人車照、參考海報。建議：去背人車 PNG。沒有去背 PNG 時會用 REMOVE_BG_API_KEY 自動去背。</div>
          <div className="uploadGrid">{uploadItems.map((item)=>(<div key={item.key}><button className="upload" onClick={()=>inputRefs.current[item.key]?.click()}>{urls[item.key]?<img src={urls[item.key]} alt={item.label}/>:<span>{item.label}{item.required?" *":""}</span>}</button><input hidden ref={(el)=>{inputRefs.current[item.key]=el;}} type="file" accept="image/*" onChange={(e)=>pick(item.key,e.target.files?.[0])}/></div>))}</div>
          <h2 className="h" style={{marginTop:18}}>文字內容</h2>
          <Field label="車款" value={carModel} setValue={setCarModel}/><Field label="金屬大字" value={headline} setValue={setHeadline}/><Field label="左上日文" value={jpText} setValue={setJpText}/><Field label="白色資訊條" value={feature} setValue={setFeature}/><Field label="價格" value={price} setValue={setPrice}/>
          <h2 className="h" style={{marginTop:18}}>v22 位置與強度</h2>
          <Field label="人車 X" value={subjectX} setValue={setSubjectX}/><Field label="人車 Y" value={subjectY} setValue={setSubjectY}/><Field label="人車寬度" value={subjectW} setValue={setSubjectW}/><Field label="金屬字 X" value={headlineX} setValue={setHeadlineX}/><Field label="金屬字 Y" value={headlineY} setValue={setHeadlineY}/><Field label="價格牌 X" value={priceX} setValue={setPriceX}/><Field label="價格牌 Y" value={priceY} setValue={setPriceY}/>
          <label className="field"><span>台灣CTR</span><input type="checkbox" checked={taiwanCtrMode} onChange={(e)=>setTaiwanCtrMode(e.target.checked)} /></label>
          <label className="field"><span>離線背景</span><input type="checkbox" checked={useLocalBg} onChange={(e)=>setUseLocalBg(e.target.checked)} /></label>
          <Field label="showroom強度" value={showroomIntensity} setValue={setShowroomIntensity}/><Field label="地板反射" value={floorReflection} setValue={setFloorReflection}/><Field label="AO重量" value={aoStrength} setValue={setAoStrength}/>
          <label className="field"><span>背景要求</span><textarea value={extra} onChange={(e)=>setExtra(e.target.value)} /></label>
          <button className="btn2" onClick={checkApi}>檢查 API 狀態</button><button className="btn" onClick={oneClick} disabled={loading}><Wand2 size={16}/> {loading?"生成中...":"一鍵生成海報"}</button><button className="btn2" onClick={recompositeOnly}><RefreshCw size={16}/> 只重新合成位置</button><button className="btn2" onClick={download}><Download size={16}/> 下載 PNG 高畫質</button><button className="btn2" onClick={downloadJpg}><Download size={16}/> 下載 JPG 投放版</button>
        </div>
        <div className="card"><h2 className="h">4:3 海報輸出</h2><div className="canvasWrap"><canvas ref={canvasRef} width={1600} height={1200}/></div><div className="status">{status}</div><div className="preview"><Box title="去背主體" url={cutoutUrl}/><Box title="AI/離線背景" url={backgroundUrl}/></div><p className="small">OPENAI_API_KEY 必要；REMOVE_BG_API_KEY 可選。沒有 remove.bg key 時，請上傳去背人車 PNG。</p></div>
      </section>
    </div></main>
  );
}

function Field({ label, value, setValue }: { label: string; value: string; setValue: (v: string) => void }) { return <label className="field"><span>{label}</span><input value={value} onChange={(e)=>setValue(e.target.value)} /></label>; }
function Box({ title, url }: { title: string; url?: string }) { return <div className="box"><div className="boxTitle">{title}</div><div className="boxImg">{url?<img src={url} alt={title}/>:"尚未產生"}</div></div>; }
