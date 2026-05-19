"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, Wand2, Download, ShieldCheck, Image as ImageIcon, FileImage } from "lucide-react";

type UploadKey = "source" | "face" | "style1" | "style2" | "price" | "logo" | "plate";

const uploadItems: { key: UploadKey; label: string; required?: boolean }[] = [
  { key: "source", label: "原始人車照", required: true },
  { key: "face", label: "人臉參考圖" },
  { key: "style1", label: "風格參考圖 1" },
  { key: "style2", label: "風格參考圖 2" },
  { key: "price", label: "價格牌 / 價格圖" },
  { key: "logo", label: "Logo 圖" },
  { key: "plate", label: "車牌圖" }
];

const sizes = [
  { id: "fb43", label: "FB 橫式 4:3 測試版", apiSize: "1024x1024" },
  { id: "square", label: "方形 1:1", apiSize: "1024x1024" },
  { id: "story", label: "直式 9:16", apiSize: "1024x1536" }
];

async function compressImage(file: File, maxSize = 900, quality = 0.68): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const img = document.createElement("img");
  const objectUrl = URL.createObjectURL(file);
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("圖片讀取失敗"));
    img.src = objectUrl;
  });
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 不支援");
  ctx.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(objectUrl);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error("圖片壓縮失敗")), "image/jpeg", quality);
  });
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}

