/**
 * Outcome Metrics Dashboard Component
 * Displays key business metrics for predictability
 */

"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Clock, Target, DollarSign, Loader2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-helpers";

interface OutcomeMetrics {
    repliesPer100Emails: number;
    interestedPer100Replies: number;
    dealsStarted: number;
    avgTimeToFirstReply: number;
    totalEmailsSent: number;
    totalRepliesReceived: number;
    totalInterested: number;
    conversionRate: number;
    replyRate: number;
}

export default function OutcomeMetricsPanel() {
    const [metrics, setMetrics] = useState<OutcomeMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const user = await getCurrentUser();
                if (!user) return;
                const token = await user.getIdToken();

                const res = await fetch('/api/user/metrics/outcome', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await res.json();

                if (data.success && data.metrics) {
                    setMetrics(data.metrics);
                }
            } catch (error) {
                console.error('Failed to load outcome metrics:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchMetrics();

        // Refresh every 30 seconds
        const interval = setInterval(fetchMetrics, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-3xl border-2 border-purple-100 p-8 shadow-xl">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
            </div>
        );
    }

    if (!metrics) {
        return null;
    }

    const formatTime = (hours: number) => {
        if (hours === 0) return 'N/A';
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-black tracking-tight">Outcome Metrics</h2>
                    <p className="text-sm text-gray-500 font-medium">real-time predictability analysis</p>
                </div>
                <span className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Live Data</span>
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Reply Rate */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reply Rate</span>
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-black" />
                        </div>
                    </div>
                    <div>
                        <div className="text-4xl font-black text-black tracking-tighter">
                            {metrics.repliesPer100Emails.toFixed(1)}%
                        </div>
                        <p className="text-xs font-bold text-gray-400 mt-1">
                            {metrics.totalRepliesReceived} replies / {metrics.totalEmailsSent} sent
                        </p>
                    </div>
                </div>

                {/* Interest Rate */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Interest Rate</span>
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <Target className="w-4 h-4 text-black" />
                        </div>
                    </div>
                    <div>
                        <div className="text-4xl font-black text-black tracking-tighter">
                            {metrics.interestedPer100Replies.toFixed(1)}%
                        </div>
                        <p className="text-xs font-bold text-gray-400 mt-1">
                            {metrics.totalInterested} interested leads
                        </p>
                    </div>
                </div>

                {/* Deals */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pipeline Deals</span>
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <DollarSign className="w-4 h-4 text-black" />
                        </div>
                    </div>
                    <div>
                        <div className="text-4xl font-black text-black tracking-tighter">
                            {metrics.dealsStarted}
                        </div>
                        <p className="text-xs font-bold text-gray-400 mt-1">
                            {(metrics.conversionRate || 0).toFixed(1)}% conversion
                        </p>
                    </div>
                </div>

                {/* Avg Response Time */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Avg Response</span>
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <Clock className="w-4 h-4 text-black" />
                        </div>
                    </div>
                    <div>
                        <div className="text-4xl font-black text-black tracking-tighter">
                            {formatTime(metrics.avgTimeToFirstReply)}
                        </div>
                        <p className="text-xs font-bold text-gray-400 mt-1">
                            time to first reply
                        </p>
                    </div>
                </div>
            </div>

            {/* Insight Banner */}
            <div className="bg-black text-white p-6 rounded-3xl flex items-center justify-between shadow-xl">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Predictability Score</div>
                    <div className="text-sm font-medium text-gray-300">
                        {metrics.totalEmailsSent >= 100 ? (
                            <span>
                                You are generating <span className="text-white font-bold">{((metrics.repliesPer100Emails / 100) * (metrics.interestedPer100Replies / 100) * 1000).toFixed(1)} interested leads</span> for every 1,000 emails sent.
                            </span>
                        ) : (
                            <span>Send 100+ emails to unlock predictive analytics. Current: {metrics.totalEmailsSent}/100</span>
                        )}
                    </div>
                </div>
                {/* Visual Flair */}
                <div className="hidden sm:block">
                    <div className="flex gap-1">
                        <div className="w-1 h-8 bg-gray-800 rounded-full"></div>
                        <div className="w-1 h-12 bg-gray-700 rounded-full"></div>
                        <div className="w-1 h-6 bg-gray-800 rounded-full"></div>
                        <div className="w-1 h-10 bg-white rounded-full"></div>
                        <div className="w-1 h-5 bg-gray-800 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
