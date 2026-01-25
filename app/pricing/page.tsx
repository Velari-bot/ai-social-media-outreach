"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

const tiers = [
    {
        name: "Lite",
        price: 49,
        dailyLimit: 25,
        monthlyVolume: "750",
        costPerCreator: "0.04",
        description: "For extension users.",
        bestFor: "solo research",
        features: [
            "Browser Extension Access",
            "750 Lookups / Month",
            "Verified Emails",
            "No Auto-Outreach",
            "Export to CSV"
        ]
    },
    {
        name: "Starter",
        price: 399,
        dailyLimit: 50,
        monthlyVolume: "1,500",
        costPerCreator: "0.20",
        description: "For emerging brands.",
        bestFor: "solo founders, small teams",
        features: [
            "1,500 creators / month",
            "Automated Deal Outreach",
            "Negotiation Hub",
            "Campaign Management",
            "Email Support"
        ]
    },
    {
        name: "Growth",
        price: 799,
        dailyLimit: 150,
        monthlyVolume: "4,500",
        costPerCreator: "0.13",
        isDark: true,
        description: "For scaling teams.",
        bestFor: "performance brands, ecom teams",
        features: [
            "4,500 creators / month",
            "Everything in Starter",
            "Intent Detection (AI)",
            "Enrichment Cost Savings",
            "Priority Support"
        ]
    },
    {
        name: "Agency",
        price: "Custom",
        priceText: "Let's talk",
        description: "For multi-client ops.",
        bestFor: "agencies, high-volume teams",
        isCustom: true,
        features: [
            "Unlimited Volume",
            "White-label Reports",
            "Dedicated Success Manager",
            "API Access",
            "Slack Channel",
            "Custom Integrations"
        ]
    }
];

export default function PricingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#F3F1EB] flex items-center justify-center">Loading pricing...</div>}>
            <PricingContent />
        </Suspense>
    );
}

