"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  Search,
  Send,
  BarChart3,
  Building2,
  Rocket,
  Users
} from "lucide-react";

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

      {/* 1. Hero Section - Tightened Padding */}
      <div className="relative pt-24 lg:pt-32 pb-12 px-6 max-w-[1440px] mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

        {/* Left Column - Content */}
        <div className="flex-1 w-full max-w-2xl text-center lg:text-left z-10 flex flex-col items-center lg:items-start">
          <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-[850] text-[#1A1A1A] mb-6 tracking-tight leading-[1.05]">
            Find, Contact, and Close Creators — <span className="text-[#FFBE5B]">Automatically.</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed font-medium max-w-xl">
            Select your creator criteria. We find them, email them, follow up, handle replies, and log everything for you.
          </p>

          <div className="flex flex-col items-center lg:items-start gap-3 w-full">
            <Link
              href="/book"
              className="px-8 py-3.5 bg-black text-white rounded-full hover:bg-gray-900 hover:scale-105 transition-all font-bold text-lg inline-flex items-center justify-center min-w-[200px] shadow-lg"
            >
              Book a demo call
            </Link>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider ml-1">No card required.</p>
          </div>
        </div>

        {/* Right Column - Product Mockup */}
        <div className="flex-1 w-full max-w-2xl lg:max-w-none relative z-10">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-200/40 to-blue-200/40 blur-[80px] -z-10 rounded-full" />
          <div className="bg-white rounded-[32px] shadow-2xl border border-gray-200/50 overflow-hidden relative scale-95 lg:scale-100">
            {/* Window Controls */}
            <div className="h-10 bg-gray-50/50 border-b border-gray-100 flex items-center px-4 gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <div className="ml-4 px-3 py-0.5 bg-white border border-gray-200 rounded-lg text-[10px] text-gray-400 font-bold flex-1 text-center truncate">
                verality.io/dashboard
              </div>
            </div>

            {/* Dashboard Table Preview */}
            <div className="p-5 bg-white">
              <div className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="text-gray-400">
                    <tr>
                      <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest">Creator</th>
                      <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest">Platform</th>
                      <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest">Status</th>
                      <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-right">Views</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50/50">
                    {[
                      { name: "MrBeast", handle: "@mrbeast", platform: "YT", status: "Replied", statusColor: "green", views: "142M", img: "/mr-beast.jpg" },
                      { name: "MKBHD", handle: "@mkbhd", platform: "YT", status: "Follow-up", statusColor: "yellow", views: "18M", img: "/mkbhd.jpg" },
                      { name: "Charli D'Amelio", handle: "@charlidamelio", platform: "TT", status: "Sent", statusColor: "blue", views: "25M", img: "/charli.jpg" },
                      { name: "Kim Kardashian", handle: "@kimkardashian", platform: "IG", status: "Replied", statusColor: "green", views: "4.2M", img: "/kim.jpg" },
                      { name: "Dude Perfect", handle: "@dudeperfect", platform: "YT", status: "Sent", statusColor: "blue", views: "12M", img: "/dude.jpg" },
                    ].map((row, i) => {
                      const statusStyles: Record<string, string> = {
                        green: "bg-green-100 text-green-700",
                        yellow: "bg-yellow-100 text-yellow-700",
                        blue: "bg-blue-100 text-blue-700",
                      };
                      return (
                        <tr key={i}>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                                {row.img ? (
                                  <img src={row.img} alt={row.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="font-bold text-[9px] text-gray-400">{row.name.substring(0, 2).toUpperCase()}</span>
                                )}
                              </div>
                              <div className="truncate">
                                <div className="font-bold text-gray-900 text-[11px] truncate">{row.name}</div>
                                <div className="text-[9px] text-gray-400 truncate">{row.handle}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center">
                              {row.platform === "YT" && (
                                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                                </svg>
                              )}
                              {row.platform === "TT" && (
                                <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.49-3.35-3.98-5.6-1.11-5.09 2.79-10.03 7.9-10.05v4.06c-1.31.06-2.6.83-3.04 2.08-.2 1.41.61 2.87 2.05 3.11 1.25.26 2.53-.29 3.03-1.47.16-.62.24-1.27.24-1.92V.02z" />
                                </svg>
                              )}
                              {row.platform === "IG" && (
                                <svg className="w-4 h-4 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tight ${statusStyles[row.statusColor]}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-3 py-3 font-mono text-gray-400 text-[9px] text-right">{row.views}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Email Sent Toast Overlay */}
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-xl p-3 rounded-xl shadow-2xl border border-gray-100 flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-700">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white shadow-lg shadow-green-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <div className="text-xs font-black text-gray-900 leading-none mb-1">Email Sent</div>
                  <div className="text-[10px] text-gray-500 font-bold">to 5 creators</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. What It Does - Tighter Padding */}
      <section className="py-16 bg-white/50 border-y border-gray-200/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-black mb-1">Find creators</h3>
              <p className="text-sm text-gray-600 font-medium">AI filters by niche, platform, and audience</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                <Send className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-black mb-1">Contact automatically</h3>
              <p className="text-sm text-gray-600 font-medium">Personalized emails & follow-ups</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-black mb-1">Track responses</h3>
              <p className="text-sm text-gray-600 font-medium">One dashboard, zero chaos</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Who It’s for & Steps - Combined & Condensed */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="lg:w-1/3 pt-8">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Built For</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-2xl font-black text-black">
                <Building2 className="w-6 h-6 text-gray-300" /> Agencies
              </div>
              <div className="flex items-center gap-4 text-2xl font-black text-black">
                <Rocket className="w-6 h-6 text-gray-300" /> DTC brands
              </div>
              <div className="flex items-center gap-4 text-2xl font-black text-black">
                <Users className="w-6 h-6 text-gray-300" /> Teams
              </div>
            </div>
          </div>

          <div className="flex-1">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 lg:ml-2">How it works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { step: "01", text: "Choose your creator criteria" },
                { step: "02", text: "AI handles outreach" },
                { step: "03", text: "You get deals" },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-[24px] bg-white border border-gray-100 shadow-sm transition-all hover:translate-y-[-2px]">
                  <div className="text-2xl font-black text-black mb-3">{item.step}</div>
                  <p className="text-[15px] font-bold text-black leading-tight">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Final CTA - Tightened */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-black rounded-[40px] p-12 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <h2 className="text-3xl sm:text-4xl font-black mb-8 tracking-tight relative z-10">
            Start creator outreach<br /> without the manual work.
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <Link href="/book" className="px-8 py-4 bg-white text-black rounded-full hover:bg-gray-100 transition-all font-bold text-lg">
              Book a Demo
            </Link>
            <Link href="/signup" className="px-8 py-4 bg-white/10 border border-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-all font-bold text-lg">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-10 border-t border-gray-200 text-gray-400">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center overflow-hidden transition-all duration-300 rotate-3 group-hover:rotate-6 group-hover:scale-110">
              <img src="/v-nav.png" alt="V" className="w-full h-full object-contain p-0.5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-black">verality.io</span>
          </Link>
          <div className="flex gap-8 text-xs font-bold">
            <Link href="/terms" className="hover:text-black transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-black transition-colors">Privacy</Link>
          </div>
          <div className="text-xs font-bold text-gray-500">support@verality.io</div>
        </div>
      </footer>
    </main>
  );
}
