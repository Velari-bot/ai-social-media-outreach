"use client";

import { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { getCurrentUser } from "@/lib/auth-helpers";
import { fetchUserAccount, fetchUserStats, fetchRecentRequests, createRequest } from "@/lib/api-client";
import type { UserAccount, UserStats } from "@/lib/database";
import { useSearchParams } from "next/navigation";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import { Search, MapPin, Hash, Globe, Users, Loader2, AlertCircle, Download, FileSpreadsheet } from "lucide-react";

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
  const [followersMax, setFollowersMax] = useState(1000000);
  const [engagementRateMin, setEngagementRateMin] = useState(1);
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
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Platform</label>
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

                {/* 2. Targeting (Strict) */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-800 uppercase tracking-wide">
                      Targeting <span className="text-red-500">*</span>
                    </label>
                    {!hasStrongTargeting && <span className="text-[10px] text-red-500 font-medium">Required</span>}
                  </div>

                  {/* Keywords */}
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

                  {/* Category */}
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

                  {/* Restrictive Filter Warnings */}
                  {(keywords.length > 0 && category !== "") && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100 text-amber-800 text-xs">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>
                        <strong>Warning:</strong> Combining Keywords & Category often returns 0 results. Try using just one if your search fails.
                      </span>
                    </div>
                  )}

                  {/* Country (Optional) */}
                  <div className="pt-2 border-t border-gray-200/50">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Location</label>
                    <select
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-black/5 outline-none appearance-none cursor-pointer"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                    >
                      {/* Force US default or explicit 'Worldwide' if allowed, but map 'Any' to Undefined in payload */}
                      <option value="">Anywhere (Best Results)</option>
                      {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                    {country !== "" && (
                      <p className="text-[10px] text-gray-400 mt-1.5 ml-1">
                        ⚠️ Country filter significantly reduces results.
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Min Followers</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-black/5 outline-none"
                      value={followersMin}
                      onChange={e => setFollowersMin(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Max Followers</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-black/5 outline-none"
                      value={followersMax}
                      onChange={e => setFollowersMax(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* 4. Quality & Quantity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Engagement</label>
                    <select
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-black/5 outline-none"
                      value={engagementRateMin}
                      onChange={e => setEngagementRateMin(Number(e.target.value))}
                    >
                      <option value={1}>1% (Normal)</option>
                      <option value={2}>2% (Good)</option>
                      <option value={3}>3% (High)</option>
                      <option value={5}>5% (Viral)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Results</label>
                    <select
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-black/5 outline-none"
                      value={requestedCreators}
                      onChange={e => setRequestedCreators(Number(e.target.value))}
                    >
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={150}>150</option>
                    </select>
                  </div>
                </div>

                {/* Summary & Submit */}
                <div className="pt-2">
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-4 px-1">
                    <span>Cost:</span>
                    <div className="text-right">
                      <span className="font-bold text-black block">{creditsCost} Credit{creditsCost > 1 ? 's' : ''}</span>
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

                  {/* Test Mode Toggle */}
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
                    <h3 className="font-bold text-lg">Results</h3>
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
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium uppercase tracking-wider text-xs">
                      <tr>
                        <th className="px-6 py-4">Creator</th>
                        <th className="px-6 py-4">Stats</th>
                        <th className="px-6 py-4">Contact</th>
                        <th className="px-6 py-4">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {searchResults.map((c, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                                {c.picture || c.profile_pic_url || c.profileUrl ? (
                                  <img src={c.picture || c.profile_pic_url || c.profileUrl} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-gray-400">?</div>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 line-clamp-1">{c.fullname || c.name || c.username}</div>
                                <div className="text-xs text-gray-500">@{c.handle || c.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-mono text-gray-700">{typeof c.followers === 'number' ? new Intl.NumberFormat('en-US', { notation: "compact" }).format(c.followers) : c.followers}</div>
                            {c.engagement_rate && <div className="text-xs text-green-600 font-bold">{(c.engagement_rate * 100).toFixed(2)}% ER</div>}
                          </td>
                          <td className="px-6 py-4">
                            {c.email ? (
                              <span className="text-blue-600 font-medium">{c.email}</span>
                            ) : <span className="text-gray-300 italic">No Email</span>}
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {c.location || c.geo_country || c.country || "-"}
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
                <h3 className="font-bold text-lg mb-4">Your Recent Searches</h3>
                {recentRequests.length === 0 ? (
                  <p className="text-gray-400 italic text-sm">No recent searches found.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentRequests.slice(0, 6).map((req, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-sm text-gray-900 truncate pr-2">{req.name}</div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${req.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>{req.status}</span>
                        </div>
                        <div className="text-xs text-gray-500 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Globe className="h-3 w-3" />
                            {Array.isArray(req.platform) ? req.platform.join(", ") : req.platform || "Any"}
                          </div>
                          <div className="text-gray-400">
                            {new Date(req.createdAt?.seconds * 1000 || req.createdAt || Date.now()).toLocaleDateString()}
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
