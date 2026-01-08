"use client";

import { useEffect, useState } from "react";
import { Users, DollarSign, Calendar, TrendingUp, Loader2 } from "lucide-react";

export default function AdminOverview() {
    const [stats, setStats] = useState([
        { label: "Total Users", value: "-", change: "...", icon: Users },
        { label: "MRR", value: "-", change: "...", icon: DollarSign },
        { label: "Booked Calls (Wk)", value: "-", change: "...", icon: Calendar },
        { label: "Active Affiliates", value: "-", change: "...", icon: TrendingUp },
    ]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/admin/stats');
                const data = await res.json();

                if (data.success) {
                    setStats([
                        { label: "Total Users", value: data.stats.totalUsers.toLocaleString(), change: "+12%", icon: Users },
                        { label: "MRR", value: `$${data.stats.mrr.toLocaleString()}`, change: "+8%", icon: DollarSign },
                        { label: "Booked Calls (Wk)", value: data.stats.bookedCallsWeek.toLocaleString(), change: "+4%", icon: Calendar },
                        { label: "Active Affiliates", value: data.stats.activeAffiliates.toLocaleString(), change: "+2%", icon: TrendingUp },
                    ]);
                }
            } catch (error) {
                console.error("Failed to load stats", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-[#1A1A1A]">Dashboard Overview</h1>
                <p className="text-gray-500 mt-1">Welcome back. Here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-400">{stat.label}</span>
                            <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                                <stat.icon className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="flex items-end gap-3">
                            {loading ? (
                                <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
                            ) : (
                                <>
                                    <span className="text-3xl font-bold text-[#1A1A1A]">{stat.value}</span>
                                    <span className="text-sm font-medium text-green-500 mb-1.5">{stat.change}</span>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Placeholder for Recent Activity */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-[400px]">
                    <h3 className="font-bold text-lg mb-4 text-black">Recent Bookings</h3>
                    <div className="flex items-center justify-center h-full text-gray-300">
                        Coming Soon (Charts)
                    </div>
                </div>

                {/* Placeholder for Revenue Chart */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-[400px]">
                    <h3 className="font-bold text-lg mb-4 text-black">Revenue Growth</h3>
                    <div className="flex items-center justify-center h-full text-gray-300">
                        Coming Soon (Charts)
                    </div>
                </div>
            </div>
        </div>
    );
}
