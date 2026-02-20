import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/stitch/header";
import { Footer } from "@/components/stitch/footer";
import { Suspense } from "react";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://authentik.app'),
  title: {
    default: "Authentik - Discover Authentic Vietnam and Singapore Food",
    template: "%s | Authentik"
  },
  description: "Discover where locals actually eat across Vietnam and Singapore. Curated restaurant collections filtering out fake reviews and tourist traps.",
  keywords: ["Vietnam", "Singapore", "food", "restaurants", "authentic", "local", "travel", "cuisine", "Ha Noi", "Ho Chi Minh City", "Hue", "Da Nang", "Da Lat", "Nha Trang"],
  authors: [{ name: "Authentik Team" }],
  creator: "Authentik",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Authentik - Real Local Food",
    description: "No tourist traps. Just authentic local favorites in Vietnam and Singapore.",
    siteName: "Authentik",
    images: [{
      url: "/og-image.jpg", // Needs to be added to public/
      width: 1200,
      height: 630,
      alt: "Authentik Discovery"
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Authentik - Real Local Food",
    description: "Discover authentic local food in Vietnam and Singapore.",
    creator: "@authentik",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import { Providers } from "./providers";
import { LanguageProvider } from "@/lib/i18n-context";
import { LocationProvider } from "@/lib/location-context";
import { FriendlyLocationRequest } from "@/components/stitch/friendly-location-request";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.variable} font-sans antialiased bg-[#fafaf9] text-[#1c1917] min-h-screen`}>
        <LanguageProvider>
          <LocationProvider>
            <Providers>
              <div className="layout-container flex flex-col">
                <Suspense fallback={null}>
                  <Header />
                </Suspense>
                <Suspense fallback={null}>
                  {children}
                </Suspense>
                <Footer />
              </div>
              <FriendlyLocationRequest />
            </Providers>
          </LocationProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
