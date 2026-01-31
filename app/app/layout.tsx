import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/stitch/header";
import { Footer } from "@/components/stitch/footer";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Authentik - Discover Authentic Da Nang Food",
  description: "Discover where Da Nang locals actually eat. Curated restaurant collections filtering out fake reviews and tourist traps.",
  keywords: ["Da Nang", "food", "restaurants", "authentic", "local", "Vietnam"],
};

import { LanguageProvider } from "@/lib/i18n-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.variable} font-sans antialiased bg-[#fafaf9] text-[#1c1917] min-h-screen`}>
        <LanguageProvider>
          <div className="layout-container flex flex-col">
            <Header />
            {children}
            <Footer />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
