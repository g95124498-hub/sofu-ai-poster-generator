"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, Wand2, Download, ShieldCheck } from "lucide-react";

type Key = "source" | "style" | "logo";
const items:{key:Key,label:string,required?:boolean}[]=[
  {key:"source",label:"原始人車照",required:true},
  {key:"style",label:"參考海報",required:true},
  {key:"logo",label:"SOFU Logo"}
];

async function compressImage(file:File,maxSize=1200,quality=.72):Promise<File>{
  const img=document.createElement("img");
  const url=URL.createObjectURL(file);
  await new Promise<void>((res,rej)=>{img.onload=()=>res();img.onerror=()=>rej();img.src=url});
  const scale=Math.min(1,maxSize/Math.max(img.width,img.height));
  const w=Math.round(img.width*scale),h=Math.round(img.height*scale);
  const canvas=document.createElement("canvas"); canvas.width=w; canvas.height=h;
  const ctx=canvas.getContext("2d")!; ctx.drawImage(img,0,0,w,h); URL.revokeObjectURL(url);
  const blob=await new Promise<Blob>((res,rej)=>canvas.toBlob(b=>b?res(b):rej(),"image/jpeg",quality));
  return new File([blob],file.name.replace(/\.[^.]+$/,"")+".jpg",{type:"image/jpeg"});
}

