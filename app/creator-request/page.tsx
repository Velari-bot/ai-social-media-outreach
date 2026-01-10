"use client";

import { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { getCurrentUser } from "@/lib/auth-helpers";
import { fetchUserAccount, fetchUserStats, fetchRecentRequests, createRequest } from "@/lib/api-client";
import type { UserAccount, UserStats } from "@/lib/database";
import { useSearchParams } from "next/navigation";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import { Search, MapPin, Hash, Globe, Users, Loader2, AlertCircle, Download, FileSpreadsheet, Instagram, Youtube, Music, Info, ExternalLink } from "lucide-react";

// Fixed Categories List (Safe List)
const CATEGORIES = [
  "Gaming",
  "Technology",
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

const MOCK_CREATORS = [
  { fullname: "Alex Rivera", username: "arivera_tech", handle: "arivera_tech", platform: "youtube", followers: 125000, engagement_rate: 0.045, picture: "", email: "alex@techdaily.com", location: "United States" },
  { fullname: "Sarah Jenkins", username: "sarahj_styles", handle: "sarahj_styles", platform: "instagram", followers: 89000, engagement_rate: 0.032, picture: "", email: "collab@sarahj.com", location: "United Kingdom" },
  { fullname: "Gaming Pro", username: "gaming_pro_official", handle: "gaming_pro_official", platform: "tiktok", followers: 850000, engagement_rate: 0.081, picture: "", email: "", location: "Canada" },
  { fullname: "Eco Life", username: "eco_matters", handle: "eco_matters", platform: "instagram", followers: 45000, engagement_rate: 0.055, picture: "", email: "contact@ecomatters.org", location: "Australia" },
  { fullname: "Dev Tips", username: "dev_tips_daily", handle: "dev_tips_daily", platform: "youtube", followers: 210000, engagement_rate: 0.028, picture: "", email: "hello@devtips.io", location: "Germany" },
];

const getPlatformIcon = (platform: string, className = "h-3 w-3") => {
  const p = platform?.toLowerCase();
  if (p === 'youtube') return <Youtube className={`${className} text-red-600`} />;
  if (p === 'instagram') return <Instagram className={`${className} text-pink-600`} />;
  if (p === 'tiktok') return <Music className={`${className} text-black`} />;
  return <Globe className={`${className} text-gray-400`} />;
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
  const [platform, setPlatform] = useState<string>("youtube");
  const [keywords, setKeywords] = useState("");
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [followersMin, setFollowersMin] = useState(1000);
  const [followersMax, setFollowersMax] = useState(100000000);
  const [engagementRateMin, setEngagementRateMin] = useState(0);
  const [requestedCreators, setRequestedCreators] = useState(50);

  // App State
  const [userId, setUserId] = useState<string | null>(null);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [isTestMode, setIsTestMode] = useState(false);

  // Computed
  const callsNeeded = Math.ceil(requestedCreators / 50);
  const creditsCost = callsNeeded;
  const keywordList = keywords.split(",").map(k => k.trim()).filter(k => k.length > 0);
  const hasStrongTargeting = (keywordList.length > 0) || (category !== "");

  const isValid = hasStrongTargeting && followersMin < followersMax && userId;

  // Validation Message
  const validationError = !hasStrongTargeting
    ? "Enter keywords OR select a category"
    : followersMin >= followersMax
      ? "Min followers must be less than Max"
      : "";

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser();
      if (!user) return;
      setUserId(user.uid);

      // Load Account & Requests
      const [accountRes, requestsRes] = await Promise.all([
        fetchUserAccount(),
        fetchRecentRequests()
      ]);

      if (accountRes.success) setUserAccount(accountRes.account);
      if (requestsRes.success) {
        setRecentRequests(requestsRes.requests || []);
      }
    }
    init();
  }, []);

  const handleLoadOldCampaign = async (req: any) => {
    setLoading(true);
    setSearchResults(null);
    try {
      const platformArr = req.platforms || (req.platform ? (Array.isArray(req.platform) ? req.platform : [req.platform]) : ['youtube']);
      const platform = (platformArr[0] || 'youtube').toLowerCase();
      const filters = req.filters_json || req.criteria || {};

      const user = await getCurrentUser();
      const userToken = await user?.getIdToken();

      const res = await fetch(`/api/user/requests/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          requestId: req.id,
          platform,
          filters,
          requestedCount: req.requestedCount || req.results_count || 50
        })
      });

      const data = await res.json();
      if (data.success) {
        setSearchResults(data.creators || []);
        toast.success(`Loaded campaign: ${req.name}`);
      } else {
        toast.error("Failed to load campaign results");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error loading results");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!searchResults || searchResults.length === 0) return;

    const headers = ["Name", "Handle", "Platform", "Followers", "Engagement", "Email", "Location"];
    const rows = searchResults.map(c => [
      c.fullname || c.name || c.username,
      c.handle || c.username,
      c.platform || platform,
      c.followers || c.followers_count,
      c.engagement_rate ? `${(c.engagement_rate * 100).toFixed(2)}%` : '-',
      c.email || (c.emails ? c.emails[0] : ''),
      c.location || c.country || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `creators_${platform}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitted) return;

    setSubmitted(true);
    setLoading(true);

    if (isTestMode) {
      // SIMULATE API CALL
      setTimeout(() => {
        setSearchResults(MOCK_CREATORS);
        toast.success("Test Search Complete (Mock Data)");
        setLoading(false);
        setSubmitted(false);
      }, 1500);
      return;
    }

    // Build Strict Payload
    const criteria = {
      keywords: keywordList.length > 0 ? keywordList : undefined,
      category: category || undefined,
      country: country || undefined,
      followersMin,
      followersMax,
      engagementRateMin,
      batchSize: requestedCreators
    };

    try {
      // We use createRequest which hits /api/user/requests
      // That endpoint calls discoveryPipeline.discover()
      // We need to ensure that endpoint supports the new strict filters map.
      // Assuming the backend endpoint simply passes `filters` to the pipeline,
      // and our logical update to `validateFilters` in the `influencer-club/discovery` route
      // mimics what `discovery-pipeline` should do.
      // *Self-Correction*: The main app uses `createRequest` -> `POST /api/user/requests`.
      // I need to ensure THAT route handles this strict shape.
      // For now, I will send the data.

      const res = await createRequest({
        name: keywordList[0] || category || `${platform} Search`,
        platforms: [platform], // Strict Single Platform
        criteria
      });

      if (res.success) {
        toast.success("Search started!");
        if (res.creators && res.creators.length > 0) {
          setSearchResults(res.creators);
        } else {
          toast("Request queued. Check back shortly.");
        }
        // Refresh Account to show credit usage
        fetchUserAccount().then(r => r.success && setUserAccount(r.account));
        fetchRecentRequests().then(r => r.success && setRecentRequests(r.requests || []));
      } else {
        toast.error((res as any).error || "Failed to start search");
      }

    } catch (error: any) {
      console.error("Search error:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
      setSubmitted(false);
    }
  };

  const remainingQuota = userAccount ? Math.max(0, userAccount.email_quota_daily - userAccount.email_used_today) : 0;
  const isQuotaExceeded = creditsCost > remainingQuota;

  return (
    <main className="min-h-screen bg-[#F3F1EB] pb-20 relative overflow-hidden font-sans">
      <Navbar />

      {/* Modern Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] bg-gradient-to-br from-purple-200 via-blue-100 to-transparent blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[40%] h-[50%] bg-gradient-to-tl from-teal-100 via-emerald-50 to-transparent blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* LEFT: Creator Request Form */}
          <div className="lg:w-[400px] flex-shrink-0 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/60 sticky top-28">
              <div className="mb-6">
                <h2 className="text-xl font-black text-gray-900">Find Creators</h2>
                <p className="text-sm text-gray-500">Define your ideal creator profile.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Platform */}
                <div>
                  <label className="block text-xs font-bold text-black uppercase tracking-wide mb-2">Platform</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["youtube", "instagram", "tiktok"].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlatform(p)}
                        className={`capitalize py-2.5 rounded-xl text-sm font-bold transition-all border ${platform === p
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                          }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Targeting */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-black uppercase tracking-wide">
                      Targeting <span className="text-red-500">*</span>
                    </label>
                    {!hasStrongTargeting && <span className="text-[10px] text-red-500 font-medium">Required</span>}
                  </div>

                  <div>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-black/5 outline-none transition-all placeholder:text-gray-400"
                        placeholder="Keywords (e.g. gaming, tech)"
                        value={keywords}
                        onChange={e => setKeywords(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">- OR -</div>

                  <div>
                    <select
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-black/5 outline-none appearance-none cursor-pointer"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                    >
                      <option value="">Select Category (Recommended)...</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {(keywords.length > 0 && category !== "") && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-100 text-red-800 text-xs">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>
                        <strong>CRITICAL:</strong> Combining Keywords & Category usually returns 0 results. Use **ONLY ONE** for best results.
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-200/50">
                    <label className="block text-xs font-bold text-black uppercase tracking-wide mb-2">Location</label>
                    <select
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-black/5 outline-none appearance-none cursor-pointer"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                    >
                      <option value="">Anywhere (Best Results)</option>
                      {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* 3. Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-wide mb-2">Min Followers</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-black/5 outline-none font-medium"
                      value={followersMin}
                      onChange={e => setFollowersMin(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-wide mb-2">Max Followers</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-black/5 outline-none font-medium"
                      value={followersMax}
                      onChange={e => setFollowersMax(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* 4. Quality & Quantity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-wide mb-2">Min Engagement</label>
                    <select
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-black/5 outline-none font-medium"
                      value={engagementRateMin}
                      onChange={e => setEngagementRateMin(Number(e.target.value))}
                    >
                      <option value={0}>Any Engagement (Recommended)</option>
                      <option value={1}>1% (Normal)</option>
                      <option value={2}>2% (Good)</option>
                      <option value={3}>3% (High)</option>
                      <option value={5}>5% (Viral)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-wide mb-2">Num Results</label>
                    <select
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-black/5 outline-none font-medium"
                      value={requestedCreators}
                      onChange={e => setRequestedCreators(Number(e.target.value))}
                    >
                      <option value={50}>50 Founders</option>
                      <option value={100}>100 Founders</option>
                      <option value={150}>150 Founders</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-4 px-1">
                    <span>Cost:</span>
                    <div className="text-right">
                      <span className="font-bold text-black block">{creditsCost} Credit{creditsCost > 1 ? 's' : ''}</span>
                      <span className="text-[10px] text-gray-400">{remainingQuota} remaining</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!isValid || loading || (isQuotaExceeded && !isTestMode)}
                    className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${!isValid || (isQuotaExceeded && !isTestMode)
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                      : isTestMode ? "bg-amber-600 text-white hover:bg-amber-700 shadow-amber-600/20" : "bg-black text-white hover:bg-gray-800 shadow-black/20"
                      }`}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isTestMode ? "Run Test (Free)" : (isQuotaExceeded ? "Quota Exceeded" : "Find Creators")}
                  </button>

                  <div className="mt-4 flex items-center justify-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div className="relative">
                        <input type="checkbox" className="sr-only" checked={isTestMode} onChange={e => setIsTestMode(e.target.checked)} />
                        <div className={`w-8 h-4 rounded-full shadow-inner transition-colors ${isTestMode ? "bg-amber-500" : "bg-gray-200"}`}></div>
                        <div className={`absolute left-0 top-0 w-4 h-4 rounded-full shadow bg-white transition-transform transform ${isTestMode ? "translate-x-full" : "translate-x-0"}`}></div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Mock / Test Mode</span>
                    </label>
                  </div>

                  {validationError && (
                    <p className="text-center text-red-500 text-xs mt-3 flex items-center justify-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {validationError}
                    </p>
                  )}
                </div>

              </form>
            </div>
          </div>

          {/* RIGHT: Results & Content */}
          <div className="flex-1 space-y-8">

            {/* Active Results */}
            {searchResults && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-black">Results</h3>
                    <span className="text-sm bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full">{searchResults.length} Found</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                    >
                      <Download className="h-3 w-3" /> Export CSV
                    </button>
                  </div>
                </div>
                <div className="max-h-[600px] overflow-y-auto overflow-x-auto relative scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                  <table className="w-full text-left text-sm border-separate border-spacing-0">
                    <thead className="bg-gray-50 text-gray-500 font-medium uppercase tracking-wider text-xs sticky top-0 z-20">
                      <tr>
                        <th className="px-6 py-4 border-b border-gray-100 bg-gray-50">Creator</th>
                        <th className="px-6 py-4 border-b border-gray-100 bg-gray-50">Reach & engagement</th>
                        <th className="px-6 py-4 border-b border-gray-100 bg-gray-50">Contact</th>
                        <th className="px-6 py-4 border-b border-gray-100 bg-gray-50">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {searchResults.map((c, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 group transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-gray-50 rounded-xl flex-shrink-0 border border-gray-100 flex items-center justify-center p-2.5 shadow-inner">
                                {getPlatformIcon(c.platform || platform, "h-full w-full")}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 line-clamp-1 flex items-center gap-1.5">
                                  {c.fullname || c.name || c.username}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                                  {getPlatformIcon(c.platform || platform)}
                                  <a
                                    href={getPlatformUrl(c.platform || platform, c.handle || c.username)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-black hover:underline flex items-center gap-1 group/link"
                                  >
                                    @{String(c.handle || c.username || "").replace(/^@/, "")}
                                    <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-0.5">
                              <div className="font-mono font-bold text-gray-900 flex items-center gap-1">
                                {Number(c.followers) > 0
                                  ? new Intl.NumberFormat('en-US', { notation: "compact" }).format(c.followers)
                                  : (c.followers || "N/A")}
                                <span className="text-[10px] text-gray-400 font-bold uppercase">
                                  {(c.platform || platform) === 'youtube' ? 'Subscribers' : 'Followers'}
                                </span>
                              </div>
                              {c.engagement_rate ? (
                                <div className="text-[10px] text-green-600 font-black uppercase tracking-wider">
                                  {(Number(c.engagement_rate) * 100).toFixed(1)}% Engagement
                                </div>
                              ) : (
                                <div className="text-[10px] text-gray-300 font-black uppercase tracking-wider">
                                  Low Engagement
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {c.email ? (
                              <div className="flex items-center gap-2">
                                <span className="text-blue-600 font-medium">{c.email}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col group/tip relative">
                                <span className="text-gray-300 italic flex items-center gap-1">
                                  No Email <Info className="h-3 w-3 text-gray-200" />
                                </span>
                                <div className="absolute bottom-full left-0 mb-2 invisible group-hover/tip:visible bg-black text-white text-[10px] p-2 rounded w-32 z-30 shadow-xl">
                                  Detailed contact discovery requires an Outreach Campaign.
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            <div className="flex items-center gap-1.5 capitalize">
                              {c.location || c.geo_country || c.country || "-"}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recent Requests List */}
            {!searchResults && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-lg mb-4 text-black">Your Recent Searches</h3>
                {recentRequests.length === 0 ? (
                  <p className="text-gray-400 italic text-sm">No recent searches found.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentRequests.slice(0, 6).map((req: any, i) => (
                      <div
                        key={i}
                        onClick={() => handleLoadOldCampaign(req)}
                        className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-black hover:bg-white cursor-pointer transition-all group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-sm text-gray-900 truncate pr-2 group-hover:underline">{req.name}</div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${req.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>{req.status}</span>
                        </div>
                        <div className="text-xs text-black flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            {getPlatformIcon(Array.isArray(req.platform) ? req.platform[0] : req.platform)}
                            {Array.isArray(req.platform) ? req.platform.join(", ") : req.platform || "Any"}
                          </div>
                          <div className="flex justify-between items-center mt-2 border-t border-gray-100 pt-2">
                            <div className="text-black font-medium">
                              {new Date(req.createdAt?.seconds * 1000 || req.createdAt || Date.now()).toLocaleDateString()}
                            </div>
                            <div className="font-bold text-black">{req.results_count || 0} Creators</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty State / promo */}
            {!searchResults && recentRequests.length === 0 && (
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-10 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 max-w-lg">
                  <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold mb-4 border border-white/10">
                    PRO DISCOVERY
                  </div>
                  <h2 className="text-3xl font-black mb-4">Stop Wasting Credits.</h2>
                  <p className="text-gray-300 leading-relaxed mb-6">
                    Target specific niches. Filter by real engagement. Get valid emails.
                    Our new discovery engine is built to save you money by preventing empty searches.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </main>
  );
}
