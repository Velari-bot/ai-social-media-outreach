
"use client";

import { useState, useEffect } from "react";
import { Database, Search, Filter, Instagram, Youtube, Twitter, Plus, ExternalLink } from "lucide-react";

export default function AdminCreators() {
    const [creators, setCreators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCreators() {
            try {
                const res = await fetch('/api/admin/creators');
                const data = await res.json();
                if (data.success) setCreators(data.creators);
            } catch (err) {
                console.error("Failed to fetch creators", err);
            } finally {
                setLoading(false);
            }
        }
        fetchCreators();
    }, []);

    const getPlatformIcon = (platform: string) => {
        switch (platform?.toLowerCase()) {
            case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
            case 'youtube': return <Youtube className="w-4 h-4 text-red-500" />;
            case 'twitter': return <Twitter className="w-4 h-4 text-blue-400" />;
            default: return <Database className="w-4 h-4" />;
        }
    };

    const getPlatformUrl = (platform: string, handle: string) => {
        const cleanHandle = handle?.replace('@', '');
        switch (platform?.toLowerCase()) {
            case 'instagram': return `https://instagram.com/${cleanHandle}`;
            case 'youtube': return `https://youtube.com/@${cleanHandle}`;
            case 'twitter': return `https://twitter.com/${cleanHandle}`;
            case 'tiktok': return `https://tiktok.com/@${cleanHandle}`;
            default: return '#';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-black">Creator Database</h1>
                    <p className="text-gray-500 mt-1">Directory of crawled and verified social media creators.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            const btn = document.getElementById('sync-clay-btn');
                            if (btn) btn.innerText = 'Syncing...';
                            try {
                                await fetch('/api/admin/backfill-clay', { method: 'POST' });
                                alert('Sync started! Check Clay in a few seconds.');
                            } catch (e) {
                                alert('Sync failed');
                            } finally {
                                if (btn) btn.innerText = 'Sync Clay';
                            }
                        }}
                        id="sync-clay-btn"
                        className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-800 transition-all shadow-lg shadow-purple-500/20"
                    >
                        <Database className="w-5 h-5" />
                        Sync Clay
                    </button>
                    <button className="bg-black text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg shadow-black/10">
                        <Plus className="w-5 h-5" />
                        Add Creator
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by handle, email, or niche..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-black font-medium focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                </div>
                <button className="px-6 py-3 bg-white border border-gray-200 rounded-2xl text-black font-bold flex items-center gap-2 hover:bg-gray-50 transition-all">
                    <Filter className="w-4 h-4" />
                    Filters
                </button>
            </div>

            {/* Creator Grid */}
            <div className="max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {loading ? (
                        Array(4).fill(0).map((_, i) => (
                            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-pulse h-48" />
                        ))
                    ) : creators.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-gray-400 font-bold bg-white rounded-3xl border border-gray-100">
                            No creators found in database.
                        </div>
                    ) : (
                        creators.map((c) => (
                            <div key={c.id} className="bg-white p-5 rounded-3xl border-2 border-gray-100 shadow-sm hover:shadow-xl hover:border-black transition-all group relative overflow-hidden">
                                {/* Platform Badge - Top Left */}
                                <div className="absolute top-4 left-4 px-3 py-1.5 bg-white border-2 border-gray-100 rounded-full shadow-sm flex items-center gap-2 z-10">
                                    {getPlatformIcon(c.platform)}
                                    <span className="text-xs font-black text-gray-900 uppercase">{c.platform || 'unknown'}</span>
                                </div>

                                {/* Creator Info */}
                                <div className="pt-12">
                                    <h3 className="font-black text-xl text-black truncate">{c.handle}</h3>
                                    <p className="text-sm text-gray-500 font-medium mt-1">{c.niche || 'General'}</p>

                                    {/* Stats Grid */}
                                    <div className="mt-6 grid grid-cols-2 gap-3">
                                        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200/50">
                                            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Followers</div>
                                            <div className="text-2xl font-black text-blue-900">
                                                {c.followers ? new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(c.followers) : "N/A"}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl border border-green-200/50">
                                            <div className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Status</div>
                                            <div className={`text-lg font-black ${c.status === 'Verified' ? 'text-green-900' : 'text-amber-900'}`}>
                                                {c.status || 'Pending'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="mt-4">
                                        {c.email ? (
                                            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100">
                                                <span className="truncate">{c.email}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-400 rounded-xl text-xs font-bold border border-gray-100">
                                                <span>No Email Found</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Go to Profile Button */}
                                    <a
                                        href={getPlatformUrl(c.platform, c.handle)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all group-hover:scale-105 active:scale-95 shadow-lg shadow-black/10"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        <span>Go to Profile</span>
                                    </a>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
