
"use client";

import { useState, useEffect } from "react";
import { Database, Search, Filter, Instagram, Youtube, Twitter, MoreVertical, Plus } from "lucide-react";

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
        switch (platform) {
            case 'Instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
            case 'YouTube': return <Youtube className="w-4 h-4 text-red-500" />;
            case 'Twitter': return <Twitter className="w-4 h-4 text-blue-400" />;
            default: return <Database className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-black">Creator Database</h1>
                    <p className="text-gray-500 mt-1">Directory of crawled and verified social media creators.</p>
                </div>
                <button className="bg-black text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg shadow-black/10">
                    <Plus className="w-5 h-5" />
                    Add Creator
                </button>
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
                            <div key={c.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-black group-hover:text-white transition-colors">
                                        {getPlatformIcon(c.platform)}
                                    </div>
                                    <button className="text-gray-300 hover:text-black transition-colors">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-black text-lg text-black">{c.handle}</h3>
                                    <p className="text-sm text-gray-500 font-medium">{c.niche} • {c.followers} Followers</p>
                                </div>
                                <div className="mt-6 pt-6 border-t border-gray-50 space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-400 font-bold uppercase tracking-wider">Email</span>
                                        <span className="text-black font-medium">{c.email}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-400 font-bold uppercase tracking-wider">Status</span>
                                        <span className={`px-2 py-0.5 rounded-full font-bold ${c.status === 'Verified' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {c.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
