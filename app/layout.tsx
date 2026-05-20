import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SOFU AI Poster Generator",
  description: "SOFU 車商 AI 商業海報網頁軟體"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
