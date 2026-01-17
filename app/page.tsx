"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import AmbientBlooms from "@/components/AmbientBlooms";
import CreatorSearch from "@/components/CreatorSearch";

import {
  Search,
  Send,
  BarChart3,
  CheckCircle2,
  Globe,
  ArrowRight,
  ShieldCheck,
  Zap,
  Star,
  Mail
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen relative z-10 font-sans selection:bg-black selection:text-white overflow-hidden">
      <Navbar />
      <AmbientBlooms bloomCount={8} />

      {/* Vivid Background Blobs (Login Style) */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FF9E0B]/30 blur-[100px] rounded-full mix-blend-multiply animate-blob pointer-events-none z-0 opacity-70" />
      <div className="absolute top-[10%] left-[-20%] w-[50%] h-[50%] bg-[#6B4BFF]/30 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-2000 pointer-events-none z-0 opacity-70" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#FF5252]/20 blur-[120px] rounded-full mix-blend-multiply animate-blob animation-delay-4000 pointer-events-none z-0 opacity-70" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #E5E7EB 1px, transparent 1px),
            linear-gradient(to bottom, #E5E7EB 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 max-w-[1440px] mx-auto flex flex-col items-center text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 hover:scale-105 transition-transform cursor-default">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 animate-text-shimmer bg-[length:200%_auto]">New: AI Email Finder</span>
        </div>

        <h1 className="text-5xl sm:text-7xl lg:text-[80px] font-bold text-gray-900 mb-6 tracking-tight leading-[1.1] max-w-5xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          Your Outreach. <br className="hidden sm:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900">Smarter. Faster. Personal.</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 mb-10 leading-relaxed font-medium max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          Stop manual searching. Start closing deals. Verality automates the entire creator outreach lifecycle—from discovery to signed contract.
        </p>

        {/* Public Creator Search Integration */}
        <div className="w-full mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-250">
          <CreatorSearch />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
          <Link
            href="/signup"
            className="btn-primary min-w-[180px] text-base py-3 h-auto"
          >
            Start for Free
          </Link>
          <Link
            href="/demo"
            className="btn-secondary min-w-[180px] text-base py-3 h-auto"
          >
            View Demo
          </Link>
        </div>
      </section>

      {/* Dashboard Preview (Hero Extension) */}
      <section className="px-6 max-w-[1440px] mx-auto -mt-0 mb-32 pt-20">
        <div className="bg-white rounded-[32px] md:rounded-[48px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-gray-200/60 p-2 sm:p-4 relative overflow-hidden ring-1 ring-gray-950/5">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white pointer-events-none" />
          <div className="relative bg-white border border-gray-100 rounded-[24px] md:rounded-[36px] overflow-hidden shadow-sm">
            {/* Browser UI */}
            <div className="h-10 border-b border-gray-100 flex items-center px-4 justify-between bg-[#FAFAFA]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              </div>
              <div className="text-[10px] font-medium text-gray-400">verality.io/dashboard</div>
              <div className="w-10" />
            </div>

            {/* Content */}
            <div className="p-6 md:p-10 bg-white">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Campaign Performance</h3>
                  <p className="text-gray-500 mt-1">Real-time overview of your active outreach.</p>
                </div>
                <div className="flex gap-2">
                  <div className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600">Last 30 days</div>
                  <div className="px-3 py-1.5 bg-black text-white rounded-lg text-sm font-medium">Export Report</div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Creators Contacted", value: "1,248", trend: "+12%", neutral: false },
                  { label: "Reply Rate", value: "48.2%", trend: "+5%", neutral: false },
                  { label: "Deals Closed", value: "86", trend: "+3", neutral: false },
                  { label: "Avg. CPM", value: "$12.50", trend: "-2%", neutral: true },
                ].map((stat, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                    <div className="text-gray-500 text-sm font-medium mb-1">{stat.label}</div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</div>
                    <div className={`text-xs font-bold ${stat.neutral ? 'text-gray-400' : 'text-green-600'} flex items-center gap-1`}>
                      {!stat.neutral && <ArrowRight className="w-3 h-3 -rotate-45" />} {stat.trend} <span className="text-gray-300 font-normal">vs last month</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Creator</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      { name: "Marques Brownlee", handle: "@mkbhd", status: "Negotiating", value: "$15,000", img: "/mkbhd.jpg" },
                      { name: "Charli D'Amelio", handle: "@charlidamelio", status: "Active", value: "$45,000", img: "/charli.jpg" },
                      { name: "MrBeast", handle: "@mrbeast", status: "Replied", value: "$250,000", img: "/mr-beast.jpg" },
                    ].map((row, i) => (
                      <tr key={i} className="bg-white hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                              {row.img && <img src={row.img} alt={row.name} className="w-full h-full object-cover" />}
                            </span>
                            <div>
                              <div className="font-bold text-gray-900 text-sm">{row.name}</div>
                              <div className="text-gray-400 text-xs">{row.handle}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-sm text-gray-600">
                          {row.value}
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

      {/* Feature Grid */}
      <section className="py-24 bg-white relative">
        <div className="max-w-[1440px] px-6 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 view-timeline">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">Everything you need to <br className="hidden md:block" />scale your outreach.</h2>
            <p className="text-lg text-gray-500">Stop juggling tools. Verality unifies search, email, and CRM into one powerful platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-[32px] p-8 md:p-10 border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-gray-200/60 transition-all duration-300 md:col-span-2 group relative overflow-hidden cursor-default">
              <div className="relative z-10 max-w-lg">
                <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">AI-Powered Creator Search</h3>
                <p className="text-gray-500 font-medium leading-relaxed">Find the perfect creators instantly. Filter by engagement rate, keywords, niche, and follower counts across all major platforms. Our AI parses millions of bio's to find exact matches.</p>
              </div>
              <div className="absolute top-1/2 right-10 -translate-y-1/2 opacity-5 hidden lg:block group-hover:opacity-10 transition-opacity duration-500">
                <Search className="w-64 h-64" />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-[32px] p-8 md:p-10 border border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300 group cursor-default">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center mb-8 shadow-lg shadow-blue-600/20 group-hover:rotate-12 transition-transform duration-300">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Smart Drip Campaigns</h3>
              <p className="text-gray-500 font-medium leading-relaxed">Set up multi-step email sequences. Verality automatically stops follow-ups when a creator replies.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-[32px] p-8 md:p-10 border border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300 group cursor-default">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center mb-8 shadow-lg shadow-purple-600/20 group-hover:-rotate-12 transition-transform duration-300">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Live Pipeline</h3>
              <p className="text-gray-500 font-medium leading-relaxed">Kanban-style board to track every relationship. Drag and drop creators through your custom deal flow.</p>
            </div>

            {/* Feature 4 (Large Visual) */}
            <div className="bg-black rounded-[32px] p-8 md:p-10 md:col-span-2 border border-gray-800 shadow-2xl text-white group overflow-hidden relative flex flex-col justify-between">
              <div className="relative z-10 max-w-lg">
                <h3 className="text-2xl font-bold mb-4">Team Collaboration</h3>
                <p className="text-gray-400 font-medium leading-relaxed mb-8">Invite your entire team. Assign specific creators to agents, track individual performance, and share notes in real-time.</p>
                <div className="flex -space-x-3">
                  {["/charli.jpg", "/dude.jpg", "/kim.jpg"].map((src, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-black overflow-hidden bg-gray-800">
                      <img src={src} className="w-full h-full object-cover opacity-80" />
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center text-xs font-bold text-white">+5</div>
                </div>
              </div>
              {/* Abstract decorative element */}
              <div className="absolute right-0 bottom-0 w-64 h-64 bg-gradient-to-tl from-purple-900/50 to-transparent rounded-full blur-3xl pointer-events-none" />
            </div>
          </div>
        </div>
      </section>



      {/* Newsletter Section - Traffic Capture */}
      <section className="py-24 px-6 border-t border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-900 text-xs font-bold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
              Free Resource
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Masterminding your outreach.</h2>
            <p className="text-gray-500 text-lg mb-8">Get our weekly "Outreach OS" newsletter. Strategies, templates, and teardowns of successful campaigns.</p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/newsletter" className="px-8 py-4 bg-black hover:bg-gray-900 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-black/20 flex items-center justify-center gap-2">
                <span className="bg-white/20 p-1 rounded-md"><Mail className="w-4 h-4" /></span>
                Join Newsletter
              </Link>
            </div>
          </div>

          <div className="flex-1 bg-gray-50 rounded-2xl p-8 border border-gray-200 relative rotate-2 hover:rotate-0 transition-transform duration-500 cursor-default">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Upcoming Issue</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">The "Magic Email" template with 60% reply rate</h3>
            <p className="text-gray-500 mb-6 text-sm">We break down exactly how specific subject lines consistently book more calls.</p>
            <div className="flex items-center gap-3 border-t border-gray-200 pt-4">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-bold text-xs">A</div>
              <div className="text-xs font-bold text-gray-900">Aiden Bender <span className="text-gray-400 font-normal ml-1">Editor</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-gray-900 rounded-[48px] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
          {/* Background Gradients */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/30 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-500/30 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">Ready to scale your outreach?</h2>
            <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">Join the new standard in influencer marketing. Start your 14-day free trial today.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/signup" className="px-8 py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg shadow-white/10">
                Get Started Free
              </Link>
              <Link href="/book" className="px-8 py-4 bg-transparent border border-gray-700 text-white rounded-xl font-bold text-lg hover:bg-white/5 transition-colors">
                Book a Demo
              </Link>
            </div>
            <p className="mt-8 text-sm text-gray-500">No credit card required. Cancel anytime.</p>
          </div>
        </div>
      </section>

    </main>
  );
}
