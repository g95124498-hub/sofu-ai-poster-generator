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
  { id: "fb43", label: "FB 橫式 4:3", apiSize: "1536x1024" },
  { id: "square", label: "方形 1:1", apiSize: "1024x1024" },
  { id: "story", label: "直式 9:16", apiSize: "1024x1536" }
];

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
    return `【SOFU v2 保真商業合成系統】

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
    setStatus("生成中：AI 會讀取原照 + 參考圖，請稍候...");

    try {
      const formData = new FormData();
      Object.entries(files).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });
      formData.append("prompt", prompt);
      formData.append("size", selectedSize.apiSize);

      const res = await fetch("/api/generate-poster", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.imageUrl) throw new Error(data.error || "生成失敗");
      setResultUrl(data.imageUrl);
      setStatus("生成完成，可以下載海報");
    } catch (err) {
      setStatus("生成失敗：" + (err instanceof Error ? err.message : "未知錯誤"));
    } finally {
      setIsGenerating(false);
    }
  }

  function download() {
    if (!resultUrl) return setStatus("尚未生成圖片");
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${carModel.replaceAll(" ", "_")}_SOFU_v2.png`;
    a.click();
  }

  return (
    <main className="page">
      <div className="wrap">
        <div className="badge">🚗 SOFU 中古車 AI 商業合成系統 v2</div>
        <h1 className="title">SOFU AI Poster Generator</h1>
        <p className="sub">新增多參考圖：原始人車照、人臉參考、風格參考、價格圖、Logo、車牌圖。目標是更接近你指定的中古車商業海報流程。</p>

        <section className="grid">
          <div className="card">
            <h2 className="h"><Upload size={20}/> STEP 1｜上傳素材</h2>
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
            <p className="small">提醒：v2 已加入參考圖欄位；若要達到範例那種「100%不改人車」，下一階段要升級成「去背主體＋背景生成＋程式疊字」合成流程。</p>
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
