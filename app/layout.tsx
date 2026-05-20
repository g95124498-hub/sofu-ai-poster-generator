import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SOFU v8.3 簡化流程免去背版",
  description: "AI純背景 + 真實人車貼回 + Canvas商業合成"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
