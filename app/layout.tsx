import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SOFU AI Poster Generator v22.2",
  description: "SOFU 台灣中古車 AI 海報網頁軟體"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
