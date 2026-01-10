
"use client";

import { useEffect, useState } from "react";
import { Share2, Users, DollarSign, ExternalLink, ArrowUpRight, Search, Loader2 } from "lucide-react";

export default function AdminAffiliates() {
    const [stats, setStats] = useState([
        { label: "Total Partners", value: "-", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Pending Payouts", value: "-", icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Conversion Rate", value: "-", icon: ArrowUpRight, color: "text-green-600", bg: "bg-green-50" },
        { label: "Total Commission", value: "-", icon: Share2, color: "text-purple-600", bg: "bg-purple-50" },
    ]);

    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAffiliates() {
            try {
                const res = await fetch('/api/admin/affiliates');
                const data = await res.json();
                if (data.success) {
                    setPartners(data.affiliates);
                    setStats([
                        { label: "Total Partners", value: data.stats.totalPartners.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                        { label: "Pending Payouts", value: data.stats.pendingPayouts, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
                        { label: "Conversion Rate", value: data.stats.conversionRate, icon: ArrowUpRight, color: "text-green-600", bg: "bg-green-50" },
                        { label: "Total Commission", value: data.stats.totalCommission, icon: Share2, color: "text-purple-600", bg: "bg-purple-50" },
                    ]);
                }
            } catch (err) {
                console.error("Failed to fetch affiliates", err);
            } finally {
                setLoading(false);
            }
        }
        fetchAffiliates();
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-black">Affiliate System</h1>
                <p className="text-gray-500 mt-1">Manage referral partners and commission payouts.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                            <p className="text-xl font-black text-black">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Partner Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-black flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-400" />
                        Top Partners
                    </h3>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search partners..."
                            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Partner</th>
                                <th className="px-6 py-4">Ref Code</th>
                                <th className="px-6 py-4 text-center">Clicks</th>
                                <th className="px-6 py-4 text-center">Conversions</th>
                                <th className="px-6 py-4 text-right">Earnings</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading partners...
                                    </td>
                                </tr>
                            ) : partners.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-bold">
                                        No affiliate partners found.
                                    </td>
                                </tr>
                            ) : (
                                partners.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-black">{p.name}</div>
                                            <div className="text-xs text-gray-500">{p.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-black">{p.code}</code>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm font-medium text-black">{p.clicks}</td>
                                        <td className="px-6 py-4 text-center text-sm font-medium text-black">{p.conversions}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="font-bold text-black">{p.earnings}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="p-2 hover:bg-black hover:text-white rounded-lg transition-all">
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
