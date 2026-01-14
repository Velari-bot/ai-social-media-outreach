"use client";

import { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { getCurrentUser } from "@/lib/auth-helpers";
import { fetchUserAccount, fetchUserStats, fetchRecentRequests, createRequest } from "@/lib/api-client";
import type { UserAccount } from "@/lib/database";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import { Search, Loader2, Download, Instagram, Youtube, Music, ExternalLink, CheckCircle } from "lucide-react";

import { useRouter } from "next/navigation";
import { FLATTENED_TOPICS } from "@/lib/data/classifiers";

// 1. Dynamic Niches List from Classifiers (API aligned)
// Updated with new filters
const NICHES = FLATTENED_TOPICS.map(t => t.name); // ... existing code ...

// Fallback if data is missing
if (NICHES.length === 0) {
  NICHES.push("Gaming", "Fashion", "Tech", "Beauty");
}

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
  const [niche, setNiche] = useState(NICHES[0] || "Gaming"); // Default to first available niche
  const [followersMin, setFollowersMin] = useState(1000);
  const [followersMax, setFollowersMax] = useState(250000);
  const [minAvgViews, setMinAvgViews] = useState(0);
  const [location, setLocation] = useState("United States");
  const [requestedCreators, setRequestedCreators] = useState(50);
  const [isAnyNiche, setIsAnyNiche] = useState(false);

  // App State
  const [userId, setUserId] = useState<string | null>(null);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(false);

  // Results State
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  // Computed
  const creditsCost = requestedCreators;
  const remainingQuota = userAccount ? Math.max(0, userAccount.email_quota_daily - userAccount.email_used_today) : 0;
  const isQuotaExceeded = creditsCost > remainingQuota;

  const isValid =
    (niche.length > 0 || isAnyNiche) &&
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

      if (accountRes.success) {
        const account = accountRes.account;
        setUserAccount(account);

        // PLAN CHECK: If you want to restrict this page to only "custom_no_email"
        // Uncomment the below logic. For now, it's open to verify layout.
        /*
        if (account.plan !== 'custom_no_email' && account.plan !== 'enterprise' && account.plan !== 'agency') {
           toast.error("This feature is not included in your plan.");
           router.push('/dashboard');
        }
        */
      }
      if (requestsRes.success) setRecentRequests(requestsRes.requests || []);
    }
    init();
  }, []);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);
    setSearchResults(null);

    try {
      const criteria: any = {
        batchSize: requestedCreators,
        niche: niche.trim(),
        min_followers: followersMin,
        max_followers: followersMax,
        min_avg_views: minAvgViews,
        location: location,
        skipEnrichment: true  // Do not find emails
      };

      const res = await createRequest({
        name: `${niche} (DB Search)`,
        platforms: [platform],
        criteria
      });

      if (res.success) {
        toast.success("Request sent!");
        if (res.creators && res.creators.length > 0) {
          setSearchResults(res.creators);
          toast.success(`${res.creators.length} creators found!`);
        } else {
          toast.error("No creators found. Try adjusting your filters.");
        }
        fetchUserAccount().then(r => r.success && setUserAccount(r.account));
        fetchRecentRequests().then(r => r.success && setRecentRequests(r.requests || []));
      }

    } catch (error: any) {
      console.error("Search error:", error);
      toast.error(error.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecentClick = async (req: any) => {
    const loadingToast = toast.loading("Loading campaign results...");
    try {
      const token = await (await getCurrentUser())?.getIdToken();
      const res = await fetch(`/api/user/requests/${req.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        // Sync the form filters for convenience
        if (req.platforms?.[0]) setPlatform(req.platforms[0].toLowerCase());
        if (req.criteria?.niche) setNiche(req.criteria.niche);
        if (req.criteria?.min_followers) setFollowersMin(req.criteria.min_followers);
        if (req.criteria?.max_followers) setFollowersMax(req.criteria.max_followers);
        if (req.criteria?.min_avg_views) setMinAvgViews(req.criteria.min_avg_views);
        if (req.criteria?.location) setLocation(req.criteria.location);
        if (req.criteria?.batchSize) setRequestedCreators(req.criteria.batchSize);

        // Show results
        setSearchResults(data.creators || []);
        toast.success(`Loaded ${data.creators?.length || 0} creators from history.`, { id: loadingToast });
      } else {
        toast.error("Could not load campaign results.", { id: loadingToast });
      }
    } catch (e) {
      toast.error("Error loading results.", { id: loadingToast });
    }
  };

  const handleRefreshAll = async () => {
    if (!searchResults || searchResults.length === 0) return;

    // Find the latest request ID from recentRequests that matches current search?
    // Actually, let's just re-fetch by IDs if we have them. 
    // To keep it simple, we'll try to find which request this result set belongs to.
    const loadingToast = toast.loading("Checking for new emails...");
    try {
      // Get all current IDs
      const ids = searchResults.map(c => c.id);
      const token = await (await getCurrentUser())?.getIdToken();

      // We'll hit an endpoint that just resolves multiple IDs without triggering logic
      const res = await fetch(`/api/creators/batch`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ids })
      });

      const data = await res.json();
      if (data.success) {
        setSearchResults(data.creators);
        toast.success("Statuses updated!", { id: loadingToast });
      } else {
        toast.error("Refresh failed.", { id: loadingToast });
      }
    } catch (e) {
      toast.error("Error refreshing.", { id: loadingToast });
    }
  };

  const handleRefreshEnrichment = async (creatorId: string) => {
    const loadingToast = toast.loading("Refreshing emails...");
    try {
      const token = await (await getCurrentUser())?.getIdToken();
      const res = await fetch(`/api/creators/${creatorId}/enrich`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Enriched successfully!", { id: loadingToast });
        setSearchResults(prev => prev?.map(c => c.id === creatorId ? { ...c, ...data.creator } : c) || null);
      } else {
        toast.error(data.error || "Failed to refresh.", { id: loadingToast });
      }
    } catch (e) {
      toast.error("Error refreshing enrichment.", { id: loadingToast });
    }
  };

  const formatDate = (dateVal: any) => {
    if (!dateVal) return "Just now";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "Recently";
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return "Recently";
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
                <h2 className="text-2xl font-black text-gray-900">Creator Database</h2>
                <p className="text-sm text-gray-500 mt-1">Search the database without finding emails.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
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

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-extrabold text-gray-900 uppercase tracking-widest">Niche <span className="text-red-500">*</span></label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAnyNiche}
                        onChange={e => {
                          setIsAnyNiche(e.target.checked);
                          if (e.target.checked) setNiche(""); // Clear niche if "Any" is selected
                          else setNiche(NICHES[0] || "Gaming");
                        }}
                        className="h-3 w-3 rounded border-gray-300 text-black focus:ring-black"
                      />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">No preference (Broad Search)</span>
                    </label>
                  </div>
                  <select
                    className={`w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none appearance-none cursor-pointer ${isAnyNiche ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
                    value={niche}
                    onChange={e => setNiche(e.target.value)}
                    disabled={isAnyNiche}
                  >
                    {!isAnyNiche && NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                    {isAnyNiche && <option value="">Any Niche</option>}
                  </select>
                  {isAnyNiche && <p className="text-[10px] text-blue-600 font-bold mt-1.5">Note: Searching without a specific niche yields significantly more results (up to 50).</p>}
                </div>


                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-gray-900 uppercase tracking-widest mb-2">Location</label>
                    <select
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none appearance-none cursor-pointer"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                    >
                      <option value="">Anywhere</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-gray-900 uppercase tracking-widest mb-2">Min Avg Views</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                      value={minAvgViews}
                      onChange={e => setMinAvgViews(Number(e.target.value))}
                      placeholder="e.g. 10000"
                      step={1000}
                    />
                  </div>
                </div>

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
                    <span className="text-sm font-black text-black">{creditsCost} Credits</span>
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
                  <button
                    key={i}
                    onClick={() => handleRecentClick(req)}
                    className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm text-left hover:border-black transition-all group"
                  >
                    <div className="font-bold text-sm text-gray-900 truncate group-hover:text-black">{req.name}</div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                      {formatDate(req.created_at || req.date_submitted)}
                      <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded uppercase font-bold">{req.platforms?.[0]}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchResults && (
              <div className="space-y-6 animate-in slide-in-from-bottom-5 fade-in duration-500">

                {/* Header & Actions */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-black text-2xl text-gray-900 flex items-center gap-2">
                      {searchResults.length} Creators Found
                      <span className="bg-black text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Database</span>
                    </h3>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setSearchResults(null)}
                      className="flex-1 sm:flex-none text-xs font-bold bg-white border border-gray-200 px-4 py-3 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-500 transition-all hover:scale-105"
                    >
                      New Search
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="flex-1 sm:flex-none text-xs font-bold bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 flex items-center justify-center gap-2 shadow-lg shadow-black/20 transition-all hover:scale-105"
                    >
                      <Download className="h-4 w-4" /> Export Results
                    </button>
                  </div>
                </div>

                {/* Grid Results */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map((c, i) => (
                    <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col gap-4 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 group relative overflow-hidden">
                      {/* Decorative Background Blur */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-3xl -z-10 group-hover:bg-blue-50 transition-colors" />

                      {/* Header: Picture & Basic Info */}
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 bg-gray-100 rounded-2xl flex-shrink-0 overflow-hidden relative border border-gray-100 shadow-inner group-hover:scale-105 transition-transform duration-300">
                          {c.picture ? (
                            <img src={c.picture} alt={c.handle} className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-50">{getPlatformIcon(c.platform, "h-6 w-6")}</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 mb-0.5">
                            {getPlatformIcon(c.platform)}
                            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider text">{c.platform}</span>
                          </div>
                          <h4 className="font-black text-lg text-gray-900 truncate leading-tight" title={c.full_name}>{c.full_name || c.name || c.handle}</h4>
                          <a
                            href={getPlatformUrl(c.platform, c.handle)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-gray-500 hover:text-black transition-colors flex items-center gap-1 mt-0.5"
                          >
                            @{c.handle?.replace(/^@+/, "")}
                            <ExternalLink className="h-3 w-3 opacity-50" />
                          </a>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100/50">
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Followers</p>
                          <p className="text-sm font-black text-gray-900">{new Intl.NumberFormat('en-US', { notation: "compact" }).format(c.followers)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100/50">
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Avg Views</p>
                          <p className="text-sm font-black text-gray-900">{c.avg_views ? new Intl.NumberFormat('en-US', { notation: "compact" }).format(c.avg_views) : '-'}</p>
                        </div>
                      </div>

                      {/* Location Badge */}
                      {(c.location || location !== "Anywhere") && (
                        <div className="bg-blue-50/50 rounded-lg px-3 py-2 flex items-center gap-2 mt-auto border border-blue-100/50">
                          <span className="text-xs font-bold text-blue-700 truncate">
                            From {c.location || location}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
    </main >
  );
}
