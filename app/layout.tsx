import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { AuthProvider } from "@/lib/auth-context";
import { NotificationsProvider } from "@/lib/notifications-context";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HiManga - Read Manga Online | Level Up Your Manga Experience",
  description:
    "Discover and read your favorite manga with a beautiful, anime-inspired interface. Thousands of manga titles, infinite scroll, and community discussions.",
  keywords: [
    "manga",
    "manga reader",
    "anime",
    "read manga online",
    "manga community",
    "One Piece",
    "Solo Leveling",
    "Kaiju No 8",
    "Naruto",
    "Bleach",
    "Attack on Titan",
    "Demon Slayer",
  ],
  authors: [{ name: "HiManga" }],
  creator: "HiManga",
  publisher: "HiManga",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://himanga.app",
    siteName: "HiManga",
    title: "HiManga - Read Manga Online",
    description:
      "Discover and read your favorite manga with a beautiful, anime-inspired interface",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "HiManga - Manga Reader",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MangaFlow - Read Manga Online",
    description:
      "Discover and read your favorite manga with a beautiful interface",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://mangaflow.app",
  },
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark overflow-x-hidden">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "HiManga",
              description:
                "Read manga online with a beautiful interface and anime inspired design.",
              url: "https://himanga.app",
              applicationCategory: "EntertainmentApplication",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
        <script
          data-name="BMC-Widget"
          data-cfasync="false"
          src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
          data-id="luffysfan"
          data-description="Support me on Buy me a coffee!"
          data-message="Buy me a coffee, Your support motivates me."
          data-color="#BD5FFF"
          data-position="Right"
          data-x_margin="18"
          data-y_margin="18"
        ></script>
        <meta name="favicon" content="/favicon.ico" />
      </head>
      <body className="font-sans antialiased overflow-x-hidden w-full max-w-[100vw]">
        <AuthProvider>
          <NotificationsProvider>
            <div className="overflow-x-hidden w-full">{children}</div>
            <Analytics />
            <SpeedInsights />
          </NotificationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
