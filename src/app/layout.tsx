import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import clsx from "clsx";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Strict Me",
  description: "AI-powered study management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={clsx(inter.className, "antialiased h-screen w-screen overflow-hidden bg-gray-50 text-black flex")}>
        <Sidebar />
        <main className="flex-1 h-full overflow-hidden relative">
          {children}
        </main>
      </body>
    </html>
  );
}
