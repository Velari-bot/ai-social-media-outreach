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
  Globe,
  ArrowRight,
  XCircle
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
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Live: AI Email Outreach</span>
        </div>

        <h1 className="text-6xl sm:text-7xl lg:text-[80px] font-[850] text-[#1A1A1A] mb-8 tracking-tighter leading-[1.05] max-w-5xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          <span className="text-[#6B4BFF]">AI Social Media Outreach</span> for Creators & Brands
        </h1>

        <p className="text-xl text-gray-600 mb-10 leading-relaxed font-medium max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          Verality is the all-in-one influencer outreach software.
          <span className="block mt-2 text-gray-500">Find creators, get emails, send DMs, and track campaigns in one platform.</span>
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
          <Link
            href="/book"
            className="px-10 py-4 bg-black text-white rounded-full hover:bg-gray-800 hover:scale-105 transition-all font-bold text-lg shadow-xl shadow-black/10 flex items-center gap-2"
          >
            Start Outreach Free <span className="text-white/60">→</span>
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

      {/* Problem / Solution Section */}
      <section className="py-24 bg-white border-y border-gray-100">
        <div className="max-w-[1440px] px-6 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-[850] text-[#1A1A1A] mb-4">Why traditional outreach fails.</h2>
            <p className="text-lg text-gray-500">
              Most brands struggle to scale influencer marketing because manual work is slow, and "databases" don't do the heavy lifting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Old Way */}
            <div className="bg-red-50/50 p-10 rounded-[32px] border border-red-100">
              <h3 className="text-red-900 font-bold text-xl mb-6 flex items-center gap-2">
                <XCircle className="w-6 h-6 text-red-500" /> The Old Way
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-4 text-gray-700 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-300 mt-2.5 flex-shrink-0" />
                  Manually searching hashtags on TikTok/IG for hours.
                </li>
                <li className="flex gap-4 text-gray-700 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-300 mt-2.5 flex-shrink-0" />
                  Copy-pasting "Hey [Name]" into 50 different DMs.
                </li>
                <li className="flex gap-4 text-gray-700 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-300 mt-2.5 flex-shrink-0" />
                  Tracking replies in a messy, outdated Google Sheet.
                </li>
                <li className="flex gap-4 text-gray-700 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-300 mt-2.5 flex-shrink-0" />
                  Getting ignored because your messaging is generic.
                </li>
              </ul>
            </div>

            {/* Verality Way */}
            <div className="bg-green-50/50 p-10 rounded-[32px] border border-green-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 blur-3xl rounded-full" />
              <h3 className="text-green-900 font-bold text-xl mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" /> The Verality Way
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-4 text-gray-800 font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5 flex-shrink-0" />
                  AI finds 1,000+ perfectly matched creators in seconds.
                </li>
                <li className="flex gap-4 text-gray-800 font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5 flex-shrink-0" />
                  Personalized emails sent automatically at scale.
                </li>
                <li className="flex gap-4 text-gray-800 font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5 flex-shrink-0" />
                  Auto-follow ups ensure you never miss a reply.
                </li>
                <li className="flex gap-4 text-gray-800 font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5 flex-shrink-0" />
                  One dashboard to manage relationships and deals.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IS THIS FOR? */}
      <section className="py-24 max-w-[1440px] mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-[850] text-[#1A1A1A] mb-4">Who uses Verality?</h2>
          <p className="text-lg text-gray-500">Built for teams that need to scale relationships, not administrative work.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Building2, title: "DTC Brands", desc: "Scale your seeding campaigns efficiently. Find micro-influencers who actually convert without hiring a full agency." },
            { icon: Users, title: "Marketing Agencies", desc: "Manage outreach for multiple clients in one place. Reduce improved profit margins by automating the busy work." },
            { icon: Rocket, title: "Talent Managers", desc: "Find new talent to sign. Use our search tools to spot rising stars before they go viral and get signed by big firms." }
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-3xl p-8 hover:bg-white hover:shadow-xl transition-all border border-gray-100">
              <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-6">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-gray-500 leading-relaxed font-medium">{item.desc}</p>
            </div>
          ))}
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
              <p className="text-gray-500 font-medium max-w-sm">Find the perfect creators instantly. Filter by engagement rate, keywords, niche, and follower counts across TikTok, Instagram, and YouTube.</p>
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
              <h3 className="text-2xl font-bold mb-3">Automated Email Drip</h3>
              <p className="text-gray-500 font-medium">Set up 3-step email sequences. Verality stops the sequence automatically when a creator replies.</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-[32px] p-8 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
            <div className="relative z-10">
              <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-[3deg] group-hover:rotate-0 transition-all duration-300">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Live Pipeline</h3>
              <p className="text-gray-500 font-medium">Kanban-style board to track every relationship. Drag and drop to move creators from 'Contacted' to 'Negotiating'.</p>
            </div>
          </div>

          {/* Card 4 - Full Width */}
          <div className="bg-[#1A1A1A] rounded-[32px] p-8 md:col-span-2 border border-black shadow-sm hover:shadow-xl transition-all duration-300 text-white group overflow-hidden relative flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 relative z-10">
              <h3 className="text-2xl font-bold mb-3">Collaborate with your team</h3>
              <p className="text-gray-400 font-medium mb-6">Invite team members to manage different campaigns. Centralize your creator database so no contact is ever lost.</p>
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

      {/* SEO Content: "What is AI Creator Outreach?" */}
      <section className="py-20 bg-gray-50 border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">What is AI Creator Outreach?</h2>
          <div className="prose text-gray-600">
            <p className="mb-4">
              AI Creator Outreach is the process of using artificial intelligence to automate the labor-intensive parts of influencer marketing: finding the right influencers, finding their verified email addresses, and sending personalized outreach messages.
            </p>
            <p className="mb-4">
              Traditionally, brands would hire virtual assistants to manually scroll through Instagram or TikTok, copy-pasting info into spreadsheets. This approach is slow, error-prone, and unscalable.
            </p>
            <p>
              With Verality, you can replace this entire manual workflow. Our AI scans millions of profiles to find creators that match your exact parameters (like engagement rate, location, and niche), enriches their data to find personal emails, and manages the initial conversation—allowing you to focus on building relationships and strategy.
            </p>
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
            <p className="mt-8 text-white/40 text-sm font-medium">
              No credit card required. Cancel anytime. <br />
              <Link href="/privacy-policy" className="hover:text-white underline decoration-white/30 underline-offset-4">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </section>

    </main>
  );
}
