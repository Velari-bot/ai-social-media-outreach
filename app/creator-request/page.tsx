"use client";

import { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { getCurrentUser } from "@/lib/auth-helpers";
import { fetchUserAccount, fetchUserStats, fetchRecentRequests, createRequest } from "@/lib/api-client";
import type { UserAccount } from "@/lib/database";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import { Search, Loader2, AlertCircle, Download, Instagram, Youtube, Music, Info, ExternalLink, CheckCircle } from "lucide-react";

// 1. Fixed Niches List (Required)
const NICHES = [
  "Fitness",
  "Business",
  "Beauty",
  "Gaming",
  "Education",
  "Lifestyle",
  "Tech",
  "Fashion",
  "Food",
  "Travel",
  "Real Estate",
  "Other"
];

// Helper for UI icons
const getPlatformIcon = (platform: string, className = "h-4 w-4") => {
  const p = platform?.toLowerCase();
  if (p === 'youtube') return <Youtube className={`${className} text-red-600`} />;
  if (p === 'instagram') return <Instagram className={`${className} text-pink-600`} />;
  if (p === 'tiktok') return <Music className={`${className} text-black`} />;
  return <Search className={`${className} text-gray-400`} />;
};

const getPlatformUrl = (platform: string, handle: string) => {
  const p = platform?.toLowerCase();
  const h = handle?.replace(/^@/, "") || "";
  if (!h) return "#";
  if (p === 'youtube') return `https://youtube.com/@${h}`;
  if (p === 'instagram') return `https://instagram.com/${h}`;
  if (p === 'tiktok') return `https://tiktok.com/@${h}`;
  return "#";
};

export default function CreatorRequestPage() {
  return (
    <SubscriptionGuard>
      <Suspense fallback={<div className="min-h-screen bg-[#F3F1EB] flex items-center justify-center">Loading...</div>}>
        <CreatorRequestContent />
      </Suspense>
    </SubscriptionGuard>
  );
}

function CreatorRequestContent() {
  // State
  const [platform, setPlatform] = useState<string>("instagram");
  const [niche, setNiche] = useState("Fitness"); // Default to first common niche
  const [followersMin, setFollowersMin] = useState(10000);
  const [followersMax, setFollowersMax] = useState(250000);
  const [requestedCreators, setRequestedCreators] = useState(50);

  // App State
  const [userId, setUserId] = useState<string | null>(null);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);

  // Results State
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  // Computed
  const creditsCost = 1; // 1 credit per batch of 50 roughly, or explicitly defined
  const remainingQuota = userAccount ? Math.max(0, userAccount.email_quota_daily - userAccount.email_used_today) : 0;
  const isQuotaExceeded = creditsCost > remainingQuota;

  const isValid =
    niche.length > 0 &&
    niche.length > 0 &&
    followersMin < followersMax &&
    followersMin > 0;

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser();
      if (!user) return;
      setUserId(user.uid);

      const [accountRes, requestsRes] = await Promise.all([
        fetchUserAccount(),
        fetchRecentRequests()
      ]);

      if (accountRes.success) setUserAccount(accountRes.account);
      if (requestsRes.success) setRecentRequests(requestsRes.requests || []);
    }
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);
    setSearchResults(null); // Reset results to show loading state cleanly

    try {
      // Build Payload exactly as backend expects
      const criteria = {
        niche: niche,
        min_followers: followersMin,
        max_followers: followersMax,
        batchSize: requestedCreators
      };

      const res = await createRequest({
        name: `${niche}`,
        platforms: [platform],
        criteria
      });

      if (res.success) {
        toast.success("Request sent!");

        // Show creators immediately
        if (res.creators && res.creators.length > 0) {
          setSearchResults(res.creators);
          toast.success(`${res.creators.length} creators found!`);
        } else {
          // Handle 0 results gracefully (this technically shouldn't happen with the new robustness check, but just in case)
          toast.error("No creators found. Trying adjusting filters.");
        }

        // Refresh stats
        fetchUserAccount().then(r => r.success && setUserAccount(r.account));
        fetchRecentRequests().then(r => r.success && setRecentRequests(r.requests || []));

      } else {
        toast.error((res as any).error || "Search failed.");
      }

    } catch (error) {
      console.error("Search error:", error);
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!searchResults || searchResults.length === 0) return;
    const headers = ["Handle", "Platform", "Followers", "Email", "Status"];
    const rows = searchResults.map(c => [
      c.handle,
      c.platform,
      c.followers,
      c.email || "Pending",
      c.enrichment_status || "processing"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `creators_${niche}_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen bg-[#F3F1EB] pb-20 font-sans relative">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-32">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* LEFT: Request Form */}
          <div className="lg:w-[400px] flex-shrink-0">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 sticky top-28">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-gray-900">Find Creators</h2>
                <p className="text-sm text-gray-500 mt-1">Tell Influencer Club who you want.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* 1. Platform */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-900 uppercase tracking-widest mb-2">Platform</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["instagram", "tiktok", "youtube"].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlatform(p)}
                        className={`capitalize py-3 rounded-xl text-sm font-bold transition-all border ${platform === p ? "bg-black text-white border-black ring-2 ring-black/20" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                          }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>



                {/* 3. Niche */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-900 uppercase tracking-widest mb-2">Niche <span className="text-red-500">*</span></label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none appearance-none cursor-pointer"
                    value={niche}
                    onChange={e => setNiche(e.target.value)}
                  >
                    {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>

                {/* 4. Follower Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-gray-900 uppercase tracking-widest mb-2">Min Followers</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                      value={followersMin}
                      onChange={e => setFollowersMin(Number(e.target.value))}
                      step={100}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-gray-900 uppercase tracking-widest mb-2">Max Followers</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                      value={followersMax}
                      onChange={e => setFollowersMax(Number(e.target.value))}
                      step={100}
                    />
                  </div>
                </div>

                {/* 5. Results Count */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-900 uppercase tracking-widest mb-2">Results Limit</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none appearance-none cursor-pointer"
                    value={requestedCreators}
                    onChange={e => setRequestedCreators(Number(e.target.value))}
                  >
                    <option value={25}>25 Creators</option>
                    <option value={50}>50 Creators (Standard)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-gray-500">Estimated Cost</span>
                    <span className="text-sm font-black text-black">1 Credit</span>
                  </div>

                  <button
                    type="submit"
                    disabled={!isValid || loading || isQuotaExceeded}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-white shadow-xl ${!isValid || isQuotaExceeded
                      ? "bg-gray-300 cursor-not-allowed shadow-none"
                      : "bg-black hover:bg-gray-800 shadow-black/20"
                      }`}
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isQuotaExceeded ? "Quota Exceeded" : "Find Creators"}
                  </button>
                  {isQuotaExceeded && <p className="text-center text-xs text-red-500 font-bold mt-2">You need more credits.</p>}
                </div>

              </form>
            </div>
          </div>

          {/* RIGHT: Results Area */}
          <div className="flex-1 min-h-[500px]">

            {!searchResults && !loading && recentRequests.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in">
                <div className="col-span-full mb-2">
                  <h3 className="font-bold text-gray-900">Recent Searches</h3>
                </div>
                {recentRequests.slice(0, 6).map((req, i) => (
                  <div key={i} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm opacity-60 hover:opacity-100 transition-opacity">
                    <div className="font-bold text-sm text-gray-900 truncate">{req.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{new Date(req.createdAt?.seconds * 1000 || req.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}

            {searchResults && (
              <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-500">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div>
                    <h3 className="font-black text-xl text-gray-900 flex items-center gap-2">
                      {searchResults.length} Creators Found
                      <span className="bg-green-100 text-green-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Success</span>
                    </h3>
                    <p className="text-xs text-blue-600 font-medium mt-1 animate-pulse">
                      Emails usually arrive in 2–5 minutes.
                    </p>
                  </div>
                  <button onClick={handleExportCSV} className="text-xs font-bold bg-white border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50">
                    <Download className="h-3 w-3 inline mr-1" /> Export CSV
                  </button>
                </div>

                {/* List */}
                <div className="divide-y divide-gray-100">
                  {searchResults.map((c, i) => {
                    // Status Logic
                    const isEnriched = c.email_found || c.email;
                    const statusText = isEnriched ? "Email Found" : "Finding email...";
                    const statusClass = isEnriched ? "text-green-600 bg-green-50" : "text-blue-600 bg-blue-50 animate-pulse";

                    return (
                      <div key={i} className="p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors group">
                        {/* Avatar */}
                        <div className="h-12 w-12 bg-gray-100 rounded-full flex-shrink-0 overflow-hidden relative border border-gray-200">
                          {c.picture ? (
                            <img src={c.picture} alt={c.handle} className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              {getPlatformIcon(c.platform)}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 truncate">{c.full_name || c.name || c.handle}</h4>
                            {getPlatformIcon(c.platform)}
                          </div>
                          <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                            @{c.handle} • {new Intl.NumberFormat('en-US', { notation: "compact" }).format(c.followers)} Followers
                          </p>
                          {c.bio && (
                            <p className="text-[11px] text-gray-400 mt-1 line-clamp-1 italic">{c.bio}</p>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="text-right flex-shrink-0">
                          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${statusClass}`}>
                            {isEnriched ? <CheckCircle className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-spin" />}
                            {statusText}
                          </div>
                          {c.email && (
                            <div className="text-[10px] font-medium text-gray-900 mt-1">{c.email}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="h-full flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 text-black animate-spin mb-4" />
                <h3 className="font-bold text-lg text-gray-900">Finding Creators...</h3>
                <p className="text-gray-500 text-sm">Searching Influencer Club database.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
