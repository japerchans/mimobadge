import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "みもバッジ · 介護記録",
  description: "職員が確認して残す介護記録と入居者の情報。",
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
