"use client";

import { useRef, useState } from "react";
import { Download, ImagePlus, Layers, RefreshCw } from "lucide-react";

type Key = "subject" | "style" | "logo";

const items: { key: Key; label: string }[] = [
  { key: "subject", label: "去背人車 PNG（必須）" },
  { key: "style", label: "參考海報（只看風格）" },
  { key: "logo", label: "SOFU Logo PNG" }
];

function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export default function Home() {
  const refs = useRef<Partial<Record<Key, HTMLInputElement | null>>>({});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [urls, setUrls] = useState<Partial<Record<Key, string>>>({});
  const [carModel, setCarModel] = useState("2025 NISSAN X-TRAIL 1.5T");
  const [jpText, setJpText] = useState("新入荷しました");
  const [title, setTitle] = useState("新貨到");
  const [feature, setFeature] = useState("超值 / 輕油電 / 現省大價差");
  const [priceText, setPriceText] = useState("75.9");
  const [status, setStatus] = useState("請先上傳「去背人車 PNG」，輸入價格數字，再按生成。");

  function pick(key: Key, file?: File) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUrls((p) => ({ ...p, [key]: url }));
    setStatus(`已上傳：${items.find((i) => i.key === key)?.label}`);
  }

  function drawMetalText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) {
    ctx.save();
    ctx.font = `900 ${size}px Microsoft JhengHei, Arial`;
    ctx.lineJoin = "round";
    ctx.lineWidth = 14;
    ctx.strokeStyle = "#111";
    ctx.strokeText(text, x + 7, y + 10);
    const grad = ctx.createLinearGradient(0, y - size, 0, y + 20);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(.35, "#d9d9d9");
    grad.addColorStop(.55, "#777777");
    grad.addColorStop(.75, "#f2f2f2");
    grad.addColorStop(1, "#8a8a8a");
    ctx.fillStyle = grad;
    ctx.fillText(text, x, y);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#fff";
    ctx.strokeText(text, x, y);
    ctx.restore();
  }

  async function renderPoster() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!urls.subject) {
      setStatus("請先上傳去背人車 PNG。原圖 JPG 會有背景，v3 要用去背 PNG 才能保真合成。");
      return;
    }

    setStatus("合成中：程式固定版型，不讓 AI 重畫人車...");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1600, H = 1200;
    canvas.width = W;
    canvas.height = H;

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#050505");
    bg.addColorStop(.5, "#111");
    bg.addColorStop(1, "#2a0000");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Wall panels
    ctx.fillStyle = "#171717";
    for (let i = 0; i < 9; i++) {
      ctx.fillRect(120 + i * 180, 170, 150, 560);
      ctx.strokeStyle = "rgba(255,255,255,.06)";
      ctx.strokeRect(120 + i * 180, 170, 150, 560);
    }

    // Red speed lines
    for (let i = 0; i < 16; i++) {
      ctx.save();
      ctx.translate(-120, 200 + i * 24);
      ctx.rotate(-0.13);
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, "rgba(255,0,0,0)");
      g.addColorStop(.25, "rgba(255,0,0,.9)");
      g.addColorStop(.55, "rgba(255,120,30,.75)");
      g.addColorStop(1, "rgba(255,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W + 300, i % 3 === 0 ? 8 : 4);
      ctx.restore();
    }

    // Floor
    const floor = ctx.createLinearGradient(0, 720, 0, H);
    floor.addColorStop(0, "#121212");
    floor.addColorStop(1, "#030303");
    ctx.fillStyle = floor;
    ctx.fillRect(0, 720, W, 480);
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    for (let y = 760; y < H; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y - 80);
      ctx.stroke();
    }

    // Top-left Japanese text
    ctx.save();
    ctx.font = "900 86px Microsoft JhengHei, Arial";
    ctx.fillStyle = "#e60012";
    ctx.shadowColor = "rgba(0,0,0,.9)";
    ctx.shadowBlur = 8;
    ctx.fillText(jpText, 55, 120);
    ctx.restore();

    // White slanted feature bar
    ctx.save();
    ctx.translate(52, 166);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(720, 0);
    ctx.lineTo(680, 84);
    ctx.lineTo(-30, 84);
    ctx.closePath();
    ctx.fillStyle = "#f8f8f8";
    ctx.fill();
    ctx.font = "900 48px Microsoft JhengHei, Arial";
    ctx.fillStyle = "#080808";
    ctx.fillText(feature, 28, 58);
    ctx.restore();

    // Giant metal title
    drawMetalText(ctx, title, 650, 150, 170);

    // Subject PNG
    const subject = await loadImg(urls.subject);
    const subjectW = 1180;
    const ratio = subject.height / subject.width;
    const subjectH = subjectW * ratio;
    ctx.drawImage(subject, 150, 360, subjectW, subjectH);

    // Price tag - v3.0.2 uses typed number only, no PNG upload needed
    ctx.save();
    ctx.translate(1040, 285);
    ctx.rotate(-0.03);
    ctx.fillStyle = "#d6aa63";
    ctx.fillRect(0, 0, 360, 210);
    ctx.strokeStyle = "#271300";
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, 360, 210);
    ctx.font = "900 48px Microsoft JhengHei";
    ctx.fillStyle = "#111";
    ctx.fillText("真的就賣！", 34, 62);
    ctx.font = "900 100px Arial Black";
    ctx.fillStyle = "#e60012";
    ctx.fillText(priceText, 34, 160);
    ctx.font = "900 42px Microsoft JhengHei";
    ctx.fillText("萬", 260, 155);
    ctx.restore();

    // Bottom bar
    const bar = ctx.createLinearGradient(0, 940, W, 940);
    bar.addColorStop(0, "#260000");
    bar.addColorStop(.25, "#9b0000");
    bar.addColorStop(.55, "#151515");
    bar.addColorStop(1, "#9b0000");
    ctx.fillStyle = bar;
    ctx.fillRect(0, 930, W, 160);

    ctx.font = "900 96px Arial Black, Microsoft JhengHei";
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0,0,0,.8)";
    ctx.shadowBlur = 8;
    ctx.fillText(carModel, 70, 1035);
    ctx.shadowBlur = 0;

    // Logo
    if (urls.logo) {
      const logo = await loadImg(urls.logo);
      ctx.drawImage(logo, 60, 1080, 350, 95);
    } else {
      ctx.font = "900 64px Arial Black";
      ctx.fillStyle = "#fff";
      ctx.fillText("SOFU", 72, 1138);
      ctx.font = "700 28px Arial";
      ctx.fillText("Used Car Dealers", 72, 1172);
    }

    // lower small selling points
    ctx.font = "900 34px Microsoft JhengHei";
    ctx.fillStyle = "#fff";
    const pts = ["原車原漆", "實車實價", "專業團隊", "五大保證"];
    pts.forEach((p, i) => ctx.fillText(p, 520 + i * 240, 1148));

    setStatus("完成：v3 固定版型已合成。人車來自去背 PNG，沒有被 AI 重畫。");
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `${carModel.replaceAll(" ", "_")}_SOFU_v3.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  return (
    <main className="page">
      <div className="wrap">
        <div className="badge">🚗 SOFU 中古車 AI 商業合成系統 v3.0.2</div>
        <h1 className="title">SOFU Fixed Template Composer v3.0.2</h1>
        <p className="sub">v3 核心：不再讓 AI 重畫人車。請上傳「已去背的人車 PNG」，系統用固定 4:3 版型合成，中文字、Logo、價格牌都由 Canvas 程式渲染。價格不用上傳 PNG，直接輸入數字。</p>

        <section className="grid">
          <div className="card">
            <h2 className="h"><ImagePlus size={21}/> STEP 1｜上傳素材</h2>
            <div className="note">最重要：第一格必須上傳「去背人車 PNG」。若上傳原始 JPG，背景會一起被貼上，效果會差。</div>
            <div className="uploadGrid">
              {items.map((item) => (
                <div key={item.key}>
                  <button className="upload" onClick={() => refs.current[item.key]?.click()}>
                    {urls[item.key] ? <img src={urls[item.key]} alt={item.label}/> : <span>{item.label}</span>}
                  </button>
                  <input
                    hidden
                    ref={(el)=>{refs.current[item.key]=el}}
                    type="file"
                    accept="image/*"
                    onChange={(e)=>pick(item.key, e.target.files?.[0])}
                  />
                </div>
              ))}
            </div>

            <h2 className="h" style={{marginTop:18}}>STEP 2｜文字內容</h2>
            <Field label="車款" value={carModel} setValue={setCarModel}/>
            <Field label="日文紅字" value={jpText} setValue={setJpText}/>
            <Field label="巨大金屬字" value={title} setValue={setTitle}/>
            <Field label="白色資訊條" value={feature} setValue={setFeature}/>
            <Field label="價格" value={priceText} setValue={setPriceText}/>

            <button className="btn" onClick={renderPoster}><Layers size={16}/> 生成 v3 固定版型</button>
            <button className="btn2" onClick={download}><Download size={16}/> 下載 PNG</button>
            <button className="btn2" onClick={renderPoster}><RefreshCw size={16}/> 重新合成</button>

            <p className="small">下一階段 v3.1 可接 remove.bg / ClipDrop / Replicate BiRefNet，讓原始 JPG 自動變去背 PNG。</p>
          </div>

          <div className="card">
            <h2 className="h">STEP 3｜4:3 海報輸出</h2>
            <div className="canvasWrap">
              <canvas ref={canvasRef} width={1600} height={1200}/>
            </div>
            <div className="note" style={{marginTop:12}}>{status}</div>
            <div className="rules">
              <div className="rule">✓ 人車不經 AI 重畫</div>
              <div className="rule">✓ 4:3 固定版型</div>
              <div className="rule">✓ 繁中程式渲染</div>
              <div className="rule">✓ Logo 可疊圖 / 價格輸入數字</div>
            </div>
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
