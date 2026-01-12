"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import AmbientBlooms from "@/components/AmbientBlooms";
import {
  Search,
  Send,
  BarChart3,
  Building2,
  Rocket,
  Users,
  CheckCircle2,
  Zap,
  Globe
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen relative z-10 font-sans selection:bg-black selection:text-white pb-20">
      <Navbar />

      <AmbientBlooms bloomCount={8} />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-[1440px] mx-auto flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">New: Auto-Dm Feature</span>
        </div>

        <h1 className="text-6xl sm:text-7xl lg:text-[90px] font-[850] text-[#1A1A1A] mb-8 tracking-tighter leading-[1.05] max-w-5xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          Find, Contact, <span className="text-[#1A1A1A]">Close.</span>
          <br className="hidden sm:block" /> <span className="font-cursive font-normal text-8xl lg:text-[110px] relative -mt-4 block py-2 text-[#6B4BFF]">Automatically.</span>
        </h1>

        <p className="text-xl text-gray-600 mb-10 leading-relaxed font-medium max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          The all-in-one platform to find creators, send personalized outreach, and track results. Stop using spreadsheets. Start closing deals.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
          <Link
            href="/book"
            className="px-10 py-4 bg-black text-white rounded-full hover:bg-gray-800 hover:scale-105 transition-all font-bold text-lg shadow-xl shadow-black/10 flex items-center gap-2"
          >
            Get Started Free <span className="text-white/60">→</span>
          </Link>
          <Link
            href="/demo"
            className="px-10 py-4 bg-white text-black border border-gray-200 rounded-full hover:bg-gray-50 hover:scale-105 transition-all font-bold text-lg shadow-sm"
          >
            View Demo
          </Link>
        </div>
      </section>

      {/* Hero Dashboard Preview */}
      <section className="px-6 max-w-[1440px] mx-auto mb-32 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
        <div className="bg-white rounded-[40px] shadow-2xl border border-gray-200/60 p-2 sm:p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white pointer-events-none" />

          <div className="relative bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
            {/* Window Controls */}
            <div className="h-14 border-b border-gray-100 flex items-center px-6 justify-between bg-white text-sm font-medium text-gray-400">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                <div className="w-3 h-3 rounded-full bg-green-400/80" />
              </div>
              <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100">
                <Globe className="w-3 h-3" />
                verality.io/dashboard
              </div>
              <div className="text-xs font-medium px-3 py-1 bg-gray-100 rounded-full text-gray-500">
                v2.4.0
              </div>
            </div>

            {/* Dashboard Mockup Content */}
            <div className="p-8 bg-[#FAFAFA]">
              <div className="bg-white rounded-[24px] border border-gray-200/60 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-black">Active Campaigns</h3>
                  <div className="flex gap-2">
                    <div className="px-3 py-1 bg-black text-white text-xs font-bold rounded-full">Filter</div>
                    <div className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">Export</div>
                  </div>
                </div>

                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-gray-400 text-xs uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-8 py-4 font-black">Creator</th>
                      <th className="px-8 py-4 font-black">Platform</th>
                      <th className="px-8 py-4 font-black">Status</th>
                      <th className="px-8 py-4 font-black text-right">Engagement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm font-medium">
                    {[
                      { name: "MrBeast", handle: "@mrbeast", platform: "YT", status: "Replied", statusColor: "green", views: "142M", img: "/mr-beast.jpg" },
                      { name: "MKBHD", handle: "@mkbhd", platform: "YT", status: "Follow-up", statusColor: "yellow", views: "18M", img: "/mkbhd.jpg" },
                      { name: "Charli D'Amelio", handle: "@charlidamelio", platform: "TT", status: "Sent", statusColor: "blue", views: "25M", img: "/charli.jpg" },
                      { name: "Kim Kardashian", handle: "@kimkardashian", platform: "IG", status: "Replied", statusColor: "green", views: "4.2M", img: "/kim.jpg" },
                      { name: "Dude Perfect", handle: "@dudeperfect", platform: "YT", status: "Sent", statusColor: "blue", views: "12M", img: "/dude.jpg" },
                    ].map((row, i) => (
                      <tr key={i} className="group hover:bg-gray-50 transition-colors">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shadow-sm border border-white">
                              {row.img ? <img src={row.img} alt={row.name} className="w-full h-full object-cover" /> : null}
                            </div>
                            <div>
                              <div className="text-gray-900 font-bold">{row.name}</div>
                              <div className="text-gray-400 text-xs">{row.handle}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-2">
                            {row.platform === "YT" && <div className="p-1.5 bg-red-100 rounded-lg text-red-600"><Globe className="w-4 h-4" /></div>}
                            {row.platform === "TT" && <div className="p-1.5 bg-black/10 rounded-lg text-black"><Globe className="w-4 h-4" /></div>}
                            {row.platform === "IG" && <div className="p-1.5 bg-pink-100 rounded-lg text-pink-600"><Globe className="w-4 h-4" /></div>}
                            <span className="font-bold text-gray-700">{row.platform === "YT" ? "YouTube" : row.platform === "TT" ? "TikTok" : "Instagram"}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${row.statusColor === "green" ? "bg-green-50 text-green-700 border-green-200" :
                            row.statusColor === "yellow" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                              "bg-blue-50 text-blue-700 border-blue-200"
                            }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-right font-mono text-gray-500">
                          {row.views}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props / Bento Grid */}
      <section className="px-6 max-w-[1440px] mx-auto mb-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-[850] text-[#1A1A1A] mb-6 tracking-tight">Everything you need to <br />scale your outreach.</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">Stop juggling tools. Verality unifies search, email, and CRM into one powerful platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white rounded-[32px] p-8 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 md:col-span-2 group overflow-hidden relative">
            <div className="relative z-10">
              <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-[-5deg] group-hover:rotate-0 transition-all duration-300">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">AI-Powered Search</h3>
              <p className="text-gray-500 font-medium max-w-sm">Find the perfect creators instantly. Filter by engagement rate, past sponsorship performance, and audience demographics.</p>
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:opacity-20 transition-opacity">
              <Search className="w-64 h-64" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-[32px] p-8 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
            <div className="relative z-10">
              <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-[5deg] group-hover:rotate-0 transition-all duration-300">
                <Send className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">One-Click Outreach</h3>
              <p className="text-gray-500 font-medium">Send personalized emails at scale. Auto-follow up until you get a reply.</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-[32px] p-8 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
            <div className="relative z-10">
              <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-[3deg] group-hover:rotate-0 transition-all duration-300">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Live Analytics</h3>
              <p className="text-gray-500 font-medium">Track open rates, reply rates, and deal value in real-time.</p>
            </div>
          </div>

          {/* Card 4 - Full Width */}
          <div className="bg-[#1A1A1A] rounded-[32px] p-8 md:col-span-2 border border-black shadow-sm hover:shadow-xl transition-all duration-300 text-white group overflow-hidden relative flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 relative z-10">
              <h3 className="text-2xl font-bold mb-3">Built for teams</h3>
              <p className="text-gray-400 font-medium mb-6">Collaborate with your team, assign creators, and track performance together.</p>
              <div className="flex gap-4">
                <div className="flex -space-x-3">
                  {[
                    "/mr-beast.jpg",
                    "/mkbhd.jpg",
                    "/kim.jpg",
                    "/dude.jpg"
                  ].map((src, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#1A1A1A] overflow-hidden">
                      <img src={src} alt="User" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="text-sm font-bold flex items-center text-gray-300">+12 active now</div>
              </div>
            </div>
            <div className="flex-1 w-full h-full min-h-[200px] relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A] via-transparent to-transparent z-10" />
              <img
                src="/team-dashboard.png"
                alt="Team Dashboard"
                className="absolute top-0 right-[-20px] w-[110%] h-full object-cover rounded-l-xl opacity-90 group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 max-w-[1440px] mx-auto">
        <div className="bg-black rounded-[48px] p-12 md:p-24 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-20 pointer-events-none mix-blend-overlay" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/30 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/30 blur-[150px] rounded-full mix-blend-screen" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-[850] mb-8 tracking-tighter">Ready to automate your growth?</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/book" className="px-10 py-5 bg-white text-black rounded-full hover:bg-gray-100 font-bold text-xl shadow-xl hover:scale-105 transition-all">
                Book a Demo Call
              </Link>
            </div>
            <p className="mt-8 text-white/40 text-sm font-medium">No credit card required. Cancel anytime.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-32 border-t border-gray-200">
        <div className="max-w-[1440px] mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <img src="/v-nav.png" alt="V" className="w-4 h-4" />
            </div>
            <span className="font-bold text-xl tracking-tight text-black">verality.io</span>
          </div>
          <div className="flex gap-8 text-sm font-semibold text-gray-500">
            <Link href="/terms" className="hover:text-black">Terms</Link>
            <Link href="/privacy" className="hover:text-black">Privacy</Link>
            <Link href="/support" className="hover:text-black">Support</Link>
          </div>
          <div className="text-sm text-gray-400 font-medium">
            © 2026 Verality Inc.
          </div>
        </div>
      </footer>
    </main>
  );
}
