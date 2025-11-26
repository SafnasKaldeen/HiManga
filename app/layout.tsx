import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from "@/lib/auth-context";
import { NotificationsProvider } from "@/lib/notifications-context";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const baseUrl = "https://himanga.fun";

// All possible OG image filename variations
const ogImageVariations = [
  "og-image.jpg",
  "Og-image.jpg",
  "OG-image.jpg",
  "og-Image.jpg",
  "Og-Image.jpg",
  "OG-Image.jpg",
  "og-image.JPG",
  "Og-image.JPG",
  "OG-image.JPG",
  "og-Image.JPG",
  "Og-Image.JPG",
  "OG-Image.JPG",
  "OG-IMAGE.jpg",
  "OG-IMAGE.JPG",
];

// SEO Configuration
const seoConfig = {
  title: "HiManga - Read Manga Online | Level Up Your Manga Experience",
  description:
    "Discover and read your favorite manga with a beautiful, anime-inspired interface. Thousands of manga titles, infinite scroll, and community discussions.",
  siteName: "HiManga",
  image: {
    urls: ogImageVariations.map((filename) => `${baseUrl}/${filename}`),
    primaryUrl: `${baseUrl}/og-image.jpg`,
    type: "image/jpeg",
    width: 1200,
    height: 630,
    alt: "HiManga - Manga Reader",
  },
  twitter: {
    handle: "@himanga",
  },
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
    "Hentai manga",
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: seoConfig.title,
    template: "%s | HiManga",
  },
  description: seoConfig.description,
  keywords: seoConfig.keywords,
  authors: [{ name: "HiManga" }],
  creator: "HiManga",
  publisher: "HiManga",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: seoConfig.siteName,
    title: seoConfig.title,
    description: seoConfig.description,
    images: [
      {
        url: seoConfig.image.primaryUrl,
        secureUrl: seoConfig.image.primaryUrl,
        width: seoConfig.image.width,
        height: seoConfig.image.height,
        alt: seoConfig.image.alt,
        type: seoConfig.image.type,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: seoConfig.twitter.handle,
    creator: seoConfig.twitter.handle,
    title: seoConfig.title,
    description: seoConfig.description,
    images: [seoConfig.image.primaryUrl],
  },
  alternates: {
    canonical: baseUrl,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Generate Open Graph tags for ALL image variations
  const openGraphTags = [
    { property: "og:type", content: "website" },
    { property: "og:url", content: baseUrl },
    { property: "og:site_name", content: seoConfig.siteName },
    { property: "og:title", content: seoConfig.title },
    { property: "og:description", content: seoConfig.description },
    // Primary image
    { property: "og:image", content: seoConfig.image.primaryUrl },
    { property: "og:image:secure_url", content: seoConfig.image.primaryUrl },
    { property: "og:image:type", content: seoConfig.image.type },
    { property: "og:image:width", content: String(seoConfig.image.width) },
    { property: "og:image:height", content: String(seoConfig.image.height) },
    { property: "og:image:alt", content: seoConfig.image.alt },
    { property: "og:locale", content: "en_US" },
  ];

  // Add all variations as fallbacks
  const imageVariationTags = seoConfig.image.urls.slice(1).map((url) => ({
    property: "og:image",
    content: url,
  }));

  const twitterTags = [
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: seoConfig.twitter.handle },
    { name: "twitter:creator", content: seoConfig.twitter.handle },
    { name: "twitter:title", content: seoConfig.title },
    { name: "twitter:description", content: seoConfig.description },
    { name: "twitter:image", content: seoConfig.image.primaryUrl },
    { name: "twitter:image:alt", content: seoConfig.image.alt },
  ];

  // Add Twitter image variations as fallbacks
  const twitterImageVariations = seoConfig.image.urls.slice(1).map((url) => ({
    name: "twitter:image",
    content: url,
  }));

  const basicMetaTags = [
    { name: "description", content: seoConfig.description },
    { name: "keywords", content: seoConfig.keywords.join(", ") },
    { name: "author", content: "HiManga" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "theme-color", content = "#BD5FFF" },
  ];

  return (
    <html lang="en" className="dark overflow-x-hidden">
      <head>
        {/* Basic Meta Tags */}
        {basicMetaTags.map((tag, index) => (
          <meta key={`basic-${index}`} {...tag} />
        ))}

        {/* Open Graph Meta Tags */}
        {openGraphTags.map((tag, index) => (
          <meta key={`og-${index}`} {...tag} />
        ))}

        {/* All OG Image Variations as Fallbacks */}
        {imageVariationTags.map((tag, index) => (
          <meta key={`og-img-var-${index}`} {...tag} />
        ))}

        {/* Twitter Card Meta Tags */}
        {twitterTags.map((tag, index) => (
          <meta key={`twitter-${index}`} {...tag} />
        ))}

        {/* All Twitter Image Variations as Fallbacks */}
        {twitterImageVariations.map((tag, index) => (
          <meta key={`twitter-img-var-${index}`} {...tag} />
        ))}

        {/* Canonical Link */}
        <link rel="canonical" href={baseUrl} />

        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: seoConfig.siteName,
              description: seoConfig.description,
              url: baseUrl,
              image: seoConfig.image.primaryUrl,
              applicationCategory: "EntertainmentApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "1250",
              },
            }),
          }}
        />

        {/* Buy Me a Coffee Widget */}
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
        />
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