function PricingContent() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUserId(user ? user.uid : null);
            setUserEmail(user ? user.email : null);
        });
        return () => unsubscribe();
    }, []);

    const handleCheckout = async (tier: any) => {
        if (tier.isCustom) {
            window.location.href = "/book";
            return;
        }

        if (!userId) {
            toast.error("Please log in to choose a plan");
            router.push("/login?returnTo=/pricing");
            return;
        }

        // Next.js requires static access to process.env variables
        const priceIds: Record<string, string | undefined> = {
            "Lite": process.env.NEXT_PUBLIC_STRIPE_PRICE_LITE,
            "Starter": process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC, // Reusing Basic ID likely, pending Stripe update
            "Growth": process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,   // Reusing Pro ID likely
        };

        const priceId = priceIds[tier.name];

        if (!priceId) {
            // Fallback for demo/dev if keys aren't set
            console.warn(`Price ID not found for ${tier.name}. Checked env var: NEXT_PUBLIC_STRIPE_PRICE_${tier.name.toUpperCase()}`);
            toast.error(`Checkout not configured for ${tier.name} (Missing Price ID)`);
            return;
        }

        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId,
                    planName: tier.name,
                    userId,
                    userEmail,
                    referralCode: typeof window !== 'undefined' ? localStorage.getItem("verality_affiliate_ref") : undefined
                }),
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Failed to start checkout');
            }
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <main className="min-h-screen bg-[#F3F1EB] relative overflow-hidden font-sans selection:bg-pink-200">
            <Navbar />

            {/* Decorative Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-80 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vh] bg-gradient-to-br from-[#E8D4E3] via-[#DBCDE6] to-transparent blur-[80px]" />
                <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[70vh] bg-gradient-to-bl from-[#DCE4F2] via-[#E6EDF5] to-transparent blur-[80px]" />
                <div className="absolute top-[20%] left-[-100px] w-[200px] h-[600px] bg-blue-400/20 blur-[100px]" />
                <div className="absolute top-[20%] right-[-100px] w-[200px] h-[600px] bg-blue-400/20 blur-[100px]" />
            </div>

            <div className="relative z-10 pt-40 pb-24 px-4 sm:px-6">
                <div className="max-w-[1600px] mx-auto">

                    {/* Header */}
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h1 className="text-5xl sm:text-6xl font-[800] text-[#1A1A1A] mb-6 tracking-tight leading-[1.1]">
                            Try for free. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8E2DE2] to-[#4A00E0] opacity-80">No card required.</span>
                        </h1>
                        <p className="text-lg text-gray-600 font-medium leading-relaxed max-w-xl mx-auto">
                            Modernize your outreach with AI at every step and <span className="font-bold text-black">smash your targets.</span>
                        </p>
                    </div>

                    {/* Pricing Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch max-w-7xl mx-auto">
                        {tiers.map((tier) => {
                            const isDark = tier.isDark;

                            return (
                                <div
                                    key={tier.name}
                                    className={`relative p-8 rounded-[32px] flex flex-col h-full transition-all duration-300 hover:-translate-y-1 ${isDark
                                        ? "bg-[#0A0A0A] text-white shadow-2xl ring-1 ring-white/10"
                                        : "bg-[#F7F5F2] text-[#1A1A1A] border border-gray-200/60 shadow-lg"
                                        }`}
                                >

                                    <div className="mb-6">
                                        <h3 className={`text-lg font-bold mb-1 ${isDark ? "text-white" : "text-[#1A1A1A]"}`}>
                                            {tier.name} Plan
                                        </h3>

                                        <div className="flex items-baseline gap-1.5 mb-2 mt-4">
                                            <span className="text-4xl font-[800] tracking-tight">
                                                {typeof tier.price === 'number' ? `$${tier.price}` : tier.priceText || tier.price}
                                            </span>
                                            {typeof tier.price === 'number' && <span className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>/ month</span>}
                                        </div>

                                        <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                            {tier.description}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => handleCheckout(tier)}
                                        className={`w-full py-3.5 rounded-full font-bold text-[15px] mb-8 transition-transform active:scale-95 text-center inline-block ${isDark
                                            ? "bg-white text-black hover:bg-gray-100"
                                            : "bg-[#0A0A0A] text-white hover:bg-gray-900"
                                            }`}
                                    >
                                        {tier.isCustom ? "Book a call" : (isDark ? "Build your plan" : "Get Started")}
                                    </button>

                                    {/* What you get */}
                                    <div className="mb-4">
                                        <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-white/40" : "text-gray-400"}`}>What you get</span>
                                    </div>

                                    {/* Feature List */}
                                    <div className="space-y-4 mb-8 flex-1">
                                        {/* Cost per creator Feature - Highlighted */}
                                        {tier.costPerCreator && (
                                            <div className="flex items-start gap-3">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isDark ? "bg-white/20" : "bg-black/10"}`}>
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <span className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>
                                                    ${tier.costPerCreator} per creator
                                                </span>
                                            </div>
                                        )}

                                        {tier.features.map((feature, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isDark ? "bg-[#333]" : "bg-[#E5E5E5]"}`}>
                                                    <svg className={`w-3 h-3 ${isDark ? "text-white" : "text-black"}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <span className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                                                    {feature}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Best For */}
                                    <div className={`mt-auto pt-6 border-t ${isDark ? "border-white/10" : "border-gray-200/60"}`}>
                                        <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-white/40" : "text-gray-400"}`}>Best for</p>
                                        <p className={`text-sm font-medium ${isDark ? "text-white/80" : "text-gray-700"}`}>
                                            {tier.bestFor}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Credit Top Ups */}
                    <div className="max-w-4xl mx-auto mt-24 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        <div className="text-center mb-10">
                            <span className="text-xs font-bold uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 mb-4 inline-block">Pay as you go</span>
                            <h2 className="text-3xl md:text-4xl font-[800] text-[#1A1A1A] tracking-tight">Need extra credits?</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { amount: "500 Credits", price: "$50", per: "$0.10 / credit", popular: false },
                                { amount: "1,000 Credits", price: "$90", per: "$0.09 / credit", popular: true },
                                { amount: "5,000 Credits", price: "$400", per: "$0.08 / credit", popular: false },
                            ].map((pack, i) => (
                                <div key={i} className={`bg-white rounded-[24px] p-6 text-center shadow-lg border relative group cursor-pointer hover:-translate-y-1 transition-transform duration-300 ${pack.popular ? 'border-purple-500 ring-4 ring-purple-500/5' : 'border-gray-100 hover:border-gray-200'}`}>
                                    {pack.popular && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                                            Best Value
                                        </div>
                                    )}
                                    <div className="text-lg font-bold text-gray-900 mb-2">{pack.amount}</div>
                                    <div className="text-4xl font-[800] text-[#1A1A1A] mb-1 tracking-tight">{pack.price}</div>
                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-6">{pack.per}</div>
                                    <button
                                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 ${pack.popular ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-200' : 'bg-white text-black border-2 border-gray-100 hover:border-gray-900 hover:bg-gray-50'}`}
                                        onClick={() => window.open('https://buy.stripe.com/test_topup', '_blank')} // Placeholder
                                    >
                                        Top Up Now
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Free Credits Banner */}
                    <div className="mt-12 bg-white/60 backdrop-blur-md rounded-[32px] p-10 md:p-14 text-center border border-white shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-50/50 to-transparent pointer-events-none" />

                        <h2 className="text-3xl font-[800] text-[#1A1A1A] mb-3 relative z-10">
                            Have questions or want custom pricing?
                        </h2>
                        <p className="text-gray-600 font-medium mb-8 max-w-lg mx-auto relative z-10">
                            Book a call with our team to discuss your specific needs.
                        </p>
                        <Link href="/book" className="px-10 py-4 bg-[#1A1A1A] text-white rounded-full font-bold text-lg hover:bg-black transition-all hover:scale-105 shadow-xl relative z-10 inline-block">
                            Book a demo call
                        </Link>

                        {/* Subtle line decoration */}
                        <svg className="absolute top-1/2 right-10 -translate-y-1/2 w-64 h-64 opacity-10 pointer-events-none text-purple-600" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                            <path d="M0,50 Q25,25 50,50 T100,50" vectorEffect="non-scaling-stroke" strokeWidth="2" />
                            <path d="M0,70 Q25,45 50,70 T100,70" vectorEffect="non-scaling-stroke" strokeWidth="2" />
                        </svg>
                    </div>
                </div>
            </div>
        </main>
    );
}
