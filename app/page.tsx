"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, Wand2, Download, ShieldCheck, Car, Settings2, FileImage } from "lucide-react";

const TEMPLATE_OPTIONS = ["新貨到", "本月限定", "全網最強", "限時下殺", "稀有好貨", "直降出清"];
const JP_OPTIONS = ["新入荷しました", "特選中古車", "限定入庫", "超人気車種"];

const SIZE_OPTIONS = [
  { id: "fb43", name: "FB 橫式 4:3", size: "1600 × 1200", apiSize: "1536x1024" },
  { id: "square", name: "IG / FB 方形", size: "1080 × 1080", apiSize: "1024x1024" },
  { id: "story", name: "限動直式 9:16", size: "1080 × 1920", apiSize: "1024x1536" }
];

const VEHICLE_PRESETS = [
  { carModel: "2025 NISSAN X-TRAIL 1.5T", headline: "新貨到", featureText: "頂規四傳 / 輕油電 / 現省大價差", price: "75.9" },
  { carModel: "2024 MAZDA CX-60 2.5L", headline: "稀有好貨", featureText: "縱置後驅 / 耀雪白 / 高級質感", price: "149.9" },
  { carModel: "2024 MG ZS 1.5L", headline: "本月限定", featureText: "小休旅 / 好入手 / 高CP值", price: "52.9" },
  { carModel: "2021 TOYOTA SIENTA 1.8L", headline: "限時下殺", featureText: "小型RV / 家庭首選 / 空間實用", price: "43.9" },
  { carModel: "2022 INFINITI QX55 2.0T", headline: "全網最強", featureText: "獵跑休旅 / 紅色跑格 / 豪華配備", price: "139.9" }
];

function getSizeById(id: string) {
  return SIZE_OPTIONS.find((item) => item.id === id) || SIZE_OPTIONS[0];
}

function buildPrompt({
  activeSize,
  headline,
  jpText,
  featureText,
  price,
  carModel,
  brand,
  strength
}: {
  activeSize: string;
  headline: string;
  jpText: string;
  featureText: string;
  price: string;
  carModel: string;
  brand: string;
  strength: string;
}) {
  const size = getSizeById(activeSize);
  return `製作一張超高質感台灣中古車 Facebook 廣告海報。

【輸出尺寸】
${size.name}｜${size.size}

【核心任務】
將上傳的原始人車照片，直接搬進高級商業 showroom 廣告場景。不是重新生成人與車。

【最高優先權：原始人車鎖定】
人與車必須100%保持原始照片：人物位置、車輛位置、人車距離、透視、遮擋、持牌手、臉部、車體結構、鋁圈、車燈、車窗、車牌，全部不可改變。
禁止重生成人臉、禁止美化、禁止補腿、禁止換手、禁止左右翻轉、禁止改車型。

【允許生成的商業版型】
只允許新增與生成背景、光影、文字、資訊條、價格牌設計、品牌區與商業排版，不得破壞原始人車。

主標：${headline}
左上日文：${jpText}
中間白色斜切資訊條：${featureText}
價格牌數字：${price}
底部車款資訊：${carModel}
品牌區：${brand}

【背景與質感】
黑暗高級工業 showroom，Lamborghini showroom 氛圍，黑灰 reflective floor，cinematic smoke，橘白 speed light，車身 glossy reflection，車燈白色 headlight glow 帶微藍 LED 光感。

【輸出優先順序】
1 原始人車準確度，2 原始構圖保留，3 商業版型，4 電影感，5 風格化。
若衝突，放棄商業效果，保留原始真實性。

生成強度：${strength}`;
}

