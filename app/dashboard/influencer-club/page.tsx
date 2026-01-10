"use client";

import { useState } from "react";
import { Search, MapPin, Hash, Globe, Users, Loader2, AlertCircle, Download } from "lucide-react";

type Creator = {
    externalId: string;
    name: string;
    handle: string;
    followers: number;
    engagementRate?: number;
    platform: string;
    profileUrl?: string;
    location?: string;
    country?: string;
};

// Fixed Categories List
const CATEGORIES = [
    "Gaming",
    "Tech",
    "Finance",
    "Lifestyle",
    "Fitness",
    "Education",
    "Beauty",
    "Fashion",
    "Food",
    "Travel"
];

const COUNTRIES = [
    { code: "US", name: "United States" },
    { code: "CA", name: "Canada" },
    { code: "GB", name: "United Kingdom" },
    { code: "AU", name: "Australia" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
];

export default function InfluencerClubDashboard() {
    // Form State
    const [platform, setPlatform] = useState("youtube");
    const [keywords, setKeywords] = useState("");
    const [category, setCategory] = useState("");
    const [country, setCountry] = useState("");
    const [followersMin, setFollowersMin] = useState(1000);
    const [followersMax, setFollowersMax] = useState(1000000);
    const [engagementRateMin, setEngagementRateMin] = useState(1);
    const [requestedCreators, setRequestedCreators] = useState(50);

    // UI/Flow State
    const [loading, setLoading] = useState(false);
    const [creators, setCreators] = useState<Creator[]>([]);
    const [error, setError] = useState("");
    const [hasSearched, setHasSearched] = useState(false);
    const [batchProgress, setBatchProgress] = useState(0);

    // Computed Credits
    const callsNeeded = Math.ceil(requestedCreators / 50);
    const creditsCost = callsNeeded; // 1 call = 1 credit

    // Validation (Strong Targeting Rule: Must have Keywords OR Category)
    const hasStrongTargeting = (keywords.trim().length > 0) || (category !== "");
    const isValid = hasStrongTargeting && followersMin < followersMax;

    async function runDiscovery() {
        if (!isValid) return;

        setLoading(true);
        setError("");
        setHasSearched(true);
        setCreators([]);
        setBatchProgress(0);

        const keywordList = keywords.split(",").map(k => k.trim()).filter(k => k.length > 0);

        // Build Payload according to "Final Mental Model"
        // Note: The Dashboard page simulates the backend looping logic mainly for testing transparency,
        // but typically the backend would handle "requestedCreators" -> loop. 
        // Here we will implement the loop CLIENT-SIDE for the dashboard test tool to verify 
        // that we can fetch multiple pages cleanly. The User-Facing page will rely on Backend Looping.

        const allCreators: Creator[] = [];
        let fetchedCount = 0;

        try {
            for (let i = 0; i < callsNeeded; i++) {
                setBatchProgress(i + 1);

                const offset = i * 50;

                const payload = {
                    platform,
                    limit: 50, // Always max 50 per call
                    offset: offset,
                    filters: {
                        keywords: keywordList.length > 0 ? keywordList : undefined,
                        category: category || undefined,
                        country: country || undefined,
                        followersMin,
                        followersMax,
                        engagementRateMin: engagementRateMin / 100 // user selects %, api might want raw? 
                        // Wait, user request said: "engagementRateMin number Optional % value (1 = 1%)"
                        // So if user selects 1, we send 1.
                    }
                };

                // Override engagement rate passing based on prompt specs "1 = 1%"
                payload.filters.engagementRateMin = engagementRateMin;

                const res = await fetch("/api/influencer-club/discovery", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || `Batch ${i + 1} failed`);
                }

                const batchCreators = data.creators || [];
                allCreators.push(...batchCreators);
                fetchedCount += batchCreators.length;

                // Stop if we got fewer than limit, meaning end of results
                if (batchCreators.length < 50) {
                    break;
                }
            }

            setCreators(allCreators);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setBatchProgress(0);
        }
    }

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(num);
    };

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white p-6 lg:p-12 font-sans">
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN: Controls */}
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                            Influencer Club Discovery
                        </h1>
                        <p className="text-zinc-500 text-sm mt-1">
                            Credit-Safe Discovery Pipeline
                        </p>
                    </div>

                    <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">

                        {/* 1. Platform */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Platform (Required)</label>
                            <div className="grid grid-cols-3 gap-3">
                                {["youtube", "instagram", "tiktok"].map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPlatform(p)}
                                        className={`capitalize py-2.5 rounded-lg text-sm font-medium transition-all ${platform === p
                                            ? "bg-white text-black shadow-lg shadow-white/10"
                                            : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. Targeting */}
                        <div className="space-y-4 pt-4 border-t border-zinc-800">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                    Targeting <span className="text-red-500">*</span> <span className="text-[10px] font-normal text-zinc-600 normal-case ml-1">(Keywords OR Category required)</span>
                                </label>
                                {!hasStrongTargeting && (
                                    <span className="text-[10px] text-red-500 font-medium">Required</span>
                                )}
                            </div>

                            {/* Keywords */}
                            <div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                    <input
                                        type="text"
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-white/20 outline-none transition-all"
                                        placeholder="Keywords (comma separated)... e.g. gaming, tech"
                                        value={keywords}
                                        onChange={(e) => setKeywords(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Category */}
                                <div>
                                    <select
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-3 text-sm text-white focus:ring-2 focus:ring-white/20 outline-none appearance-none"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                    >
                                        <option value="">Any Category</option>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                {/* Country Selector */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider sr-only">Location</label> {/* Added sr-only to hide label visually but keep for accessibility */}
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                                        <select
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-white/20 outline-none appearance-none"
                                            value={country}
                                            onChange={(e) => setCountry(e.target.value)}
                                        >
                                            <option value="">Anywhere (Best Results)</option>
                                            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    {country !== "" && <p className="text-[10px] text-zinc-500 mt-1">⚠️ May reduce results significantly</p>}
                                </div>
                            </div>
                        </div>

                        {/* Warnings */}
                        {(keywords.length > 0 && category !== "") && (
                            <div className="mt-4 p-3 bg-amber-900/20 border border-amber-900/50 rounded-lg flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-200">
                                    <strong>Warning:</strong> Combining Keywords & Category is very restrictive. If 0 results, try removing one.
                                </p>
                            </div>
                        )}

                        {/* 3. Audience Size */}
                        <div className="pt-4 border-t border-zinc-800">
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Follower Range</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-zinc-500 text-xs">Min</span>
                                    <input
                                        type="number"
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-3 text-sm text-white focus:ring-2 focus:ring-white/20 outline-none"
                                        value={followersMin}
                                        onChange={(e) => setFollowersMin(Number(e.target.value))}
                                    />
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-zinc-500 text-xs">Max</span>
                                    <input
                                        type="number"
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-3 text-sm text-white focus:ring-2 focus:ring-white/20 outline-none"
                                        value={followersMax}
                                        onChange={(e) => setFollowersMax(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 4. Quality & Volume */}
                        <div className="pt-4 border-t border-zinc-800 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Min Engagement</label>
                                <select
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-3 text-sm text-white focus:ring-2 focus:ring-white/20 outline-none appearance-none"
                                    value={engagementRateMin}
                                    onChange={(e) => setEngagementRateMin(Number(e.target.value))}
                                >
                                    <option value={1}>1% (Standard)</option>
                                    <option value={2}>2% (Good)</option>
                                    <option value={3}>3% (High)</option>
                                    <option value={5}>5% (Viral)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Quantity</label>
                                <select
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-3 text-sm text-white focus:ring-2 focus:ring-white/20 outline-none appearance-none"
                                    value={requestedCreators}
                                    onChange={(e) => setRequestedCreators(Number(e.target.value))}
                                >
                                    <option value={50}>50 Creators</option>
                                    <option value={100}>100 Creators</option>
                                    <option value={150}>150 Creators</option>
                                </select>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-2">
                            <button
                                onClick={runDiscovery}
                                disabled={!isValid || loading}
                                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${!isValid
                                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                    : loading
                                        ? "bg-zinc-800 text-white cursor-wait"
                                        : "bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/10"
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Searching Batch {batchProgress}/{callsNeeded}...</span>
                                    </>
                                ) : (
                                    <>
                                        <Search className="h-4 w-4" />
                                        <span>Find Creators</span>
                                    </>
                                )}
                            </button>
                            {!isValid && (
                                <p className="text-center text-red-500 text-xs mt-3">
                                    Please specify at least one keyword or select a category.
                                </p>
                            )}
                        </div>

                    </div>
                </div>

                {/* RIGHT COLUMN: Summary & Results */}
                <div className="space-y-6">
                    {/* Summary Card */}
                    <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl p-6 shadow-xl sticky top-6">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Request Summary</h3>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Platform</span>
                                <span className="capitalize">{platform}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Targeting</span>
                                <span className="text-right truncate max-w-[150px]">
                                    {keywords || category || country || "None"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Credits</span>
                                <span className="font-bold text-white bg-zinc-800 px-2 py-0.5 rounded">{creditsCost} Credits</span>
                            </div>
                        </div>

                        {error && (
                            <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-xs">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Full Width Results */}
                <div className="lg:col-span-3">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold">Results</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-zinc-500 text-sm">{creators.length} Creators</span>
                            {creators.length > 0 && (
                                <button
                                    onClick={handleExportCSV}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-colors border border-white/10"
                                >
                                    <Download className="h-3.5 w-3.5" /> Export CSV
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {creators.map((c, i) => (
                            <div key={i} className="group bg-[#1a1a1a] border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 transition-all hover:shadow-xl hover:-translate-y-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-10 w-10 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700">
                                        {c.profileUrl ? (
                                            <img src={c.profileUrl} alt={c.handle} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-zinc-500 text-xs">?</div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-sm truncate">{c.name || c.handle}</div>
                                        <div className="text-xs text-zinc-500 truncate">@{c.handle}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-zinc-900/50 p-2 rounded-lg">
                                        <div className="text-zinc-500 mb-0.5">Followers</div>
                                        <div className="font-mono">{formatNumber(c.followers)}</div>
                                    </div>
                                    <div className="bg-zinc-900/50 p-2 rounded-lg">
                                        <div className="text-zinc-500 mb-0.5">Eng. Rate</div>
                                        <div className="font-mono text-green-400">
                                            {c.engagementRate ? `${(c.engagementRate * 100).toFixed(1)}%` : "-"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
