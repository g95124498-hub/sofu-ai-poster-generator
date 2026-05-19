import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SOFU v3 保真人車合成系統",
  description: "固定版型 Canvas 商業合成系統"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
