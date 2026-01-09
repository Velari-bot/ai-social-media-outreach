"use client";

import { useEffect, useState } from "react";
import { Users, DollarSign, Calendar, TrendingUp, Loader2 } from "lucide-react";

export default function AdminOverview() {
    const [stats, setStats] = useState<any[]>([
        { label: "Total Users", value: "-", change: "...", icon: Users, changeColor: 'text-green-500' },
        { label: "MRR", value: "-", change: "...", icon: DollarSign, changeColor: 'text-green-500' },
        { label: "Booked Calls (Wk)", value: "-", change: "...", icon: Calendar, changeColor: 'text-green-500' },
        { label: "Active Affiliates", value: "-", change: "...", icon: TrendingUp, changeColor: 'text-green-500' },
    ]);
    const [dailyData, setDailyData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/admin/stats');
                const data = await res.json();

                if (data.success) {
                    const statsData = data.stats;
                    setDailyData(statsData.dailyData || []);
                    setStats([
                        {
                            label: "Total Users",
                            value: statsData.totalUsers.toLocaleString(),
                            change: `${statsData.totalUsersChange >= 0 ? '+' : ''}${statsData.totalUsersChange}%`,
                            icon: Users,
                            changeColor: statsData.totalUsersChange >= 0 ? 'text-green-500' : 'text-red-500'
                        },
                        {
                            label: "MRR",
                            value: `$${statsData.mrr.toLocaleString()}`,
                            change: `${statsData.mrrChange >= 0 ? '+' : ''}${statsData.mrrChange}%`,
                            icon: DollarSign,
                            changeColor: statsData.mrrChange >= 0 ? 'text-green-500' : 'text-red-500'
                        },
                        {
                            label: "Booked Calls (Wk)",
                            value: statsData.bookedCallsWeek.toLocaleString(),
                            change: `${statsData.bookedCallsChange >= 0 ? '+' : ''}${statsData.bookedCallsChange}%`,
                            icon: Calendar,
                            changeColor: statsData.bookedCallsChange >= 0 ? 'text-green-500' : 'text-red-500'
                        },
                        {
                            label: "Active Affiliates",
                            value: statsData.activeAffiliates.toLocaleString(),
                            change: `${statsData.activeAffiliatesChange >= 0 ? '+' : ''}${statsData.activeAffiliatesChange}%`,
                            icon: TrendingUp,
                            changeColor: statsData.activeAffiliatesChange >= 0 ? 'text-green-500' : 'text-red-500'
                        },
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

    // Simple Bar Chart Component
    const MiniBarChart = ({ data, dataKey, color }: { data: any[], dataKey: string, color: string }) => {
        const max = Math.max(...data.map(d => d[dataKey]), 1);
        return (
            <div className="flex items-end justify-between h-full gap-2 pt-4">
                {data.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group relative cursor-help">
                        {/* Tooltip */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {d[dataKey]} on {d.date.split('-').slice(1).join('/')}
                        </div>
                        <div
                            className={`w-full ${color} rounded-t-sm transition-all duration-500 ease-out`}
                            style={{ height: `${(d[dataKey] / max) * 100}%`, minHeight: d[dataKey] > 0 ? '4px' : '0px' }}
                        />
                        <span className="text-[10px] text-gray-400 mt-2 rotate-[-45deg] origin-top-left">
                            {d.date.split('-').slice(2)}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

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
                                    <span className={`text-sm font-medium mb-1.5 ${stat.changeColor || 'text-green-500'}`}>{stat.change}</span>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Bookings Chart */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-[350px] flex flex-col">
                    <h3 className="font-bold text-lg mb-2 text-black">Recent Bookings (Last 7 Days)</h3>
                    <p className="text-sm text-gray-400 mb-6">Daily call volume</p>
                    <div className="flex-1 pb-8">
                        {loading ? (
                            <div className="h-full w-full bg-gray-50 rounded-xl animate-pulse" />
                        ) : dailyData.length > 0 ? (
                            <MiniBarChart data={dailyData} dataKey="bookings" color="bg-blue-500" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-300">No data available</div>
                        )}
                    </div>
                </div>

                {/* User Signups Chart */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-[350px] flex flex-col">
                    <h3 className="font-bold text-lg mb-2 text-black">New Signups (Last 7 Days)</h3>
                    <p className="text-sm text-gray-400 mb-6">User growth velocity</p>
                    <div className="flex-1 pb-8">
                        {loading ? (
                            <div className="h-full w-full bg-gray-50 rounded-xl animate-pulse" />
                        ) : dailyData.length > 0 ? (
                            <MiniBarChart data={dailyData} dataKey="signups" color="bg-purple-500" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-300">No data available</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
