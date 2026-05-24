# SOFU AI Poster Generator Real v22.2

修正 Vercel build error：

- 已補上 makeLocalBackground
- 不會因為 REMOVE_BG_API_KEY 未設定而卡住
- 沒有 remove.bg key 也能用原圖先測試
- 正式效果建議上傳去背人車 PNG
- 保留台灣 CTR / 車體放大 / AO / haze / 暴力價格牌方向

部署：
1. 解壓縮
2. 上傳 GitHub
3. Vercel Deploy
4. 設定 OPENAI_API_KEY
5. 可選 REMOVE_BG_API_KEY
