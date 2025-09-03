import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import { Sidebar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Barlow_Condensed } from "next/font/google";

export const metadata: Metadata = {
  title: "F1 Dash Rebuild",
  description: "A starter inspired by Delta Dash",
};

const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={barlow.className}>
        <ReactQueryProvider>
          <div className="flex">
            <Sidebar />
            <div className="flex-1 min-h-dvh flex flex-col">
              <main className="px-4 py-6 max-w-7xl mx-auto w-full flex-1">
                <Suspense fallback={<div className="text-sm text-gray-400">Loading…</div>}>
                  {children}
                </Suspense>
              </main>
              <Footer />
            </div>
          </div>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
