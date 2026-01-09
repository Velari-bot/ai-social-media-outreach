
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth-helpers";
import { fetchAffiliateAccount } from "@/lib/api-client";
import toast from "react-hot-toast";

interface AffiliateAccount {
    referral_code: string;
    total_earnings: number;
    pending_earnings: number;
    clicks: number;
    conversions: number;
    commission_rate: number;
}

export default function AffiliateDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [account, setAccount] = useState<AffiliateAccount | null>(null);

    useEffect(() => {
        async function init() {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    router.push("/login?redirect=/affiliates/dashboard");
                    return;
                }

                const res = await fetchAffiliateAccount();
                if (res.success && res.account) {
                    setAccount(res.account);
                } else {
                    router.push("/affiliates/signup");
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, [router]);

    const copyLink = () => {
        if (!account) return;
        const link = `${window.location.origin}?ref=${account.referral_code}`;
        navigator.clipboard.writeText(link);
        toast.success("Referral link copied!");
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-[#F3F1EB] flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading partner data...</p>
                </div>
            </main>
        );
    }

    if (!account) return null;

    return (
        <main className="min-h-screen bg-[#F5F3EF]">
            <Navbar />

            <div className="pt-28 pb-12 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-[#1A1A1A] mb-2">Affiliate Dashboard</h1>
                        <p className="text-gray-500">Track your earnings and referrals.</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600">
                        Commission Rate: <span className="text-black font-bold">{(account.commission_rate * 100).toFixed(0)}%</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard label="Total Earnings" value={`$${account.total_earnings.toFixed(2)}`} icon="💵" />
                    <StatCard label="Pending Payout" value={`$${account.pending_earnings.toFixed(2)}`} icon="⏳" />
                    <StatCard label="Total Clicks" value={account.clicks.toLocaleString()} icon="🖱️" />
                    <StatCard label="Conversions" value={account.conversions.toLocaleString()} icon="✅" />
                </div>

                {/* Link Section */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-10">
                    <h2 className="text-xl font-bold mb-6 text-black">Your Referral Link</h2>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-600 font-mono text-sm flex items-center overflow-hidden">
                            {typeof window !== 'undefined' ? window.location.origin : ''}?ref={account.referral_code}
                        </div>
                        <button
                            onClick={copyLink}
                            className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
                        >
                            Copy Link
                        </button>
                    </div>
                    <p className="text-sm text-gray-400 mt-4">
                        Share this link on social media, your blog, or with friends. When they sign up, you earn 25%.
                    </p>
                </div>

                {/* Payout Info Placeholder */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 opacity-60">
                        <h3 className="font-bold mb-4 text-black">Recent Referrals</h3>
                        <div className="h-32 flex items-center justify-center text-gray-400 text-sm italic border-2 border-dashed border-gray-100 rounded-xl">
                            No referrals yet.
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold mb-4 text-black">Payout Settings</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Payouts are processed automatically via Stripe on the 1st of every month for earnings over $50.
                        </p>
                        <button className="text-purple-600 font-bold text-sm hover:underline">
                            Connect Stripe Account &rarr;
                        </button>
                    </div>
                </div>

            </div>
        </main>
    );
}

function StatCard({ label, value, icon }: { label: string, value: string, icon: string }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-3xl font-black text-[#1A1A1A] mb-1">{value}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</div>
        </div>
    );
}
