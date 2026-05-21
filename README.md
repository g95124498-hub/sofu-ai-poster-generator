# SOFU AI Poster Generator Real v22 Fixed

這是 v22 修正版。

## 實際修正

- 不再因為 REMOVE_BG_API_KEY 未設定而卡住
- 有去背 PNG：直接使用去背 PNG
- 有 remove.bg key：自動去背
- 沒有去背 PNG / 沒有 key：自動切換原圖測試模式
- 保留 v22 台灣 CTR / 車體放大 / AO / showroom 方向

## 建議正式使用

效果最好：上傳「去背人車 PNG」。

## Vercel 環境變數

必要：OPENAI_API_KEY

可選：REMOVE_BG_API_KEY

沒有 REMOVE_BG_API_KEY 也能先測試。
