import type { Metadata } from "next";
import { Inter, Caveat } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "./error-boundary";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });

export const metadata: Metadata = {
  title: "Verality | #1 AI Creator Outreach & Influencer Marketing Platform",
  description: "The complete AI creator outreach solution. Automated discovery, personalized emailing, and CRM for brands and agencies. Scale your influencer marketing today.",
  keywords: ["AI creator outreach", "influencer marketing automation", "find creators", "automated dm", "influencer crm", "tiktok outreach", "instagram outreach"],
  authors: [{ name: "Verality Team" }],
  metadataBase: new URL('https://verality.io'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Verality | #1 AI Creator Outreach Platform",
    description: "Stop manual searching. Verality automates your entire creator outreach pipeline from discovery to signed deal.",
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
    title: 'Verality | AI Creator Outreach Automation',
    description: 'Scale your creator partnerships automatically with AI.',
    images: ['/v-nav.png'],
  },
  icons: {
    icon: '/V.png',
    apple: '/V.png',
    shortcut: '/V.png'
  }
};

import AffiliateTracker from "@/components/AffiliateTracker";
import GoogleAnalytics from "@/components/GoogleAnalytics";
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
      </body>
    </html>
  );
}
