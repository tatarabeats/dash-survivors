import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Shippori_Mincho } from "next/font/google";
import "./globals.css";

const uiFont = Noto_Sans_JP({
  variable: "--font-ui",
  weight: ["400", "500", "700", "900"],
});

const displayFont = Shippori_Mincho({
  variable: "--font-display",
  weight: ["500", "700", "800"],
});

export const metadata: Metadata = {
  title: "忍者サバイバーズ",
  description: "右親指のスワイプだけで遊ぶ、突っ込む忍者ローグライクアクション。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#07080d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body
        className={`${uiFont.variable} ${displayFont.variable} h-full overflow-hidden bg-[#07080d]`}
      >
        {children}
      </body>
    </html>
  );
}
