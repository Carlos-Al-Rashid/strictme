import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import clsx from "clsx";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Studyplus",
    template: "%s | Studyplus"
  },
  description: "学習管理アプリ",
  icons: {
    icon: '/icon.jpg',
    apple: '/icon.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.className} antialiased bg-gray-50`}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto pb-16 md:pb-0 md:ml-64">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
