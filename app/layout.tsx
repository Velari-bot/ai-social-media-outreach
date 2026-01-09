import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "./error-boundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Creator Outreach Assistant",
  description: "An AI assistant that finds creators, emails them from your inbox, handles the replies, and builds your creator list automatically.",
};

import AffiliateTracker from "@/components/AffiliateTracker";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
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
