/**
 * A/B Test Results Component
 * Shows performance comparison between variants
 */

"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Mail, Target, Trophy, Loader2 } from "lucide-react";
import { ABTestConfig } from "@/lib/types";

interface ABTestResultsProps {
    campaignId: string;
}

export default function ABTestResults({ campaignId }: ABTestResultsProps) {
    const [results, setResults] = useState<ABTestConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchResults() {
            try {
                const res = await fetch(`/api/user/campaigns/ab-test-results?campaignId=${campaignId}`);
                const data = await res.json();

                if (data.success && data.results) {
                    setResults(data.results);
                }
            } catch (error) {
                console.error('Failed to load A/B test results:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchResults();

        // Refresh every 30 seconds
        const interval = setInterval(fetchResults, 30000);
        return () => clearInterval(interval);
    }, [campaignId]);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 shadow-sm">
                <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            </div>
        );
    }

    if (!results || !results.enabled) {
        return null;
    }

    const variantASent = results.variant_a_sent || 0;
    const variantBSent = results.variant_b_sent || 0;
    const variantAReplies = results.variant_a_replies || 0;
    const variantBReplies = results.variant_b_replies || 0;
    const variantAInterested = results.variant_a_interested || 0;
    const variantBInterested = results.variant_b_interested || 0;

    const variantAReplyRate = variantASent > 0 ? (variantAReplies / variantASent) * 100 : 0;
    const variantBReplyRate = variantBSent > 0 ? (variantBReplies / variantBSent) * 100 : 0;

    const variantAInterestRate = variantAReplies > 0 ? (variantAInterested / variantAReplies) * 100 : 0;
    const variantBInterestRate = variantBReplies > 0 ? (variantBInterested / variantBReplies) * 100 : 0;

    const winnerReplyRate = variantAReplyRate > variantBReplyRate ? 'A' : variantBReplyRate > variantAReplyRate ? 'B' : null;
    const winnerInterestRate = variantAInterestRate > variantBInterestRate ? 'A' : variantBInterestRate > variantAInterestRate ? 'B' : null;

    return (
        <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl border-2 border-indigo-100 p-8 shadow-lg">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
                        <h3 className="text-xl font-black text-black tracking-tight">A/B Test Results</h3>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">
                        Live performance comparison
                    </p>
                </div>
                <div className="px-3 py-1.5 bg-white rounded-full border-2 border-indigo-100 shadow-sm">
                    <div className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                        Active
                    </div>
                </div>
            </div>

            {/* Variants Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Variant A */}
                <div className={`bg-white rounded-xl p-6 border-2 ${winnerReplyRate === 'A' || winnerInterestRate === 'A' ? 'border-green-300 shadow-lg shadow-green-100' : 'border-gray-100'} transition-all`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-xl font-black text-blue-600">A</span>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Variant A</div>
                                {(winnerReplyRate === 'A' || winnerInterestRate === 'A') && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Trophy className="w-3 h-3 text-green-600" />
                                        <span className="text-xs font-black text-green-600">Winner</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs font-semibold text-gray-500 mb-1">Subject Line</div>
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                                {results.variant_a.subject_line || 'Default'}
                            </div>
                        </div>

                        {results.variant_a.cta_text && (
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs font-semibold text-gray-500 mb-1">CTA</div>
                                <div className="text-sm font-medium text-gray-900">
                                    {results.variant_a.cta_text}
                                </div>
                            </div>
                        )}

                        <div className="pt-3 border-t border-gray-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-600">Sent</span>
                                <span className="text-sm font-black text-gray-900">{variantASent}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-600">Replies</span>
                                <span className="text-sm font-black text-blue-600">{variantAReplies}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-600">Reply Rate</span>
                                <span className="text-lg font-black text-blue-600">{variantAReplyRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-600">Interested</span>
                                <span className="text-sm font-black text-green-600">{variantAInterested}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-600">Interest Rate</span>
                                <span className="text-lg font-black text-green-600">{variantAInterestRate.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Variant B */}
                <div className={`bg-white rounded-xl p-6 border-2 ${winnerReplyRate === 'B' || winnerInterestRate === 'B' ? 'border-green-300 shadow-lg shadow-green-100' : 'border-gray-100'} transition-all`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-xl font-black text-purple-600">B</span>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Variant B</div>
                                {(winnerReplyRate === 'B' || winnerInterestRate === 'B') && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Trophy className="w-3 h-3 text-green-600" />
                                        <span className="text-xs font-black text-green-600">Winner</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs font-semibold text-gray-500 mb-1">Subject Line</div>
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                                {results.variant_b.subject_line || 'Default'}
                            </div>
                        </div>

                        {results.variant_b.cta_text && (
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs font-semibold text-gray-500 mb-1">CTA</div>
                                <div className="text-sm font-medium text-gray-900">
                                    {results.variant_b.cta_text}
                                </div>
                            </div>
                        )}

                        <div className="pt-3 border-t border-gray-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-600">Sent</span>
                                <span className="text-sm font-black text-gray-900">{variantBSent}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-600">Replies</span>
                                <span className="text-sm font-black text-blue-600">{variantBReplies}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-600">Reply Rate</span>
                                <span className="text-lg font-black text-blue-600">{variantBReplyRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-600">Interested</span>
                                <span className="text-sm font-black text-green-600">{variantBInterested}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-600">Interest Rate</span>
                                <span className="text-lg font-black text-green-600">{variantBInterestRate.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Insights */}
            {(variantASent > 10 || variantBSent > 10) && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-black text-lg mb-2">AI Learning Your Best Outreach</h4>
                            <p className="text-white/90 font-medium leading-relaxed text-sm">
                                {winnerReplyRate && winnerInterestRate ? (
                                    <>
                                        Variant <strong>{winnerReplyRate}</strong> is performing better with a{' '}
                                        <strong>{Math.abs(variantAReplyRate - variantBReplyRate).toFixed(1)}%</strong> higher reply rate.
                                        Keep testing to optimize your outreach!
                                    </>
                                ) : (
                                    <>
                                        Both variants are performing similarly. Send more emails to see which performs better.
                                        Current sample size: {variantASent + variantBSent} emails.
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
