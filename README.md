# SOFU AI Poster Generator Real v20

真正可部署到 Vercel 的 SOFU 車商 AI 海報網頁軟體。

## v20 功能

- 上傳原始人車照
- 上傳參考海報
- 可上傳去背人車 PNG
- 可上傳 Logo PNG
- 可上傳車牌 PNG
- AI 只生成 showroom 背景
- 離線 showroom 背景備援：沒有 OpenAI 或 AI失敗也能合成測試
- Canvas 合成真車真人、文字、價格牌、Logo
- 4:3 海報輸出
- 下載 PNG 高畫質
- 下載 JPG 投放版
- API 狀態檢查
- 人車、金屬字、價格牌位置可調

## Vercel Environment Variables

必要：
OPENAI_API_KEY

可選：
REMOVE_BG_API_KEY

沒有 REMOVE_BG_API_KEY 時，請在網頁上傳「去背人車 PNG」。

## 部署方式

1. 解壓縮 ZIP
2. 上傳整包到 GitHub Repo
3. Vercel 連接 GitHub
4. 設定 OPENAI_API_KEY
5. Deploy
