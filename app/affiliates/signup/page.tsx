
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth-helpers";
import { fetchAffiliateAccount, createAffiliateAccountApi } from "@/lib/api-client";
import toast from "react-hot-toast";

export default function AffiliateSignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function init() {
            const currentUser = await getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                // Check if already an affiliate
                try {
                    const res = await fetchAffiliateAccount();
                    if (res.success && res.account) {
                        router.push("/affiliates/dashboard");
                        return;
                    }
                } catch (e) {
                    // Ignore error, means no account probably
                }
            }
            setLoading(false);
        }
        init();
    }, [router]);

    const handleJoin = async () => {
        if (!user) {
            router.push("/login?redirect=/affiliates/signup");
            return;
        }

        setSubmitting(true);
        try {
            const res = await createAffiliateAccountApi(user.email);
            if (res.success) {
                toast.success("Welcome to the partner program!");
                router.push("/affiliates/dashboard");
            } else {
                toast.error("Failed to creat account.");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#F3F1EB]">
            <Navbar />

            <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold mb-6 tracking-wide uppercase">
                        Partner Program
                    </span>
                    <h1 className="text-5xl md:text-6xl font-black text-[#1A1A1A] mb-8 tracking-tight">
                        Earn <span className="text-purple-600">25%</span> Recurring Commission.
                    </h1>
                    <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                        Join the Verality Affiliate Program. Help creators and brands automate their outreach, and build a passive income stream for yourself.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-4xl mb-4">💰</div>
                        <h3 className="text-xl font-bold mb-2 text-black">High Commissions</h3>
                        <p className="text-gray-900">Get 25% of every sale you refer, recurring for the lifetime of the customer.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-4xl mb-4">📈</div>
                        <h3 className="text-xl font-bold mb-2 text-black">Real-time Tracking</h3>
                        <p className="text-gray-900">Monitor clicks, conversions, and earnings in your dedicated dashboard.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-4xl mb-4">🤝</div>
                        <h3 className="text-xl font-bold mb-2 text-black">Monthly Payouts</h3>
                        <p className="text-gray-900">Reliable payouts via Stripe or PayPal every single month.</p>
                    </div>
                </div>

                <div className="bg-black text-white rounded-3xl p-12 text-center max-w-4xl mx-auto relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-900/50 to-blue-900/50 -z-0"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-6">Ready to start earning?</h2>

                        {loading ? (
                            <div className="h-12 w-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                        ) : (
                            <button
                                onClick={handleJoin}
                                disabled={submitting}
                                className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform disabled:opacity-75 disabled:hover:scale-100"
                            >
                                {submitting ? "Creating Account..." : user ? "Activate Affiliate Account" : "Login to Join Program"}
                            </button>
                        )}

                        {!user && !loading && (
                            <p className="mt-4 text-sm text-gray-400">
                                You'll need a Verality account first. It's free.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
