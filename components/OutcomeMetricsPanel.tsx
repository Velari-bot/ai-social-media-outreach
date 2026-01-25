/**
 * Outcome Metrics Dashboard Component
 * Displays key business metrics for predictability
 */

"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Clock, Target, DollarSign, Loader2 } from "lucide-react";

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
                const res = await fetch('/api/user/metrics/outcome');
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
        <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-3xl border-2 border-purple-100 p-8 shadow-xl relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                }} />
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                            <h2 className="text-2xl font-black text-black tracking-tight">Outcome Metrics</h2>
                        </div>
                        <p className="text-sm text-gray-600 font-medium">
                            Predictability metrics that matter
                        </p>
                    </div>
                    <div className="px-4 py-2 bg-white rounded-full border-2 border-purple-100 shadow-sm">
                        <div className="text-xs font-black text-purple-600 uppercase tracking-widest">
                            Live Data
                        </div>
                    </div>
                </div>

                {/* Main Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Replies per 100 Emails */}
                    <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-lg transition-all group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                                <TrendingUp className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                                    Reply Rate
                                </div>
                                <div className="text-4xl font-black text-blue-600">
                                    {metrics.repliesPer100Emails.toFixed(1)}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm font-bold text-gray-900">Replies per 100 emails</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="text-xs text-gray-500 font-medium">
                                {metrics.totalRepliesReceived} replies from {metrics.totalEmailsSent} emails
                            </div>
                        </div>
                    </div>

                    {/* Interested per 100 Replies */}
                    <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-lg transition-all group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors">
                                <Target className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                                    Interest Rate
                                </div>
                                <div className="text-4xl font-black text-green-600">
                                    {metrics.interestedPer100Replies.toFixed(1)}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm font-bold text-gray-900">Interested per 100 replies</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="text-xs text-gray-500 font-medium">
                                {metrics.totalInterested} interested from {metrics.totalRepliesReceived} replies
                            </div>
                        </div>
                    </div>

                    {/* Deals Started */}
                    <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-lg transition-all group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
                                <DollarSign className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                                    Deals
                                </div>
                                <div className="text-4xl font-black text-purple-600">
                                    {metrics.dealsStarted}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm font-bold text-gray-900">Deals started</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="text-xs text-gray-500 font-medium">
                                {metrics.conversionRate.toFixed(2)}% conversion rate
                            </div>
                        </div>
                    </div>

                    {/* Avg Time to First Reply */}
                    <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-lg transition-all group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-orange-50 rounded-xl group-hover:bg-orange-100 transition-colors">
                                <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                                    Response Time
                                </div>
                                <div className="text-4xl font-black text-orange-600">
                                    {formatTime(metrics.avgTimeToFirstReply)}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm font-bold text-gray-900">Avg time to first reply</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="text-xs text-gray-500 font-medium">
                                Based on {metrics.totalRepliesReceived} conversations
                            </div>
                        </div>
                    </div>
                </div>

                {/* Predictability Statement */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-black text-lg mb-2">Your Predictability Score</h3>
                            {metrics.totalEmailsSent >= 100 ? (
                                <p className="text-white/90 font-medium leading-relaxed">
                                    Based on your data: <strong>Verality averages {metrics.interestedPer100Replies.toFixed(1)} interested creators per 100 replies</strong>,
                                    with a {metrics.repliesPer100Emails.toFixed(1)}% reply rate.
                                    That&apos;s <strong>{((metrics.repliesPer100Emails / 100) * (metrics.interestedPer100Replies / 100) * 1000).toFixed(1)} interested creators per 1,000 emails</strong>.
                                </p>
                            ) : (
                                <p className="text-white/90 font-medium leading-relaxed">
                                    Send at least 100 emails to see your personalized predictability metrics.
                                    Current progress: {metrics.totalEmailsSent}/100 emails sent.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
