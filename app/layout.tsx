import type { Metadata } from "next";
import { Inter, Caveat } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "./error-boundary";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });

export const metadata: Metadata = {
  title: "AI Influencer Outreach Software – Automate Creator Campaigns | Verality",
  description: "Verality automates influencer outreach using AI. Find creators, get emails, send DMs, and track campaigns in one platform.",
  keywords: [
    "ai social media outreach",
    "influencer outreach software",
    "ai influencer outreach",
    "creator outreach platform",
    "influencer marketing automation",
    "automated social media outreach",
    "influencer email finder"
  ],
  authors: [{ name: "Verality Team" }],
  metadataBase: new URL('https://verality.io'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "AI Influencer Outreach Software – Automate Creator Campaigns | Verality",
    description: "Verality automates influencer outreach using AI. Find creators, get emails, send DMs, and track campaigns in one platform.",
    url: 'https://verality.io',
    siteName: 'Verality',
    images: [
      {
        url: '/v-nav.png', // Ideally a larger OG image
        width: 1200,
        height: 630,
        alt: 'Verality Platform Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Influencer Outreach Software – Automate Creator Campaigns | Verality',
    description: 'Verality automates influencer outreach using AI. Find creators, get emails, send DMs, and track campaigns in one platform.',
    images: ['/v-nav.png'],
  },
  icons: {
    icon: '/V.png',
    apple: '/V.png',
    shortcut: '/V.png'
  },
  verification: {
    google: '8WS8sBOoEU8uTvfk3rKqsKUiA-XvTM4KLDO57RVOzbE',
  },
};

import AffiliateTracker from "@/components/AffiliateTracker";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import FooterWrapper from "@/components/FooterWrapper";
import { Suspense } from "react";

import CursorBloom from "@/components/CursorBloom";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${caveat.variable} font-sans`}>
        <CursorBloom />
        <GoogleAnalytics GA_MEASUREMENT_ID={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''} />
        <ErrorBoundary>
          <Suspense fallback={null}>
            <AffiliateTracker />
          </Suspense>
          {children}
        </ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#ededed',
              border: '1px solid #333',
            },
          }}
        />
        <FooterWrapper />
      </body>
    </html>
  );
}
