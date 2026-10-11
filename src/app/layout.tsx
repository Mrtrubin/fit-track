import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import AuthGate from "@/components/auth/AuthGate";

export const metadata: Metadata = {
  title: "我的健身 · FitTrack",
  description: "个人健身管理：记录饮食、训练、体重，科学达成目标",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">
        <Suspense fallback={null}>
          <AuthGate>{children}</AuthGate>
        </Suspense>
      </body>
    </html>
  );
}