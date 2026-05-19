import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SOFU v4 AI 商業生成版",
  description: "快速中古車商業海報生成"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