export default function Home() {
  const [files, setFiles] = useState<Partial<Record<UploadKey, File>>>({});
  const [urls, setUrls] = useState<Partial<Record<UploadKey, string>>>({});
  const refs = useRef<Partial<Record<UploadKey, HTMLInputElement | null>>>({});
  const [carModel, setCarModel] = useState("2025 NISSAN X-TRAIL 1.5T");
  const [headline, setHeadline] = useState("新貨到");
  const [jpText, setJpText] = useState("新入荷しました");
  const [featureText, setFeatureText] = useState("超值 / 輕油電 / 現省大價差");
  const [price, setPrice] = useState("75.9");
  const [posterStyle, setPosterStyle] = useState("日本中古車賣場＋黑暗高級工業 showroom＋紅橘速度光");
  const [sizeId, setSizeId] = useState("fb43");
  const [status, setStatus] = useState("請先上傳原始人車照與參考圖");
  const [resultUrl, setResultUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedSize = sizes.find((x) => x.id === sizeId) || sizes[0];

  const prompt = useMemo(() => {
    return `【SOFU v2.2 保真商業合成系統】

最重要：
上傳的「原始人車照」是唯一主體來源。
人、車、持牌手、價格牌遮擋、車輛角度、車型結構、人臉五官、人物比例、車輪鋁圈、車燈、車牌位置，必須以原照為最高優先。

【人臉參考圖】
若有上傳人臉參考圖，必須用來校準人物臉部身份。
禁止 AI 美化、重畫、網紅化、韓系化、改表情、改五官。

【風格參考圖】
只允許參考：
排版、燈光、黑銀紅色彩、3D金屬字、日系紅字、白色斜切資訊條、底部紅色資訊條、showroom 氛圍、速度光。
禁止參考圖中的車型、車身、輪框、人物。

【品牌與素材參考】
若有上傳 Logo、價格圖、車牌圖，必須作為排版與視覺參考。
文字必須清楚、正確、像後製疊字，不要讓 AI 亂寫。

【版面內容】
主標：${headline}
日文：${jpText}
資訊條：${featureText}
價格：${price} 萬
底部車款：${carModel}
風格：${posterStyle}

【嚴格禁止】
禁止重新設計車。
禁止改變車頭、燈具、輪框、鈑件線條。
禁止改變人物與車距離。
禁止把人物移到別的位置。
禁止左右翻轉。
禁止補出原圖沒有的身體。
禁止 AI 假車感、玩具車感、卡通感。

【允許】
只允許增強商業廣告感、背景 showroom、反光地板、速度光、金屬文字、底部資訊條、Logo 品牌區。`;
  }, [headline, jpText, featureText, price, carModel, posterStyle]);

  function onPick(key: UploadKey, file?: File) {
    if (!file) return;
    setFiles((prev) => ({ ...prev, [key]: file }));
    setUrls((prev) => ({ ...prev, [key]: URL.createObjectURL(file) }));
    setStatus(`已上傳：${uploadItems.find((x) => x.key === key)?.label}`);
  }

  async function generate() {
    if (!files.source) {
      setStatus("請先上傳原始人車照");
      return;
    }
    setIsGenerating(true);
    setResultUrl("");
    setStatus("圖片壓縮中，避免 Request Entity Too Large...");

    try {
      const formData = new FormData();
      const entries = Object.entries(files) as [UploadKey, File][];
      let totalKb = 0;
      for (const [key, file] of entries) {
        const compressed = await compressImage(file, key === "source" ? 1100 : 800, key === "source" ? 0.72 : 0.64);
        totalKb += Math.round(compressed.size / 1024);
        formData.append(key, compressed);
      }
      formData.append("prompt", prompt);
      formData.append("size", selectedSize.apiSize);

      setStatus(`生成中：已壓縮 ${entries.length} 張圖，總大小約 ${totalKb} KB。請稍候...`);

      const res = await fetch("/api/generate-poster", { method: "POST", body: formData });
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text.slice(0, 160) || "伺服器沒有回傳 JSON，可能圖片仍太大");
      }
      if (!res.ok || !data.imageUrl) throw new Error(data.error || "生成失敗");
      setResultUrl(data.imageUrl);
      setStatus("生成完成，可以下載海報");
    } catch (err) {
      setStatus("生成失敗：" + (err instanceof Error ? err.message : "未知錯誤") + "\\n建議：先只上傳「原始人車照 + 風格參考圖1 + Logo」三張測試。");
    } finally {
      setIsGenerating(false);
    }
  }

  function download() {
    if (!resultUrl) return setStatus("尚未生成圖片");
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${carModel.replaceAll(" ", "_")}_SOFU_v21.png`;
    a.click();
  }

  return (
    <main className="page">
      <div className="wrap">
        <div className="badge">🚗 SOFU 中古車 AI 商業合成系統 v2.2</div>
        <h1 className="title">SOFU AI Poster Generator</h1>
        <p className="sub">v2.2 修正：延長 API 時間 + 預設 1024 測試，避免 Request Entity Too Large / JSON 解析錯誤。</p>

        <section className="grid">
          <div className="card">
            <h2 className="h"><Upload size={20}/> STEP 1｜上傳素材</h2>
            <div className="notice">建議先測試 3 張：原始人車照 + 風格參考圖 1 + Logo。成功後再慢慢增加其他參考圖。</div>
            <div className="uploadGrid">
              {uploadItems.map((item) => (
                <div key={item.key}>
                  <button className="upload" onClick={() => refs.current[item.key]?.click()}>
                    {urls[item.key] ? <img src={urls[item.key]} alt={item.label} /> : <><FileImage size={32}/><span>{item.label}{item.required ? " *" : ""}</span></>}
                  </button>
                  <input
                    ref={(el) => { refs.current[item.key] = el; }}
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPick(item.key, e.target.files?.[0])}
                  />
                </div>
              ))}
            </div>

            <h2 className="h" style={{marginTop:18}}><ImageIcon size={20}/> STEP 2｜海報內容</h2>
            <Field label="車款" value={carModel} setValue={setCarModel}/>
            <Field label="主標" value={headline} setValue={setHeadline}/>
            <Field label="日文" value={jpText} setValue={setJpText}/>
            <Field label="資訊條" value={featureText} setValue={setFeatureText}/>
            <Field label="價格" value={price} setValue={setPrice}/>
            <label className="field"><span>版型尺寸</span><select value={sizeId} onChange={(e)=>setSizeId(e.target.value)}>{sizes.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
            <label className="field"><span>風格描述</span><textarea value={posterStyle} onChange={(e)=>setPosterStyle(e.target.value)}/></label>
          </div>

          <div className="card">
            <h2 className="h"><Wand2 size={20}/> STEP 3｜生成海報</h2>
            <div className="preview">
              <Box title="原始人車照" url={urls.source}/>
              <Box title="AI 海報結果" url={resultUrl} loading={isGenerating}/>
            </div>
            <div className="status"><b>任務狀態</b><br/>{status}</div>
            <button className="btn" onClick={generate} disabled={isGenerating}>{isGenerating ? "生成中..." : "生成海報"}</button>
            <button className="btn2" onClick={download}><Download size={16}/> 下載海報</button>
            <p className="small">v2.1 是「多參考圖 AI 版」。若要完全不改車與人，下一階段要做「去背主體＋AI背景＋程式疊字」合成版。</p>
          </div>

          <div className="card">
            <h2 className="h"><ShieldCheck size={20}/> 參考圖規則</h2>
            <div className="rule">✓ 原始人車照 = 唯一主體來源</div>
            <div className="rule">✓ 人臉參考 = 只校準身份，不美化</div>
            <div className="rule">✓ 風格參考 = 只學排版與燈光</div>
            <div className="rule">✓ Logo / 價格 / 車牌 = 視覺與排版素材</div>
            <div className="rule">✓ 禁止學參考圖車型</div>
            <h2 className="h" style={{marginTop:18}}>自動 Prompt</h2>
            <div className="prompt">{prompt}</div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({label,value,setValue}:{label:string;value:string;setValue:(v:string)=>void}) {
  return <label className="field"><span>{label}</span><input value={value} onChange={(e)=>setValue(e.target.value)}/></label>;
}

function Box({title,url,loading}:{title:string;url?:string;loading?:boolean}) {
  return <div className="box"><div className="boxTitle">{title}</div><div className="boxImg">{url ? <img src={url} alt={title}/> : loading ? <div className="spin"/> : "尚未上傳 / 生成"}</div></div>;
}
