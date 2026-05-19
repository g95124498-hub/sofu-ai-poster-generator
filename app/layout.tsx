import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOFU AI Poster Generator v2",
  description: "中古車 AI 商業合成系統 v2"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
