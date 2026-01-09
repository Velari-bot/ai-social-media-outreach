"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#F3F1EB] relative overflow-hidden font-sans selection:bg-orange-200">
      <Navbar />

      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-60">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] bg-gradient-to-br from-purple-100 via-pink-100 to-transparent blur-[100px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[50%] bg-gradient-to-bl from-blue-100 via-teal-50 to-transparent blur-[100px]" />
      </div>

      <div className="relative pt-32 lg:pt-40 pb-20 px-6 max-w-[1440px] mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

        {/* Left Column - Content */}
        <div className="flex-1 w-full max-w-2xl text-center lg:text-left z-10 flex flex-col items-center lg:items-start">




          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-[850] text-[#1A1A1A] mb-8 tracking-tight leading-[1.05] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Find, Contact, and Close Creators — <span className="text-[#FFBE5B]">Automatically.</span>
          </h1>

          <p className="text-xl text-gray-600 mb-10 leading-relaxed font-medium max-w-xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            Select your creator criteria. We find them, email them, follow up, handle replies, and log everything for you.
          </p>

          <div className="flex flex-col items-center lg:items-start gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 w-full">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                href="/book"
                className="px-8 py-4 bg-black text-white rounded-full hover:bg-gray-900 hover:scale-105 transition-all font-bold text-lg inline-flex items-center justify-center min-w-[180px] shadow-lg"
              >
                Book a demo call
              </Link>
            </div>
            <p className="text-sm text-gray-400 font-medium ml-2">No card required.</p>
          </div>

          <div className="mt-16 pt-8 border-t border-gray-200/50 w-full animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
            <p className="text-sm font-medium text-gray-400 mb-6 text-center lg:text-left">Start your outreach journey today.</p>
          </div>

        </div>

        {/* Right Column - Product Mockup */}
        <div className="flex-1 w-full max-w-2xl lg:max-w-none relative z-10 animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
          {/* Decorative Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-200/50 to-blue-200/50 blur-[80px] -z-10 rounded-full" />

          <div className="bg-white rounded-[24px] shadow-2xl border border-gray-200/50 overflow-hidden relative">
            {/* Window Controls */}
            <div className="h-10 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <div className="w-3 h-3 rounded-full bg-green-400/80" />
              <div className="ml-4 px-3 py-1 bg-white border border-gray-200 rounded-md text-[10px] text-gray-400 font-medium flex-1 text-center">
                app.verality.io/dashboard
              </div>
            </div>

            {/* Existing Dashboard Table Logic - Simplified for Preview */}
            <div className="p-4 bg-gray-50/50">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Creator</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Platform</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Avg Views</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      { name: "MrBeast", handle: "@mrbeast", platform: "YT", status: "Replied", statusColor: "green", views: "142M", avatarUrl: "https://yt3.googleusercontent.com/ytc/AIdro_mK_bYt1x6J-rLqQfL5z6_x_4f6_x_4f6_x_4=s176-c-k-c0x00ffffff-no-rj" },
                      { name: "MKBHD", handle: "@mkbhd", platform: "YT", status: "Follow-up", statusColor: "yellow", views: "18M", avatarUrl: "https://yt3.googleusercontent.com/ytc/AIdro_n_n_n_n_n_n_n_n_n_n_n_n_n_n_n_n_n=s176-c-k-c0x00ffffff-no-rj" },
                      { name: "Charli D'Amelio", handle: "@charlidamelio", platform: "TT", status: "Sent", statusColor: "blue", views: "25M", avatarUrl: "https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/7342898958289898502~c5_100x100.jpeg?x-expires=1710547200&x-signature=8%2B8%2B8%2B8%2B8%2B8%2B8" }, // Placeholder or simplified
                      { name: "Kim Kardashian", handle: "@kimkardashian", platform: "IG", status: "Replied", statusColor: "green", views: "4.2M", avatarUrl: "" },
                      { name: "Dude Perfect", handle: "@dudeperfect", platform: "YT", status: "Sent", statusColor: "blue", views: "12M", avatarUrl: "" },
                    ].map((row, i) => {
                      const statusStyles: Record<string, string> = {
                        green: "bg-green-100 text-green-700",
                        yellow: "bg-yellow-100 text-yellow-700",
                        blue: "bg-blue-100 text-blue-700",
                      };

                      // Platform Logos
                      const PlatformIcon = () => {
                        if (row.platform === "YT") return (
                          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                          </svg>
                        );
                        if (row.platform === "IG") return (
                          <svg className="w-4 h-4 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
                        );
                        if (row.platform === "TT") return (
                          <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.49-3.35-3.98-5.6-1.11-5.09 2.79-10.03 7.9-10.05v4.06c-1.31.06-2.6.83-3.04 2.08-.2 1.41.61 2.87 2.05 3.11 1.25.26 2.53-.29 3.03-1.47.16-.62.24-1.27.24-1.92V.02z" />
                          </svg>
                        );
                        return null;
                      }

                      return (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {/* Avatar */}
                              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                                {row.avatarUrl ? (
                                  <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${row.avatarUrl})` }} />
                                ) : (
                                  <div className="text-[10px] font-bold text-gray-400">{row.name.substring(0, 2).toUpperCase()}</div>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 text-sm">{row.name}</div>
                                <div className="text-xs text-gray-400">{row.handle}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shadow-sm">
                              <PlatformIcon />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusStyles[row.statusColor]}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-500 text-xs">{row.views}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Simulated "Live Action" Popups */}
              <div className="absolute bottom-8 right-8 bg-white p-3 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-1000">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Email Sent</div>
                  <div className="text-[10px] text-gray-500">to 5 creators just now</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
      {/* Our Process Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-black tracking-tight mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-500">
              Launch your first campaign in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gray-100 -z-10"></div>

            {/* Step 1: Search */}
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-[#F3F1EB] rounded-2xl flex items-center justify-center mb-6 border border-gray-100 shadow-sm">
                <span className="text-4xl">🔍</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">1. Search</h3>
              <p className="text-gray-500">
                Find your perfect creators using our advanced AI filters for niche, location, and keywords.
              </p>
            </div>

            {/* Step 2: Email Delivery */}
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-[#F3F1EB] rounded-2xl flex items-center justify-center mb-6 border border-gray-100 shadow-sm">
                <span className="text-4xl">📨</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">2. Email Delivery</h3>
              <p className="text-gray-500">
                We automatically verify emails and send your personalized pitch directly to their inbox.
              </p>
            </div>

            {/* Step 3: Reply */}
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-[#F3F1EB] rounded-2xl flex items-center justify-center mb-6 border border-gray-100 shadow-sm">
                <span className="text-4xl">↩️</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">3. Email Reply</h3>
              <p className="text-gray-500">
                Get responses directly to your own inbox. Negotiate deals and start collaborating.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer (Simple) */}
      <footer className="py-12 bg-[#F3F1EB] border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center text-gray-500 text-sm">
          <p>© 2026 Verality. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-black">Privacy</Link>
            <Link href="/terms" className="hover:text-black">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
