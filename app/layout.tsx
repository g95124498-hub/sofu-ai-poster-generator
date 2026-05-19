import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SOFU v8.1 主體鎖定商業合成引擎",
  description: "AI純背景 + 真實人車貼回 + Canvas商業合成"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