export default function Home(){
  const refs=useRef<Partial<Record<Key,HTMLInputElement|null>>>({});
  const [files,setFiles]=useState<Partial<Record<Key,File>>>({});
  const [urls,setUrls]=useState<Partial<Record<Key,string>>>({});
  const [result,setResult]=useState("");
  const [status,setStatus]=useState("請上傳原始人車照 + 參考海報。這版不需要手動去背。");
  const [loading,setLoading]=useState(false);

  const [carModel,setCarModel]=useState("2025 NISSAN X-TRAIL 1.5T");
  const [headline,setHeadline]=useState("新貨到");
  const [jpText,setJpText]=useState("新入荷しました");
  const [feature,setFeature]=useState("超值 / 輕油電 / 現省大價差");
  const [price,setPrice]=useState("75.9");
  const [extra,setExtra]=useState("請做成參考圖那種：大型銀色 hammered 金屬字、紅色速度光、黑色工業 showroom、底部紅黑車名條。");

  const prompt=useMemo(()=>`【SOFU v4 真 AI 商業生成版】

任務：
請根據「原始人車照」製作一張台灣中古車 Facebook 4:3 橫式商業海報。
「參考海報」只參考版型、光影、金屬字、紅色速度線、底部車名條、價格牌風格。
不要學參考海報裡的車型。

【輸出比例】
必須橫式 4:3，完整海報，不可裁切大字、車頭、人物、價格、Logo、底部車名條。

【主體】
以原始人車照為主：
- 車款外型要接近原圖
- 人物要接近原圖
- 人物可整理到右側，避免被車遮住
- 不要出現半身、缺腳、手穿過車
- 不要讓人跑到車頭外造成身體缺失

【版型必須接近參考圖】
只保留以下元素，不要增加其他內容：
1. 左上紅色日文：${jpText}
2. 上方巨大 hammered silver 3D 金屬字：${headline}
3. 白色斜切資訊條：${feature}
4. 右上牛皮紙價格牌：真的就賣！ ${price}萬
5. 中央大車主視覺
6. 人物在車右側或右後方，比例自然
7. 底部紅黑資訊條：${carModel}
8. 左下 SOFU Logo / Used Car Dealers

【禁止多餘內容】
禁止新增：
- 右側功能列表
- icon 清單
- 保固說明框
- 多個小框
- 側邊欄
- 無關中文
- 無關英文
- 亂碼
- 多餘車輛資訊
- 第二台主車
- 卡通化、動畫感

【視覺風格】
黑色工業 showroom、濕亮反射地板、紅橘速度光、煙霧、車身反射、車頭壓迫感、強烈台灣中古車促銷風格。
整體要像參考海報，而不是簡報或資訊圖。

【文字要求】
繁體中文與日文要清楚可讀，不要假字、不變形、不亂碼。
英文車款使用粗體白字，底部紅黑條。

【補充】
${extra}
`,[carModel,headline,jpText,feature,price,extra]);

  function pick(key:Key,file?:File){
    if(!file)return;
    setFiles(p=>({...p,[key]:file}));
    setUrls(p=>({...p,[key]:URL.createObjectURL(file)}));
  }

  async function generate(){
    if(!files.source||!files.style){setStatus("請至少上傳：原始人車照 + 參考海報");return;}
    setLoading(true); setResult(""); setStatus("壓縮圖片中...");
    try{
      const fd=new FormData();
      fd.append("source",await compressImage(files.source,1300,.74));
      fd.append("style",await compressImage(files.style,1200,.72));
      if(files.logo) fd.append("logo",await compressImage(files.logo,800,.75));
      fd.append("prompt",prompt);
      setStatus("AI 商業海報生成中，通常 30~90 秒...");
      const res=await fetch("/api/generate-poster",{method:"POST",body:fd});
      const text=await res.text();
      let data:any; try{data=JSON.parse(text)}catch{throw new Error(text.slice(0,200))}
      if(!res.ok||!data.imageUrl) throw new Error(data.error||"生成失敗");
      setResult(data.imageUrl); setStatus("生成完成。若不夠像，調整補充要求再生成。");
    }catch(e:any){setStatus("生成失敗："+(e?.message||"未知錯誤"))}
    finally{setLoading(false)}
  }

  function download(){
    if(!result)return;
    const a=document.createElement("a"); a.href=result; a.download=carModel.replaceAll(" ","_")+"_SOFU_v4.png"; a.click();
  }

  return <main className="page"><div className="wrap">
    <div className="badge">🚗 SOFU 中古車 AI 商業生成系統 v4.0</div>
    <h1 className="title">SOFU AI Poster Generator</h1>
    <p className="sub">目標：讓你更快、更接近參考圖。不需手動去背，AI 重新生成商業海報；系統限制不要亂加多餘內容。</p>

    <section className="grid">
      <div className="card">
        <h2 className="h"><Upload size={20}/> STEP 1｜上傳素材</h2>
        <div className="notice">必上傳：原始人車照 + 參考海報。Logo 可選。價格不用傳圖，直接輸入數字。</div>
        <div className="uploadGrid">
          {items.map(item=><div key={item.key}>
            <button className="upload" onClick={()=>refs.current[item.key]?.click()}>
              {urls[item.key]?<img src={urls[item.key]} alt={item.label}/>:<span>{item.label}{item.required?" *":""}</span>}
            </button>
            <input hidden ref={el=>{refs.current[item.key]=el}} type="file" accept="image/*" onChange={e=>pick(item.key,e.target.files?.[0])}/>
          </div>)}
        </div>

        <h2 className="h" style={{marginTop:18}}>STEP 2｜內容</h2>
        <Field label="車款" value={carModel} setValue={setCarModel}/>
        <Field label="主標" value={headline} setValue={setHeadline}/>
        <Field label="日文紅字" value={jpText} setValue={setJpText}/>
        <Field label="資訊條" value={feature} setValue={setFeature}/>
        <Field label="價格" value={price} setValue={setPrice}/>
        <label className="field"><span>補充要求</span><textarea value={extra} onChange={e=>setExtra(e.target.value)}/></label>
        <button className="btn" disabled={loading} onClick={generate}><Wand2 size={16}/> {loading?"生成中...":"生成海報"}</button>
        <button className="btn2" onClick={download}><Download size={16}/> 下載海報</button>
      </div>

      <div className="card">
        <h2 className="h">STEP 3｜結果</h2>
        <div className="box"><div className="boxTitle">AI 商業海報結果</div><div className="boxImg">{result?<img src={result}/>:loading?<div className="spin"/>:"尚未生成"}</div></div>
        <div className="status">{status}</div>
      </div>

      <div className="card">
        <h2 className="h"><ShieldCheck size={20}/> v4 規則</h2>
        <div className="rule">✓ 不用手動去背</div>
        <div className="rule">✓ 只上傳原圖 + 參考海報</div>
        <div className="rule">✓ 價格直接輸入</div>
        <div className="rule">✓ 禁止多餘 icon / 側欄 / 功能框</div>
        <div className="rule">✓ 目標接近參考圖</div>
        <h2 className="h" style={{marginTop:18}}>Prompt</h2>
        <div className="prompt">{prompt}</div>
      </div>
    </section>
  </div></main>
}

function Field({label,value,setValue}:{label:string;value:string;setValue:(v:string)=>void}){
  return <label className="field"><span>{label}</span><input value={value} onChange={e=>setValue(e.target.value)}/></label>
}
