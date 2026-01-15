
"use client";

import { useState, useEffect } from "react";
import { CreditCard, DollarSign, ArrowUpRight, ArrowDownRight, RefreshCcw, ExternalLink, Loader2, Trash2, TrendingUp } from "lucide-react";

export default function AdminStripe() {
    const [revenueStats, setRevenueStats] = useState([
        { label: "Net Revenue", value: "-", icon: DollarSign, trend: "...", trendUp: true, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Gross Revenue", value: "-", icon: TrendingUp, trend: "...", trendUp: true, color: "text-green-600", bg: "bg-green-50" },
        { label: "Stripe Fees", value: "-", icon: ArrowDownRight, trend: "...", trendUp: false, color: "text-orange-600", bg: "bg-orange-50" },
        { label: "Active Subs", value: "-", icon: RefreshCcw, trend: "...", trendUp: true, color: "text-purple-600", bg: "bg-purple-50" },
    ]);

    const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBilling() {
            try {
                const res = await fetch('/api/admin/billing');
                const data = await res.json();
                if (data.success) {
                    setRecentTransactions(data.transactions);
                    setRevenueStats([
                        { label: "Net Revenue", value: data.stats.totalRevenue, icon: DollarSign, trend: "+0%", trendUp: true, color: "text-blue-600", bg: "bg-blue-50" },
                        { label: "Gross Revenue", value: data.stats.grossRevenue, icon: TrendingUp, trend: "+0%", trendUp: true, color: "text-green-600", bg: "bg-green-50" },
                        { label: "Stripe Fees", value: data.stats.stripeFees, icon: ArrowDownRight, trend: "-2.9%+", trendUp: false, color: "text-orange-600", bg: "bg-orange-50" },
                        { label: "Active Subs", value: data.stats.activeSubs.toString(), icon: RefreshCcw, trend: "+0%", trendUp: true, color: "text-purple-600", bg: "bg-purple-50" },
                    ]);
                }
            } catch (err) {
                console.error("Failed to fetch billing", err);
            } finally {
                setLoading(false);
            }
        }
        fetchBilling();
    }, []);

    const handleDeleteTransaction = async (transactionId: string) => {
        if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/billing/transaction?id=${transactionId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                // Remove from local state
                setRecentTransactions(prev => prev.filter(tx => tx.id !== transactionId));
            } else {
                alert('Failed to delete transaction');
            }
        } catch (err) {
            console.error('Error deleting transaction:', err);
            alert('Error deleting transaction');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-black">Stripe & Billing</h1>
                    <p className="text-gray-500 mt-1">Monitor revenue, subscriptions, and payment health.</p>
                </div>
                <button className="bg-[#635BFF] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#5851E0] transition-all shadow-lg shadow-[#635BFF]/20">
                    <ExternalLink className="w-5 h-5" />
                    Stripe Dashboard
                </button>
            </div>

            {/* Revenue Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {revenueStats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-40">
                        <div className="flex justify-between items-start">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${stat.trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {stat.trend}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-black text-black">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Transactions */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-black">Recent Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Transaction ID</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Time</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-bold">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading transactions...
                                    </td>
                                </tr>
                            ) : recentTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-bold">
                                        No transactions found.
                                    </td>
                                </tr>
                            ) : (
                                recentTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-black">{tx.id}</td>
                                        <td className="px-6 py-4 font-bold text-black">{tx.customer}</td>
                                        <td className="px-6 py-4 font-black text-black">{tx.amount}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${tx.status === 'Succeeded' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-xs text-gray-500 font-medium">{tx.date}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDeleteTransaction(tx.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete transaction"
                                            >
                                                <Trash2 className="w-4 h-4" />
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
