# SOFU AI Poster Generator v8.1

v8.1 主體鎖定商業合成引擎。

核心改變：
- 不再使用 AI 完整海報備援
- 需要 OPENAI_API_KEY 與 REMOVE_BG_API_KEY
- AI 只生成純背景
- 原始真人真車自動去背後貼回
- 中文字、價格牌、Logo、車牌由 Canvas 後製
- 強化速度線、煙霧、接地陰影、反射、融合光
- 預設人車位置放大，更接近參考圖

Vercel Environment Variables：
OPENAI_API_KEY
REMOVE_BG_API_KEY
