'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/auth-helpers';
import Navbar from '@/components/Navbar';
import { Search, Mail, ExternalLink, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

interface Creator {
    id: string;
    handle: string;
    platform: string;
    fullname?: string;
    followers?: number;
    engagement_rate?: number;
    emails?: string[];
    picture?: string;
    request_id?: string;
    campaign_id?: string;
    created_at: string;
}

export default function AllCreatorsPage() {
    const [creators, setCreators] = useState<Creator[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [platformFilter, setPlatformFilter] = useState<string>('all');
    const [emailFilter, setEmailFilter] = useState<'all' | 'with' | 'without'>('all');

    useEffect(() => {
        fetchAllCreators();
    }, []);

    async function fetchAllCreators() {
        try {
            const user = await getCurrentUser();
            if (!user) {
                toast.error('Please sign in');
                return;
            }

            const token = await user.getIdToken();
            const res = await fetch('/api/creators/all', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (data.success) {
                setCreators(data.creators || []);
            } else {
                toast.error(data.error || 'Failed to load creators');
            }
        } catch (error: any) {
            console.error('Error fetching creators:', error);
            toast.error('Failed to load creators');
        } finally {
            setLoading(false);
        }
    }

    // Filter creators
    const filteredCreators = creators.filter(creator => {
        // Search filter
        const matchesSearch = !searchTerm ||
            creator.handle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            creator.fullname?.toLowerCase().includes(searchTerm.toLowerCase());

        // Platform filter
        const matchesPlatform = platformFilter === 'all' || creator.platform === platformFilter;

        // Email filter
        const hasEmail = creator.emails && creator.emails.length > 0;
        const matchesEmail = emailFilter === 'all' ||
            (emailFilter === 'with' && hasEmail) ||
            (emailFilter === 'without' && !hasEmail);

        return matchesSearch && matchesPlatform && matchesEmail;
    });

    const stats = {
        total: creators.length,
        withEmails: creators.filter(c => c.emails && c.emails.length > 0).length,
        instagram: creators.filter(c => c.platform === 'instagram').length,
        tiktok: creators.filter(c => c.platform === 'tiktok').length,
        youtube: creators.filter(c => c.platform === 'youtube').length
    };

    return (
        <main className="min-h-screen bg-[#F3F1EB] pb-20">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-32">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-gray-900">All Creators</h1>
                    <p className="text-gray-600 mt-2">View all creators from your campaigns</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100">
                        <div className="text-2xl font-black text-gray-900">{stats.total}</div>
                        <div className="text-xs text-gray-500 font-medium">Total Creators</div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100">
                        <div className="text-2xl font-black text-green-600">{stats.withEmails}</div>
                        <div className="text-xs text-gray-500 font-medium">With Emails</div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100">
                        <div className="text-2xl font-black text-pink-600">{stats.instagram}</div>
                        <div className="text-xs text-gray-500 font-medium">Instagram</div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100">
                        <div className="text-2xl font-black text-black">{stats.tiktok}</div>
                        <div className="text-xs text-gray-500 font-medium">TikTok</div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100">
                        <div className="text-2xl font-black text-red-600">{stats.youtube}</div>
                        <div className="text-xs text-gray-500 font-medium">YouTube</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by handle or name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none"
                            />
                        </div>

                        {/* Platform Filter */}
                        <select
                            value={platformFilter}
                            onChange={(e) => setPlatformFilter(e.target.value)}
                            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none"
                        >
                            <option value="all">All Platforms</option>
                            <option value="instagram">Instagram</option>
                            <option value="tiktok">TikTok</option>
                            <option value="youtube">YouTube</option>
                        </select>

                        {/* Email Filter */}
                        <select
                            value={emailFilter}
                            onChange={(e) => setEmailFilter(e.target.value as any)}
                            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none"
                        >
                            <option value="all">All Creators</option>
                            <option value="with">With Emails</option>
                            <option value="without">Without Emails</option>
                        </select>
                    </div>
                </div>

                {/* Creators List */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                        <p className="mt-4 text-gray-600">Loading creators...</p>
                    </div>
                ) : filteredCreators.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                        <p className="text-gray-600">No creators found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCreators.map((creator) => (
                            <div
                                key={creator.id}
                                className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start gap-4">
                                    {creator.picture ? (
                                        <img
                                            src={creator.picture}
                                            alt={creator.handle}
                                            className="w-16 h-16 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                                            <span className="text-2xl">👤</span>
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-900 truncate">
                                                @{creator.handle}
                                            </h3>
                                            <a
                                                href={`https://${creator.platform}.com/${creator.handle}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>

                                        {creator.fullname && (
                                            <p className="text-sm text-gray-600 mb-2">{creator.fullname}</p>
                                        )}

                                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                                            <span className="capitalize font-medium">{creator.platform}</span>
                                            {creator.followers && (
                                                <span>{(creator.followers / 1000).toFixed(1)}K followers</span>
                                            )}
                                        </div>

                                        {creator.emails && creator.emails.length > 0 ? (
                                            <div className="flex items-center gap-2 text-xs">
                                                <Mail className="w-4 h-4 text-green-600" />
                                                <span className="text-green-600 font-medium truncate">
                                                    {creator.emails[0]}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <Mail className="w-4 h-4" />
                                                <span>No email</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Results count */}
                {!loading && filteredCreators.length > 0 && (
                    <div className="mt-6 text-center text-sm text-gray-600">
                        Showing {filteredCreators.length} of {creators.length} creators
                    </div>
                )}
            </div>
        </main>
    );
}
