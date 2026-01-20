"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { ArrowRight, Mail } from "lucide-react";
import toast from "react-hot-toast";

export default function NewsletterPage() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API call for now since we don't have a real newsletter endpoint yet
        // In a real app, this would hit /api/newsletter/subscribe
        setTimeout(() => {
            setLoading(false);
            setSubmitted(true);
            toast.success("Welcome to the newsletter!");
            setEmail("");
        }, 1000);
    };

    return (
        <main className="min-h-screen relative font-sans selection:bg-black selection:text-white bg-white overflow-hidden">
            <Navbar />

            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6B4BFF]/10 blur-[120px] rounded-full mix-blend-multiply animate-blob pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FF5252]/5 blur-[120px] rounded-full mix-blend-multiply animate-blob animation-delay-4000 pointer-events-none z-0" />

            {/* Grid Pattern Overlay */}
            <div
                className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
                style={{
                    backgroundImage: `
                    linear-gradient(to right, #F3F1EB 1px, transparent 1px),
                    linear-gradient(to bottom, #F3F1EB 1px, transparent 1px)
                  `,
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="pt-32 pb-20 px-6 max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#6B4BFF]/10 border border-[#6B4BFF]/20 text-[#6B4BFF] text-xs font-black uppercase tracking-[0.2em] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="w-2 h-2 rounded-full bg-[#6B4BFF] animate-pulse" />
                        Weekly Creator Tactics
                    </div>

                    <h1 className="text-5xl md:text-8xl font-black text-gray-900 mb-6 tracking-tighter leading-[1.05] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        The <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6B4BFF] via-purple-400 to-[#6B4BFF] animate-text-shimmer bg-[length:200%_auto]">Outreach OS</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-500 font-medium leading-relaxed max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                        Master the creator economy with weekly playbooks, teardowns, and templates. Delivered every Tuesday.
                    </p>
                </div>

                <div className="max-w-xl mx-auto relative animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    {/* Card Decoration */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#6B4BFF] to-purple-400 rounded-[32px] blur opacity-25" />

                    <div className="relative bg-white rounded-[32px] p-8 md:p-12 border border-gray-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)]">
                        {!submitted ? (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                                <div>
                                    <label htmlFor="email" className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Work Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#6B4BFF] w-5 h-5" />
                                        <input
                                            type="email"
                                            id="email"
                                            required
                                            placeholder="sarah@agency.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6B4BFF]/20 focus:bg-white transition-all text-lg font-medium"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl hover:bg-gray-900 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-black/10 group"
                                >
                                    {loading ? "Adding you..." : "Join 1,200+ Readers"}
                                    {!loading && <ArrowRight className="w-6 h-6 text-[#6B4BFF] group-hover:translate-x-1 transition-transform" />}
                                </button>

                                <div className="flex items-center justify-center gap-2 mt-2">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        No spam. Just value. Unsubscribe anytime.
                                    </p>
                                </div>
                            </form>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-12">
                                    <ArrowRight className="w-10 h-10 -rotate-45" />
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">You're on the list!</h3>
                                <p className="text-gray-500 text-lg font-medium leading-relaxed">Welcome to the inner circle. We just sent your first playbook to your inbox.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Topics Preview / Social Proof */}
                <div className="mt-32 max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em]">Upcoming in February</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                        {[
                            { title: "The 2026 creator negotiation playbook", tag: "Negotiation", issue: "Issue #43" },
                            { title: "The 'Magic Email' template with 60% reply rate", tag: "Templates", issue: "Issue #44", featured: true },
                            { title: "Automating your first 100 outreaches", tag: "Systems", issue: "Issue #45" },
                        ].map((item, i) => (
                            <div key={i} className={`p-8 rounded-[32px] border transition-all duration-500 group cursor-default ${item.featured ? 'bg-black text-white border-black shadow-2xl shadow-black/20 scale-105 relative z-10' : 'bg-white text-gray-900 border-gray-100 hover:border-[#6B4BFF]/30 hover:shadow-xl hover:-translate-y-1'}`}>
                                <div className="flex items-center justify-between mb-6">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${item.featured ? 'bg-[#6B4BFF] text-white' : 'bg-gray-50 text-gray-400'}`}>{item.tag}</span>
                                    <span className="text-[10px] font-bold opacity-50">{item.issue}</span>
                                </div>
                                <h3 className="font-black text-xl mb-4 leading-tight group-hover:text-[#6B4BFF] transition-colors">{item.title}</h3>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3].map((dot) => (
                                        <div key={dot} className={`w-1 h-1 rounded-full ${item.featured ? 'bg-gray-700' : 'bg-gray-100'}`} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
