
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { toast } from "react-hot-toast";

export default function DemoDashboard() {
    const [metrics] = useState({
        emailsSentToday: 124,
        emailsSentMonth: 3420,
        repliesReceived: 850,
        activeConversations: 215,
        meetingsInterested: 42,
        remainingQuota: 376,
        replyRate: 24.8,
    });

    const [systemStatus] = useState({
        gmail: true,
        aiOutreach: true,
        followups: true,
        creatorFinder: true,
    });

    const [campaigns] = useState([
        {
            id: 1,
            name: "Tech Reviewers Q1",
            platforms: ["YouTube", "Twitter"],
            status: "outreach_running",
            creatorsContacted: 1250,
            replies: 312,
        },
        {
            id: 2,
            name: "Lifestyle & Vloggers",
            platforms: ["Instagram", "TikTok"],
            status: "awaiting_replies",
            creatorsContacted: 850,
            replies: 204,
        },
        {
            id: 3,
            name: "Gaming Influencers",
            platforms: ["Twitch", "YouTube"],
            status: "completed",
            creatorsContacted: 500,
            replies: 124,
        },
    ]);

    const router = useRouter();

    const handleNavigate = (path: string) => {
        router.push(`${path}?demo=true`);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "searching": return "text-blue-700 bg-blue-100";
            case "outreach_running": return "text-green-700 bg-green-100";
            case "awaiting_replies": return "text-yellow-700 bg-yellow-100";
            case "completed": return "text-gray-700 bg-gray-100";
            default: return "text-gray-700 bg-gray-100";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "searching": return "Searching";
            case "outreach_running": return "Outreach Running";
            case "awaiting_replies": return "Awaiting Replies";
            case "completed": return "Completed";
            default: return status;
        }
    };

    return (
        <main className="min-h-screen bg-[#F5F3EF] font-sans relative" style={{ backgroundImage: 'none' }}>
            <div className="fixed inset-0 bg-[#F5F3EF] -z-50" />
            <Navbar />

            <div className="w-full px-4 sm:px-6 pt-24 pb-8 sm:pb-12">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-4xl sm:text-5xl font-black text-black mb-2 tracking-tight">Dashboard</h1>
                                <p className="text-lg text-gray-700">
                                    Here's how much value we're generating for you right now.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-black flex items-center justify-center"
                                    title="Settings"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                                <div className="relative px-4 py-2 bg-white border border-gray-200 rounded-xl transition-colors text-sm font-medium text-black flex items-center gap-2 cursor-pointer" onClick={() => handleNavigate('/inbox')}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>5 new replies</span>
                                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
                                        5
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 1. Top KPI Strip */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        <div className="p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors shadow-sm">
                            <div className="text-3xl font-black mb-1 text-black">{metrics.emailsSentToday.toLocaleString()}</div>
                            <div className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-1">Emails Sent</div>
                            <div className="text-xs text-gray-500">Today</div>
                        </div>
                        <div className="p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors shadow-sm">
                            <div className="text-3xl font-black mb-1 text-black">{metrics.emailsSentMonth.toLocaleString()}</div>
                            <div className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-1">Emails Sent</div>
                            <div className="text-xs text-gray-500">This Month</div>
                        </div>
                        <div className="p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors shadow-sm">
                            <div className="text-3xl font-black mb-1 text-blue-600">{metrics.repliesReceived.toLocaleString()}</div>
                            <div className="text-xs text-gray-600 font-medium uppercase tracking-wider">Replies Received</div>
                        </div>
                        <div className="p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors shadow-sm">
                            <div className="text-3xl font-black mb-1 text-green-600">{metrics.activeConversations.toLocaleString()}</div>
                            <div className="text-xs text-gray-600 font-medium uppercase tracking-wider">Active Conversations</div>
                        </div>
                        <div className="p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors shadow-sm">
                            <div className="text-3xl font-black mb-1 text-purple-600">{metrics.meetingsInterested}</div>
                            <div className="text-xs text-gray-600 font-medium uppercase tracking-wider">Meetings / Interested</div>
                        </div>
                        <div className="p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors shadow-sm">
                            <div className="text-3xl font-black mb-1 text-black">{metrics.remainingQuota}</div>
                            <div className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-1">Remaining</div>
                            <div className="text-xs text-gray-500">Daily Quota</div>
                        </div>
                    </div>

                    <div className="mb-8 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-600 uppercase tracking-wider mb-1">Reply Rate</div>
                                <div className="text-3xl font-black text-black">{metrics.replyRate.toFixed(1)}%</div>
                            </div>
                            <div className="w-24 h-24 relative">
                                <svg className="transform -rotate-90 w-24 h-24">
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="40"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="none"
                                        className="text-gray-200"
                                    />
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="40"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeDasharray={`${(metrics.replyRate / 100) * 251.2} 251.2`}
                                        className="text-purple-600"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                                <h2 className="text-xl font-bold text-black mb-4">Automation Status</h2>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                        <span className="text-gray-700 font-medium">Gmail</span>
                                        <span className="flex items-center gap-2 text-sm font-medium text-green-600">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Connected
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                        <span className="text-gray-700 font-medium">AI Outreach</span>
                                        <span className="flex items-center gap-2 text-sm font-medium text-green-600">
                                            <div className="w-2 h-2 rounded-full bg-current"></div>
                                            Running
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                        <span className="text-gray-700 font-medium">Follow-ups</span>
                                        <span className="flex items-center gap-2 text-sm font-medium text-green-600">
                                            <div className="w-2 h-2 rounded-full bg-current"></div>
                                            Enabled
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-black mb-4">Active Campaigns / Requests</h2>
                                <div className="space-y-3">
                                    {campaigns.map((campaign) => (
                                        <div
                                            key={campaign.id}
                                            className="p-5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors shadow-sm"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-bold text-black mb-1">{campaign.name}</h3>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        {campaign.platforms.map((platform, idx) => (
                                                            <span key={idx} className="flex items-center gap-1">
                                                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                                                {platform}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getStatusColor(campaign.status)}`}>
                                                    {getStatusLabel(campaign.status)}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Creators Contacted</div>
                                                    <div className="text-lg font-bold text-black">{campaign.creatorsContacted.toLocaleString()}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Replies</div>
                                                    <div className="text-lg font-bold text-blue-600">{campaign.replies.toLocaleString()}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleNavigate('/creator-request')}
                                                className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                                View Details
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                                <h2 className="text-xl font-bold text-black mb-4">Quick Actions</h2>
                                <div className="space-y-3">
                                    <button onClick={() => handleNavigate('/creator-request')} className="w-full px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition-colors text-sm font-bold flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        New Creator Request
                                    </button>
                                    <button onClick={() => handleNavigate('/inbox')} className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-black rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        View Inbox
                                    </button>
                                    <button onClick={() => handleNavigate('/templates')} className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-black rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Email Templates
                                    </button>
                                    <button onClick={() => handleNavigate('/export')} className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-black rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Export to Sheet
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );

}
