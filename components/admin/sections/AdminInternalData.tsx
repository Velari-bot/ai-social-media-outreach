"use client";

import { useState, useEffect } from "react";
import { Database, Search, Filter, Instagram, Youtube, Twitter, Plus, ExternalLink, TestTube, Trash2 } from "lucide-react";

export default function AdminInternalData() {
    const [creators, setCreators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchData = async (pageNum: number, isInitial = false) => {
        if (isInitial) setLoading(true);
        else setLoadingMore(true);

        try {
            const limit = 50;
            const res = await fetch(`/api/admin/internal-data?limit=${limit * pageNum}`);
            const data = await res.json();

            if (data.success) {
                setCreators(data.data);
                if (data.data.length < limit * pageNum) {
                    setHasMore(false);
                }
            } else {
                setError(data.error || "Failed to fetch data");
            }
        } catch (err: any) {
            console.error("Failed to fetch internal data", err);
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchData(1, true);
    }, []);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchData(nextPage);
    };

    const filteredCreators = creators.filter(c =>
        c.handle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.source_file?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getPlatformIcon = (platform: string) => {
        switch (platform?.toLowerCase()) {
            case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
            case 'youtube': return <Youtube className="w-4 h-4 text-red-500" />;
            case 'twitter': return <Twitter className="w-4 h-4 text-blue-400" />;
            default: return <Database className="w-4 h-4 text-amber-500" />;
        }
    };

    const formatFollowers = (val: any) => {
        if (!val) return "N/A";
        const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
        if (isNaN(num)) return val;
        return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-black text-black">Internal Testing Data</h1>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded border border-amber-200">Testing Only</span>
                    </div>
                    <p className="text-gray-500 mt-1">Experimental creator data from internal CSV imports.</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center gap-3">
                        <TestTube className="w-5 h-5 text-amber-600" />
                        <div>
                            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Total Records</div>
                            <div className="text-lg font-black text-amber-900 leading-none">{creators.length}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search handles, names, emails or filenames..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-black font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                </div>
                <button className="px-6 py-3 bg-white border border-gray-200 rounded-2xl text-black font-bold flex items-center gap-2 hover:bg-gray-50 transition-all">
                    <Filter className="w-4 h-4" />
                    Source File
                </button>
            </div>

            {/* Data Grid */}
            <div className="max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                {error ? (
                    <div className="p-8 bg-red-50 border-2 border-red-100 rounded-3xl text-center">
                        <div className="flex justify-center mb-4 text-red-500">
                            <Plus className="w-12 h-12 rotate-45" />
                        </div>
                        <h3 className="text-xl font-black text-red-900 mb-2">Service Limit Reached</h3>
                        <p className="text-red-700 font-medium max-w-md mx-auto mb-6">
                            {error.includes('Quota exceeded')
                                ? "You've hit the daily Firestore quota (20k writes or 50k reads) on the free Spark plan during the mass CSV import."
                                : error}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="https://console.firebase.google.com/project/_/usage"
                                target="_blank"
                                className="px-6 py-3 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                            >
                                Check usage in Firebase
                            </a>
                        </div>
                        <p className="mt-6 text-sm text-red-400 font-bold uppercase tracking-widest">
                            Pro-tip: Upgrade to Blaze Plan for unlimited imports
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {loading ? (
                            Array(8).fill(0).map((_, i) => (
                                <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-pulse h-48" />
                            ))
                        ) : filteredCreators.length === 0 ? (
                            <div className="col-span-full py-20 text-center text-gray-400 font-bold bg-white rounded-3xl border border-gray-100">
                                No internal records matching search.
                            </div>
                        ) : (
                            filteredCreators.map((c) => (
                                <div key={c.id} className="bg-white p-5 rounded-3xl border-2 border-gray-100 shadow-sm hover:shadow-xl hover:border-amber-500 transition-all group relative overflow-hidden">
                                    {/* ... truncated for brevity but preserving structure ... */}
                                    {/* Source Label */}
                                    <div className="absolute top-4 right-4 text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 max-w-[100px] truncate">
                                        {c.source_file}
                                    </div>

                                    {/* Platform Badge */}
                                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-white border-2 border-gray-100 rounded-full shadow-sm flex items-center gap-2 z-10">
                                        {getPlatformIcon(c.platform)}
                                        <span className="text-xs font-black text-gray-900 uppercase">{c.platform || 'General'}</span>
                                    </div>

                                    <div className="pt-12">
                                        <h3 className="font-black text-xl text-black truncate">{c.handle || c.name || "Unknown"}</h3>
                                        <p className="text-sm text-gray-500 font-medium mt-1 truncate">{c.name || c.handle}</p>

                                        {/* Stats Grid */}
                                        <div className="mt-6 grid grid-cols-2 gap-3">
                                            <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl border border-amber-200/50">
                                                <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Followers</div>
                                                <div className="text-xl font-black text-amber-900">
                                                    {formatFollowers(c.followers)}
                                                </div>
                                            </div>
                                            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200/50 flex flex-col justify-center">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Region</div>
                                                <div className="text-sm font-black text-gray-900 truncate">
                                                    {c.region || "N/A"}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div className="mt-4">
                                            {c.email && c.email !== 'No email' ? (
                                                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-100">
                                                    <span className="truncate">{c.email}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-400 rounded-xl text-xs font-bold border border-gray-100">
                                                    <span>No Email Captured</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Niche/Bio Snippet */}
                                        {c.niche && (
                                            <div className="mt-3 px-3 py-2 bg-gray-50 rounded-xl text-[10px] text-gray-600 font-medium border border-gray-100 line-clamp-2">
                                                {c.niche}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        {hasMore && !loading && !error && (
                            <div className="col-span-full py-10 flex justify-center">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="px-10 py-4 bg-black text-white font-black rounded-2xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-xl"
                                >
                                    {loadingMore ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Loading More...
                                        </>
                                    ) : (
                                        "Load More Records"
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
