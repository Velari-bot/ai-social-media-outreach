
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { toast } from "react-hot-toast";
import { Eye, X, ExternalLink, Youtube, Instagram, Music, Globe, Mail, MapPin, Users, Info, Loader2 } from "lucide-react";

export default function DemoDashboard() {
    // Demo Data
    const [metrics] = useState({
        emailsSentToday: 124,
        emailsSentMonth: 3420,
        repliesReceived: 850,
        activeConversations: 215,
        meetingsInterested: 42,
        remainingQuota: 376,
        replyRate: 24.8,
        totalCreatorsFound: 2500,
        totalCredits: 500,
        creditsRemaining: 376,
        creditsUsed: 124,
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

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    return (
        <main className="min-h-screen bg-[#F3F1EB] font-sans pb-20 relative overflow-hidden">
            <Navbar />

            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-60">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] bg-gradient-to-br from-purple-100 via-pink-100 to-transparent blur-[100px]" />
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[50%] bg-gradient-to-bl from-blue-100 via-teal-50 to-transparent blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 space-y-8 relative z-10">
                {/* Welcome Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-black text-black tracking-tight mb-2">
                            {getTimeGreeting()}, Admin
                        </h1>
                        <p className="text-lg text-black font-medium flex items-center gap-2">
                            Your automated outreach is <span className="font-bold text-green-600">active</span>.
                            <span
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full text-xs font-black text-black border border-gray-200 shadow-sm uppercase tracking-widest transition-colors group"
                            >
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse group-hover:animate-none"></span>
                                Focus: Brand Awareness
                                <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 17L17 7M17 7H7M17 7V17" />
                                </svg>
                            </span>
                        </p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <div className="px-4 py-2 bg-white rounded-xl border-2 border-gray-100 shadow-sm">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Credits</div>
                            <div className="text-lg font-black text-black">
                                {metrics.creditsRemaining.toLocaleString()} <span className="text-gray-400 text-sm font-medium">/ {metrics.totalCredits.toLocaleString()}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => handleNavigate('/creator-request')}
                            className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/10 flex items-center gap-2"
                        >
                            <span>+ New Campaign</span>
                        </button>
                    </div>
                </div>

                {/* Stats Grid - High Contrast */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatTile
                        label="Creators Found"
                        value={metrics.totalCreatorsFound.toLocaleString()}
                        suffix="total"
                        color="bg-white border-2 border-gray-100"
                    />
                    <StatTile
                        label="Emails Sent"
                        value={metrics.emailsSentMonth.toLocaleString()}
                        suffix="this month"
                        color="bg-white border-2 border-gray-100"
                    />
                    <StatTile
                        label="Active Convos"
                        value={metrics.activeConversations.toLocaleString()}
                        suffix="ongoing"
                        color="bg-white border-2 border-blue-100"
                        textColor="text-blue-900"
                    />
                    <StatTile
                        label="Interested"
                        value={metrics.meetingsInterested.toLocaleString()}
                        suffix="leads"
                        color="bg-white border-2 border-green-100"
                        textColor="text-green-900"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                    {/* Main Feed: Campaigns & Activity */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Active Campaigns */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-black flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
                                    Active Campaigns
                                </h2>
                                <button onClick={() => handleNavigate('/creator-request')} className="text-sm font-bold text-gray-900 hover:text-black hover:underline">View All</button>
                            </div>

                            <div className="space-y-3">
                                {campaigns.map((c) => (
                                    <CampaignCard key={c.id} campaign={c} />
                                ))}
                            </div>
                        </section>

                        {/* Recent Inbox Activity */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-black">Inbox Activity</h2>
                                <button onClick={() => handleNavigate('/inbox')} className="text-sm font-bold text-gray-900 hover:text-black hover:underline">Go to Inbox</button>
                            </div>

                            <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
                                <div className="divide-y divide-gray-100">
                                    <div className="p-5 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-transparent hover:border-black" onClick={() => handleNavigate('/inbox')}>
                                        <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold shrink-0">
                                            AI
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-black">AI replied to <span className="underline">TechReviewer29</span></p>
                                            <p className="text-sm text-gray-600 mt-1">"Hey, checking in on the rates..."</p>
                                            <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wide font-bold">Just now</p>
                                        </div>
                                    </div>
                                    <div className="p-5 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-transparent hover:border-black" onClick={() => handleNavigate('/inbox')}>
                                        <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold shrink-0">
                                            TR
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-black">TechReviewer29 replied</p>
                                            <p className="text-sm text-gray-600 mt-1">"I'm interested! Here is my media kit."</p>
                                            <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wide font-bold">5 mins ago</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">

                        {/* Action Card - High Contrast */}
                        <div className="bg-black rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="font-bold text-lg mb-1">Check your Inbox</h3>
                                <p className="text-gray-300 text-sm mb-6">Review new leads and AI conversations.</p>

                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-5xl font-black">{metrics.repliesReceived.toLocaleString()}</span>
                                    <span className="text-sm text-gray-300 mb-2 font-bold">new replies</span>
                                </div>

                                <button onClick={() => handleNavigate('/inbox')} className="block w-full py-3 bg-white text-black rounded-xl font-bold text-center hover:bg-gray-200 transition-colors">
                                    Open Inbox
                                </button>
                            </div>
                        </div>

                        {/* System Status - Clean */}
                        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
                            <h3 className="font-bold text-black mb-4 text-sm uppercase tracking-wide">System Health</h3>
                            <div className="space-y-4">
                                <StatusRow label="Gmail Connected" active={systemStatus.gmail} />
                                <StatusRow label="AI Agent" active={systemStatus.aiOutreach} />
                                <StatusRow label="Lead Finder" active={systemStatus.creatorFinder} />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    );
}

function StatTile({ label, value, suffix, color, textColor = "text-black" }: any) {
    return (
        <div className={`${color} p-6 rounded-2xl shadow-sm flex flex-col justify-between h-36 hover:shadow-md transition-shadow`}>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</span>
            <div>
                <span className={`text-4xl font-black ${textColor} tracking-tight`}>{value}</span>
                <span className="text-sm text-gray-400 ml-1 font-bold">{suffix}</span>
            </div>
        </div>
    );
}

function StatusRow({ label, active }: { label: string, active: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className={`text-xs font-bold ${active ? 'text-green-600' : 'text-red-500'}`}>{active ? 'Online' : 'Offline'}</span>
            </div>
        </div>
    );
}

function CampaignCard({ campaign }: { campaign: any }) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case "searching": return "bg-blue-100 text-blue-700";
            case "processing": return "bg-purple-100 text-purple-700";
            case "outreach_running": return "bg-green-100 text-green-700";
            case "awaiting_replies": return "bg-amber-100 text-amber-700";
            case "completed": return "bg-gray-100 text-gray-700";
            case "failed": return "bg-red-100 text-red-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "searching": return "Finding";
            case "processing": return "Enriching";
            case "outreach_running": return "Sending";
            case "awaiting_replies": return "Waiting";
            case "completed": return "Done";
            case "failed": return "Failed";
            default: return status.replace(/_/g, " ");
        }
    };

    return (
        <div
            className="bg-white p-6 rounded-2xl border-2 border-gray-100 hover:border-black transition-all group cursor-pointer hover:shadow-xl hover:shadow-black/5 active:scale-[0.98] relative"
        >
            <div className="flex justify-between items-start relative z-10">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                            {getPlatformIcon(campaign.platforms?.[0] || 'any', "w-4 h-4")}
                        </div>
                        <h3 className="font-bold text-lg text-black">{campaign.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide ${getStatusColor(campaign.status)}`}>
                            {getStatusLabel(campaign.status)}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 font-medium truncate max-w-[200px]">
                        Targeting {campaign.platforms.join(', ')}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-right">
                        <span className="block text-2xl font-black text-black">{campaign.creatorsContacted.toLocaleString()}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest whitespace-nowrap">Found Creators</span>
                    </div>
                </div>
            </div>
            {/* Progress Bar & View Results Action */}
            <div className="mt-5 flex items-center gap-4 h-6">
                <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden relative">
                    <div className="h-full bg-black w-[65%] rounded-full transition-all group-hover:w-[100%] duration-1000"></div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-300 w-24 flex-shrink-0">
                    <div className="flex justify-end items-center gap-1.5 text-[10px] font-black uppercase text-black">
                        Results <Eye className="w-3 h-3" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function getPlatformIcon(platform: string, className = "h-3 w-3") {
    const p = platform?.toLowerCase();
    if (p === 'youtube') return <Youtube className={`${className} text-red-600`} />;
    if (p === 'instagram') return <Instagram className={`${className} text-pink-600`} />;
    if (p === 'tiktok') return <Music className={`${className} text-black`} />;
    return <Globe className={`${className} text-gray-400`} />;
}