export default function Home() {
  const [carModel, setCarModel] = useState("2025 NISSAN X-TRAIL 1.5T");
  const [headline, setHeadline] = useState("新貨到");
  const [jpText, setJpText] = useState("新入荷しました");
  const [featureText, setFeatureText] = useState("頂規四傳 / 輕油電 / 現省大價差");
  const [price, setPrice] = useState("75.9");
  const [brand, setBrand] = useState("SOFU Used Car Dealers");
  const [activeSize, setActiveSize] = useState("fb43");
  const [strength, setStrength] = useState("保真優先");
  const [selectedPreset, setSelectedPreset] = useState("自訂車款");
  const [imageName, setImageName] = useState("尚未上傳人車照");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string>("");
  const [status, setStatus] = useState("請先上傳人車照");
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedSize = getSizeById(activeSize);

  const prompt = useMemo(() => buildPrompt({
    activeSize,
    headline,
    jpText,
    featureText,
    price,
    carModel,
    brand,
    strength
  }), [activeSize, headline, jpText, featureText, price, carModel, brand, strength]);

  function applyPreset(name: string) {
    setSelectedPreset(name);
    const preset = VEHICLE_PRESETS.find((item) => item.carModel === name);
    if (!preset) return;
    setCarModel(preset.carModel);
    setHeadline(preset.headline);
    setFeatureText(preset.featureText);
    setPrice(preset.price);
    setStatus("已套用車款資料庫：" + preset.carModel);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSourceFile(file);
    setImageName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    setResultUrl("");
    setStatus("已上傳人車照，可以按生成海報");
  }

  async function generatePoster() {
    if (!sourceFile) {
      setStatus("請先上傳人車照片");
      return;
    }

    setIsGenerating(true);
    setResultUrl("");
    setStatus("生成中：正在呼叫 AI 生圖，請稍候...");

    try {
      const formData = new FormData();
      formData.append("source_image", sourceFile);
      formData.append("prompt", prompt);
      formData.append("size", selectedSize.apiSize);

      const response = await fetch("/api/generate-poster", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (!response.ok || !data.imageUrl) {
        throw new Error(data.error || "生成失敗");
      }

      setResultUrl(data.imageUrl);
      setStatus("生成完成，可以下載海報");
    } catch (error) {
      const message = error instanceof Error ? error.message : "生成失敗";
      setStatus("生成失敗：" + message);
    } finally {
      setIsGenerating(false);
    }
  }

  function downloadResult() {
    if (!resultUrl) {
      setStatus("尚未有生成結果，請先生成海報");
      return;
    }

    const link = document.createElement("a");
    link.href = resultUrl;
    link.download = `${carModel.replaceAll(" ", "_")}_AI_POSTER.png`;
    link.click();
  }

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <div className="badge"><Car size={18} /> SOFU 中古車 AI 生圖軟體 MVP</div>
          <h1>SOFU AI Poster Generator</h1>
          <p className="subtitle">
            第一版只做最重要的功能：上傳人車照 → 填車款 / 價格 / 賣點 → 按生成 → 回傳海報 → 下載圖片。
          </p>
        </header>

        <section className="grid">
          <div className="card">
            <h2 className="section-title"><Upload size={18} /> STEP 1｜上傳人車照</h2>
            <button className="upload" onClick={() => fileInputRef.current?.click()}>
              <FileImage size={44} />
              <span>{imageName}</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />

            <h2 className="section-title" style={{ marginTop: 22 }}><Settings2 size={18} /> STEP 2｜填車款資訊</h2>

            <label className="field">
              <span>車款資料庫</span>
              <select value={selectedPreset} onChange={(event) => applyPreset(event.target.value)}>
                <option>自訂車款</option>
                {VEHICLE_PRESETS.map((item) => (
                  <option key={item.carModel} value={item.carModel}>{item.carModel}</option>
                ))}
              </select>
            </label>

            <TextInput label="車款" value={carModel} onChange={setCarModel} />
            <TextInput label="賣點" value={featureText} onChange={setFeatureText} />
            <TextInput label="價格" value={price} onChange={setPrice} />
            <TextInput label="品牌" value={brand} onChange={setBrand} />

            <label className="field">
              <span>主標</span>
              <select value={headline} onChange={(event) => setHeadline(event.target.value)}>
                {TEMPLATE_OPTIONS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            <label className="field">
              <span>日文文字</span>
              <select value={jpText} onChange={(event) => setJpText(event.target.value)}>
                {JP_OPTIONS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            <label className="field">
              <span>保真強度</span>
              <select value={strength} onChange={(event) => setStrength(event.target.value)}>
                <option>保真優先</option>
                <option>平衡模式</option>
                <option>商業效果較強</option>
              </select>
            </label>

            <div className="size-grid">
              {SIZE_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSize(item.id)}
                  className={activeSize === item.id ? "size-btn active" : "size-btn"}
                >
                  <strong>{item.name}</strong>
                  <br />
                  <span className="small">{item.size}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="section-title"><Wand2 size={18} /> STEP 3｜生成海報</h2>

            <div className="preview-grid">
              <PreviewBox title="原始人車照" imageUrl={previewUrl} emptyText="尚未上傳" />
              <PreviewBox title="AI 海報結果" imageUrl={resultUrl} emptyText={isGenerating ? "生成中..." : "尚未生成"} loading={isGenerating} />
            </div>

            <div className="status">
              <strong>任務狀態</strong>
              <div style={{ marginTop: 6 }}>{status}</div>
            </div>

            <button className="primary" onClick={generatePoster} disabled={isGenerating}>
              {isGenerating ? "生成中..." : "生成海報"}
            </button>

            <button className="secondary" onClick={downloadResult}>
              <Download size={16} /> 下載海報
            </button>

            <div className="small" style={{ marginTop: 16 }}>
              第一次生成可能需要較久。圖片越大、Prompt 越複雜，等待時間越長。
            </div>
          </div>

          <div className="card">
            <h2 className="section-title"><ShieldCheck size={18} /> 保真鎖定規則</h2>
            <Rule text="人臉不重繪、不美化" />
            <Rule text="車體結構、鋁圈、車燈不變" />
            <Rule text="人車距離、比例、遮擋不變" />
            <Rule text="持牌手與牌子接觸不變" />
            <Rule text="禁止左右翻轉" />

            <h2 className="section-title" style={{ marginTop: 22 }}>自動 Prompt</h2>
            <div className="code">{prompt}</div>
          </div>
        </section>
      </div>
    </main>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function PreviewBox({ title, imageUrl, emptyText, loading }: { title: string; imageUrl?: string; emptyText: string; loading?: boolean }) {
  return (
    <div className="preview-box">
      <div className="preview-title">{title}</div>
      <div className="preview-image">
        {imageUrl ? <img src={imageUrl} alt={title} /> : loading ? <div className="spinner" /> : emptyText}
      </div>
    </div>
  );
}

function Rule({ text }: { text: string }) {
  return <div className="rule">✓ {text}</div>;
}
