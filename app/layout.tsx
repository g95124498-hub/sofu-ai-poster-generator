import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "SOFU AI Poster Generator v23", description: "SOFU 台灣中古車穩定排版 AI 海報工具" };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="zh-Hant"><body>{children}</body></html>; }
