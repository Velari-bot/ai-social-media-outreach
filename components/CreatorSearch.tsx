"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Instagram, Youtube, Lock, User, HelpCircle } from "lucide-react";
import Link from "next/link";

interface CreatorResult {
    id: string;
    handle: string;
    platform: string;
    name: string;
    picture: string;
    followers: number;
    locked_info: boolean;
}

export default function CreatorSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<CreatorResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length >= 2) {
                setIsLoading(true);
                try {
                    const res = await fetch(`/api/public/creators/search?q=${encodeURIComponent(query)}`);
                    const data = await res.json();
                    setResults(data.creators || []);
                    setShowResults(true);
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setResults([]);
                setShowResults(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [query]);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
        if (num >= 1000) return (num / 1000).toFixed(1) + "K";
        return num.toString();
    };

    const getPlatformIcon = (platform: string) => {
        switch (platform.toLowerCase()) {
            case "instagram": return <Instagram className="w-3 h-3 text-pink-600" />;
            case "youtube": return <Youtube className="w-3 h-3 text-red-600" />;
            case "tiktok":
                return (
                    <svg className="w-3 h-3 text-black" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                    </svg>
                );
            default: return <User className="w-3 h-3 text-gray-400" />;
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto relative z-50" ref={searchRef}>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#6B4BFF] transition-colors" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6B4BFF]/20 focus:border-[#6B4BFF] shadow-lg shadow-black/5 transition-all text-lg"
                    placeholder="Look up a creator (e.g. @mrbeast)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (results.length > 0) setShowResults(true);
                    }}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    {isLoading && <Loader2 className="h-5 w-5 text-[#6B4BFF] animate-spin" />}
                </div>
            </div>

            {/* Results Dropdown */}
            {showResults && results.length > 0 && (
                <div className="absolute mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-2">
                        <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Best Match
                        </div>
                        {results.slice(0, 3).map((creator) => (
                            <CreatorResultItem
                                key={creator.id}
                                creator={creator}
                                formatNumber={formatNumber}
                                getPlatformIcon={getPlatformIcon}
                            />
                        ))}
                        <Link href="/signup" className="block px-4 py-3 text-center bg-gray-50 hover:bg-gray-100 text-[#6B4BFF] font-bold text-sm transition-colors">
                            View all {results.length} results
                        </Link>
                    </div>
                </div>
            )}

            {showResults && results.length === 0 && query.length >= 2 && !isLoading && (
                <div className="absolute mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 text-center animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link href="/signup" className="text-gray-500 font-medium hover:text-[#6B4BFF] transition-colors">
                        Be the first one to find that person today
                    </Link>
                </div>
            )}
        </div>
    );
}

function CreatorResultItem({
    creator,
    formatNumber,
    getPlatformIcon
}: {
    creator: CreatorResult;
    formatNumber: (n: number) => string;
    getPlatformIcon: (p: string) => JSX.Element;
}) {
    const [imgError, setImgError] = useState(false);

    return (
        <Link
            href="/signup"
            className="block px-4 py-3 hover:bg-gray-50 transition-colors group border-b border-gray-50 last:border-0"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200 shrink-0 flex items-center justify-center">
                        {!imgError && creator.picture ? (
                            <img
                                src={creator.picture}
                                alt={creator.name}
                                className="w-full h-full object-cover"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <HelpCircle className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-900">{creator.name}</span>
                            {creator.platform && (
                                <span className="p-1 bg-gray-100 rounded-full">
                                    {getPlatformIcon(creator.platform)}
                                </span>
                            )}
                        </div>
                        <div className="text-sm text-gray-500 font-medium">@{creator.handle.replace(/^@/, '')}</div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-bold text-gray-900">{formatNumber(creator.followers)}</div>
                        <div className="text-xs text-gray-400">Followers</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[#6B4BFF] group-hover:text-white transition-all">
                        <Lock className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
