"use client";

import { useEffect, useState } from "react";
import { Users, DollarSign, Calendar, TrendingUp, Loader2 } from "lucide-react";

export default function AdminOverview() {
    const [stats, setStats] = useState<any[]>([
        { label: "Total Users", value: "0", change: "0%", icon: Users, color: 'blue' },
        { label: "MRR", value: "$0", change: "0%", icon: DollarSign, color: 'green' },
        { label: "Booked Calls", value: "0", change: "0%", icon: Calendar, color: 'amber' },
        { label: "Partners", value: "0", change: "0%", icon: TrendingUp, color: 'purple' },
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
                            color: 'blue'
                        },
                        {
                            label: "Profit",
                            value: `$${(statsData.netMrr || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                            change: `${statsData.mrrChange >= 0 ? '+' : ''}${statsData.mrrChange}%`,
                            icon: DollarSign,
                            color: 'green'
                        },
                        {
                            label: "Booked Calls",
                            value: statsData.bookedCallsWeek.toLocaleString(),
                            change: `${statsData.bookedCallsChange >= 0 ? '+' : ''}${statsData.bookedCallsChange}%`,
                            icon: Calendar,
                            color: 'amber'
                        },
                        {
                            label: "Partners",
                            value: statsData.activeAffiliates.toLocaleString(),
                            change: `${statsData.activeAffiliatesChange >= 0 ? '+' : ''}${statsData.activeAffiliatesChange}%`,
                            icon: TrendingUp,
                            color: 'purple'
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

    const MiniBarChart = ({ data, dataKey, color }: { data: any[], dataKey: string, color: string }) => {
        const max = Math.max(...data.map(d => d[dataKey]), 1);
        return (
            <div className="flex items-end justify-between h-full gap-2 pt-4">
                {data.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group relative cursor-help">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold">
                            {d[dataKey]} on {d.date}
                        </div>
                        <div
                            className={`w-full ${color} rounded-t-lg transition-all duration-700 ease-out`}
                            style={{ height: `${(d[dataKey] / max) * 100}%`, minHeight: d[dataKey] > 0 ? '4px' : '2px' }}
                        />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-10 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-black tracking-tight">System Pulse</h1>
                    <p className="text-gray-500 mt-2 font-medium">Real-time performance metrics and user growth.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-xs font-black uppercase tracking-widest border border-green-100">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Live System Status: Optimal
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-2xl bg-gray-50 text-black group-hover:bg-black group-hover:text-white transition-colors duration-300`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <span className={`text-sm font-black ${stat.change.startsWith('+') ? 'text-green-500' : 'text-gray-400'}`}>
                                {stat.change}
                            </span>
                        </div>
                        <div>
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                {loading ? (
                                    <div className="h-10 w-24 bg-gray-50 rounded-xl animate-pulse" />
                                ) : (
                                    <h2 className="text-4xl font-black text-black">{stat.value}</h2>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Visual Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm h-[450px] flex flex-col group hover:shadow-lg transition-all">
                    <div className="mb-8">
                        <h3 className="text-2xl font-black text-black">Booking Velocity</h3>
                        <p className="text-gray-400 font-medium">Daily call volume over the last 7 days</p>
                    </div>
                    <div className="flex-1">
                        {loading ? (
                            <div className="h-full w-full bg-gray-50 rounded-[2rem] animate-pulse" />
                        ) : (
                            <MiniBarChart data={dailyData} dataKey="bookings" color="bg-black" />
                        )}
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm h-[450px] flex flex-col group hover:shadow-lg transition-all">
                    <div className="mb-8">
                        <h3 className="text-2xl font-black text-black">Acquisition Trend</h3>
                        <p className="text-gray-400 font-medium">New user signups across the ecosystem</p>
                    </div>
                    <div className="flex-1">
                        {loading ? (
                            <div className="h-full w-full bg-gray-50 rounded-[2rem] animate-pulse" />
                        ) : (
                            <MiniBarChart data={dailyData} dataKey="signups" color="bg-[#FF6B9C]" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
