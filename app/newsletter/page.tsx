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
        <main className="min-h-screen relative font-sans selection:bg-black selection:text-white bg-[#FDFBF7]">
            <Navbar />

            <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-orange-800 text-sm font-semibold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                        Weekly Creator Economy Insights
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        The <span className="text-[#6B4BFF]">Outreach</span> OS
                    </h1>

                    <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                        Weekly tactics on scaling influencer campaigns. No fluff, just playbooks.
                    </p>
                </div>

                <div className="bg-white rounded-3xl p-8 md:p-12 border border-gray-200 shadow-xl shadow-gray-200/50 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">Work Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="email"
                                        id="email"
                                        required
                                        placeholder="sarah@agency.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-lg"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? "Joining..." : "Join the Newsletter"}
                                {!loading && <ArrowRight className="w-5 h-5" />}
                            </button>

                            <p className="text-xs text-center text-gray-400 mt-4">
                                We respect your inbox. Unsubscribe at any time.
                            </p>
                        </form>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ArrowRight className="w-8 h-8 -rotate-45" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">You're on the list!</h3>
                            <p className="text-gray-600">Check your inbox for your first issue. We sent over a welcome guide to get you started.</p>
                        </div>
                    )}
                </div>

                {/* Topics Preview / Social Proof */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Upcoming</div>
                        <h3 className="font-bold text-gray-900 text-lg mb-2">How to negotiate with creators without a budget</h3>
                        <p className="text-gray-500 text-sm">Negotiation Playbook</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Upcoming</div>
                        <h3 className="font-bold text-gray-900 text-lg mb-2">The "Magic Email" template with 60% reply rate</h3>
                        <p className="text-gray-500 text-sm">Templates & Scripts</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Upcoming</div>
                        <h3 className="font-bold text-gray-900 text-lg mb-2">Automating your first 100 outreaches</h3>
                        <p className="text-gray-500 text-sm">Systemization</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
