import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "个人电子衣柜",
  description: "个人电子衣柜管理系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

