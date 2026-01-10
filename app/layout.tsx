import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "./error-boundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Verality | AI Creator Outreach & Social Media Automation",
  description: "Automate your creator outreach with AI. Find creators, send personalized emails, handle replies, and scale your social media presence automatically with Verality.",
  keywords: ["AI social media outreach", "creator marketing automation", "auto-reply AI", "social media influencer tool", "Verality AI"],
  authors: [{ name: "Verality Team" }],
  metadataBase: new URL('https://verality.io'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Verality | AI Creator Outreach & Social Media Automation",
    description: "Scale your creator partnerships automatically. AI handles the search, outreach, and replies.",
    url: 'https://verality.io',
    siteName: 'Verality',
    images: [
      {
        url: '/v-nav.png',
        width: 800,
        height: 800,
        alt: 'Verality AI Logo',
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
  }
};

import AffiliateTracker from "@/components/AffiliateTracker";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
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
