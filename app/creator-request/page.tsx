"use client";

import { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { getCurrentUser } from "@/lib/auth-helpers";
import { fetchUserAccount, fetchUserStats, fetchRecentRequests, createRequest } from "@/lib/api-client";
import type { UserAccount, UserStats } from "@/lib/database";
import { useSearchParams } from "next/navigation";
import SubscriptionGuard from "@/components/SubscriptionGuard";

interface RecentRequest {
  id: number;
  name: string;
  platform: string[];
  status: "pending" | "in_progress" | "delivered";
  dateSubmitted: string;
  resultsCount?: number;
}

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
  const searchParams = useSearchParams();
  const demoParam = searchParams.get("demo");

  const [userId, setUserId] = useState<string | null>(null);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<"Instagram" | "TikTok" | "YouTube" | null>(null);
  const [formData, setFormData] = useState({
    topics: "any", // Niche/topic
    location: "any",
    followersMin: "",
    followersMax: "",
    creatorType: "any",
    businessIntent: "any",
    batchSize: "50", // Default batch size
  });
  const [potentialMatches, setPotentialMatches] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [availableLocations, setAvailableLocations] = useState<Array<{ code: string, name: string }>>([]);
  const [availableTopics, setAvailableTopics] = useState<Array<{ id: string, name: string }>>([]);
  const [loadingClassifiers, setLoadingClassifiers] = useState(false);

  useEffect(() => {
    async function init() {
      if (demoParam === "true") {
        setIsDemo(true);
        // Mock data
        setRecentRequests([
          { id: 1, name: "Fashion Influencers", platform: ["Instagram"], status: "delivered", dateSubmitted: new Date().toISOString(), resultsCount: 45 },
          { id: 2, name: "Tech Reviewers", platform: ["YouTube"], status: "in_progress", dateSubmitted: new Date().toISOString(), resultsCount: 12 },
        ]);
        setLoading(false);
        return;
      }

      const user = await getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.uid);

      try {
        const [accountRes, statsRes, requestsRes] = await Promise.all([
          fetchUserAccount(),
          fetchUserStats(),
          fetchRecentRequests(),
        ]);

        if (accountRes.success) setUserAccount(accountRes.account);
        if (statsRes.success) setUserStats(statsRes.stats);
        if (requestsRes.success && requestsRes.requests) {
          setRecentRequests(requestsRes.requests.map((r: any) => ({
            id: r.id,
            name: r.name,
            platform: r.platform,
            status: r.status,
            dateSubmitted: r.createdAt ? new Date(r.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
            resultsCount: r.resultsCount
          })));
        }

      } catch (error) {
        console.error("Error loading creator request data:", error);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [demoParam]);

  // Fetch classifiers when platform changes
  useEffect(() => {
    async function fetchClassifiers() {
      if (!selectedPlatform || isDemo) return;

      setLoadingClassifiers(true);
      try {
        const platformParam = selectedPlatform.toLowerCase();
        const [locationsRes, topicsRes] = await Promise.all([
          fetch(`/api/classifiers/locations?platform=${platformParam}`).then(r => r.json()).catch(() => ({ locations: [] })),
          fetch(`/api/classifiers/topics?platform=${platformParam}`).then(r => r.json()).catch(() => ({ topics: [] })),
        ]);

        if (locationsRes && Array.isArray(locationsRes.locations) && locationsRes.locations.length > 0) {
          setAvailableLocations(locationsRes.locations);
        } else {
          // Fallback to common locations
          setAvailableLocations([
            { code: 'US', name: 'United States' },
            { code: 'GB', name: 'United Kingdom' },
            { code: 'CA', name: 'Canada' },
            { code: 'AU', name: 'Australia' },
            { code: 'DE', name: 'Germany' },
            { code: 'FR', name: 'France' },
          ]);
        }

        if (topicsRes && Array.isArray(topicsRes.topics) && topicsRes.topics.length > 0) {
          setAvailableTopics(topicsRes.topics);
        } else {
          // Fallback to common topics
          setAvailableTopics([
            { id: 'fashion', name: 'Fashion & Beauty' },
            { id: 'tech', name: 'Technology' },
            { id: 'gaming', name: 'Gaming' },
            { id: 'fitness', name: 'Fitness & Health' },
            { id: 'food', name: 'Food & Cooking' },
            { id: 'travel', name: 'Travel' },
            { id: 'business', name: 'Business & Finance' },
            { id: 'entertainment', name: 'Entertainment' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching classifiers:', error);
        // Set fallbacks on error
        setAvailableLocations([
          { code: 'US', name: 'United States' },
          { code: 'GB', name: 'United Kingdom' },
          { code: 'CA', name: 'Canada' },
        ]);
        setAvailableTopics([
          { id: 'fashion', name: 'Fashion & Beauty' },
          { id: 'tech', name: 'Technology' },
          { id: 'gaming', name: 'Gaming' },
        ]);
      } finally {
        setLoadingClassifiers(false);
      }
    }
    fetchClassifiers();
  }, [selectedPlatform, isDemo]);

  // Set default platform on mount
  useEffect(() => {
    if (!selectedPlatform && !isDemo) {
      setSelectedPlatform('YouTube');
    }
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform && formData.topics === "any") {
      toast.error("Please select a platform or niche");
      return;
    }

    setSubmitted(true);

    // Simulate API call
    if (isDemo) {
      setTimeout(() => {
        // Update local state to mimic new request
        const requestName = formData.topics !== "any" ? formData.topics : `${selectedPlatform} Creators`;
        setRecentRequests([{
          id: Date.now(),
          name: requestName,
          platform: selectedPlatform ? [selectedPlatform] : ["Any"],
          status: "in_progress",
          dateSubmitted: new Date().toISOString(),
          resultsCount: 0
        }, ...recentRequests]);

        toast.success("Request started! We'll notify you when it's ready.");
      }, 1500);
      return;
    }

    try {
      // Create request in database
      const requestName = formData.topics !== "any" ? formData.topics : `${selectedPlatform} Creators`;
      if (userId) {
        const requestResponse = await createRequest({
          name: requestName,
          platforms: selectedPlatform ? [selectedPlatform] : [],
          criteria: formData
        });

        if (requestResponse.success) {
          toast.success("Search started!");
          // Refresh requests
          const requestsRes = await fetchRecentRequests();
          if (requestsRes.success && requestsRes.requests) {
            setRecentRequests(requestsRes.requests.map((r: any) => ({
              id: r.id,
              name: r.name,
              platform: r.platform,
              status: r.status,
              dateSubmitted: r.createdAt ? new Date(r.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
              resultsCount: r.resultsCount
            })));
          }
        } else {
          toast.error("Failed to submit request.");
          setSubmitted(false);
        }
      }

    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("An error occurred.");
      setSubmitted(false);
    }
  };

  const handleReset = () => {
    setFormData({
      topics: "any",
      location: "any",
      followersMin: "",
      followersMax: "",
      creatorType: "any",
      businessIntent: "any",
      batchSize: "50",
    });
    setSelectedPlatform(null);
    setSubmitted(false);
  };

  return (
    <main className="min-h-screen bg-[#F3F1EB] pb-20 relative overflow-hidden">
      <Navbar />

      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-60">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] bg-gradient-to-br from-purple-100 via-pink-100 to-transparent blur-[100px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[50%] bg-gradient-to-bl from-blue-100 via-teal-50 to-transparent blur-[100px]" />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-40 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left Sidebar - Filter Controls */}
          <div className="lg:w-[350px] flex-shrink-0 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/60 sticky top-28">
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-6">Discovery Filters</h2>

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* 1. Platform */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Platform</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Instagram", "TikTok", "YouTube"].map((plat) => (
                      <button
                        key={plat}
                        type="button"
                        onClick={() => setSelectedPlatform(plat as any)}
                        className={`py-3 rounded-xl text-sm font-bold transition-all ${selectedPlatform === plat
                          ? "bg-black text-white shadow-md transform scale-105"
                          : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                          }`}
                      >
                        {plat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Creator Type */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Creator Type</label>
                  <select
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 text-gray-900"
                    value={formData.creatorType}
                    onChange={(e) => setFormData({ ...formData, creatorType: e.target.value })}
                  >
                    <option value="any">Any Type</option>
                    <option value="influencer">Influencer / Personality</option>
                    <option value="ugc">UGC Creator</option>
                    <option value="business">Business / Brand</option>
                    <option value="educator">Educator / Expert</option>
                  </select>
                </div>


                {/* 3. Niche / Topic */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Niche / Topic</label>
                  <select
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 text-gray-900 [&>option]:text-gray-900 [&>option]:bg-white"
                    value={formData.topics}
                    onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                  >
                    <option key="any-topic" value="any" className="text-gray-900">Any Topic</option>
                    {availableTopics.map((topic) => (
                      <option key={topic.id} value={topic.id} className="text-gray-900">
                        {topic.name}
                      </option>
                    ))}
                  </select>
                  {loadingClassifiers && selectedPlatform && (
                    <p className="text-xs text-gray-400 mt-1">Loading topics...</p>
                  )}
                </div>

                {/* 4. Location */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Location</label>
                  <select
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 text-gray-900 [&>option]:text-gray-900 [&>option]:bg-white"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  >
                    <option key="any-location" value="any" className="text-gray-900">Anywhere</option>
                    {availableLocations.map((loc) => (
                      <option key={loc.code} value={loc.code} className="text-gray-900">
                        {loc.name}
                      </option>
                    ))}
                  </select>
                  {loadingClassifiers && selectedPlatform && (
                    <p className="text-xs text-gray-400 mt-1">Loading locations...</p>
                  )}
                </div>

                {/* 5. Followers */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Min Followers</label>
                    <input
                      type="number"
                      placeholder="1k"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 text-gray-900 placeholder:text-gray-400"
                      value={formData.followersMin}
                      onChange={(e) => setFormData({ ...formData, followersMin: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Max Followers</label>
                    <input
                      type="number"
                      placeholder="Any"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 text-gray-900 placeholder:text-gray-400"
                      value={formData.followersMax}
                      onChange={(e) => setFormData({ ...formData, followersMax: e.target.value })}
                    />
                  </div>
                </div>

                {/* 6. Business Intent */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Business Intent</label>
                  <select
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 text-gray-900"
                    value={formData.businessIntent}
                    onChange={(e) => setFormData({ ...formData, businessIntent: e.target.value })}
                  >
                    <option value="any">Any Intent</option>
                    <option value="contact">Has Contact Email</option>
                    <option value="collab">Open to Collabs</option>
                  </select>
                </div>

                {/* 7. Batch Size */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide">Batch Size</label>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      Max: {userAccount ? Math.max(0, userAccount.email_quota_daily - userAccount.email_used_today) : 50}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={userAccount ? Math.max(0, userAccount.email_quota_daily - userAccount.email_used_today) : 500}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 text-gray-900"
                    value={formData.batchSize}
                    onChange={(e) => {
                      const max = userAccount ? Math.max(0, userAccount.email_quota_daily - userAccount.email_used_today) : 500;
                      const val = parseInt(e.target.value) || 0;
                      setFormData({ ...formData, batchSize: Math.min(val, max).toString() });
                    }}
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5 font-medium italic">
                    How many creators do you want to find in this search?
                  </p>
                </div>




                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={submitted || (userAccount !== null && (userAccount.email_quota_daily - userAccount.email_used_today) <= 0)}
                    className={`flex-1 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-900 transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2 ${(submitted || (userAccount !== null && (userAccount.email_quota_daily - userAccount.email_used_today) <= 0)) ? "opacity-75 cursor-not-allowed" : ""}`}
                  >
                    {submitted ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Searching...
                      </>
                    ) : (userAccount !== null && (userAccount.email_quota_daily - userAccount.email_used_today) <= 0) ? "Quota Reached" : "Find Creators"}
                  </button>
                </div>

              </form>
            </div>
          </div>

          {/* Main Content - Results Preview / Active Search */}
          <div className="flex-1">
            {submitted ? (
              <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100/60 text-center min-h-[500px] flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 border-4 border-blue-100 rounded-full animate-ping opacity-20"></div>
                  <svg className="w-10 h-10 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black text-[#1A1A1A] mb-3">AI Agent is Searching...</h2>
                <p className="text-gray-500 max-w-md mx-auto mb-8">
                  We are scanning {selectedPlatform ? selectedPlatform : "social"} profiles matching your criteria. This deeply targeted search can take a few minutes. We'll verify emails and engagement rates.
                </p>

                <div className="max-w-sm w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                  <div className="h-full bg-blue-600 animate-[prog_2s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
                </div>
                <style jsx>{`
                        @keyframes prog {
                            0% { transform: translateX(-100%); }
                            100% { transform: translateX(100%); }
                        }
                     `}</style>
                <p className="text-xs text-gray-400 mt-2">Analyzing profiles...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Placeholder / Value Prop when no search active */}
                {/* Placeholder / Value Prop - Shown only in Demo */}
                {isDemo && (
                  <div className="bg-gradient-to-br from-purple-700 to-indigo-900 rounded-3xl p-10 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold mb-4 border border-white/10">AI-POWERED SEARCH</span>
                      <h1 className="text-4xl font-black mb-4 tracking-tight">Find Your Perfect Creators</h1>
                      <p className="text-white/80 text-lg max-w-xl mb-8 leading-relaxed">
                        Don&apos;t waste hours scrolling. Our AI scans millions of profiles to find creators with high engagement, authentic audiences, and contactable emails match your brand.
                      </p>

                      <div className="grid grid-cols-3 gap-6 max-w-2xl">
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/5">
                          <div className="text-2xl mb-1">🎯</div>
                          <div className="font-bold">Niche Targeting</div>
                          <div className="text-xs text-white/60">Precise topic matching</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/5">
                          <div className="text-2xl mb-1">📧</div>
                          <div className="font-bold">Verified Emails</div>
                          <div className="text-xs text-white/60">Direct contact info</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/5">
                          <div className="text-2xl mb-1">📊</div>
                          <div className="font-bold">Analyze ROI</div>
                          <div className="text-xs text-white/60">Predict performance</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}


                {/* Mock Results Preview (if filters selected but not submitted) - Only for Demo */}
                {isDemo && potentialMatches !== null && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Live Preview <span className="text-gray-400 font-normal ml-2">(Mock Data)</span></h3>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                        {potentialMatches.toLocaleString()} Potential Matches
                      </span>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                          <tr>
                            <th className="px-6 py-4">Creator</th>
                            <th className="px-6 py-4">Niche</th>
                            <th className="px-6 py-4">Followers</th>
                            <th className="px-6 py-4">Engagement</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {[
                            { name: "Sarah Jenkins", handle: "@sarah.social", niche: "Lifestyle", followers: "45K", engagement: "4.2%" },
                            { name: "Tech Daily", handle: "@techdaily", niche: "Technology", followers: "120K", engagement: "2.1%" },
                            { name: "Eco Living", handle: "@ecoliving_us", niche: "Sustainability", followers: "85K", engagement: "3.8%" },
                            { name: "Foodie Finds", handle: "@sf_foodie", niche: "Food & Drink", followers: "22K", engagement: "5.5%" },
                          ].map((mock, i) => (
                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300"></div>
                                  <div>
                                    <div className="font-bold text-gray-900">{mock.name}</div>
                                    <div className="text-gray-400 text-xs">{mock.handle}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                  {mock.niche}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-mono text-gray-600">{mock.followers}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5 text-green-600 font-medium">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2 1 1 0 010 2zm1 2a1 1 0 10-2 0v7a1 1 0 102 0V9zm-1 8a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>
                                  {mock.engagement}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-500">
                        + {potentialMatches > 4 ? potentialMatches - 4 : 0} more potential matches found
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Right Column (Sidebar) - Requests History & Quota */}
          <div className="lg:w-[300px] flex-shrink-0 space-y-6">
            {/* Email Quota / Credits */}
            <div className="bg-black text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-1">Search Credits</h3>
                <p className="text-gray-400 text-sm mb-4">Searches remaining today</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">
                    {userAccount ? Math.max(0, userAccount.email_quota_daily - userAccount.email_used_today) : "-"}
                  </span>
                  <span className="text-gray-500">
                    / {userAccount ? userAccount.email_quota_daily : "-"}
                  </span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-white h-full transition-all duration-500"
                    style={{
                      width: userAccount && userAccount.email_quota_daily > 0
                        ? `${Math.max(0, Math.min(100, ((userAccount.email_quota_daily - userAccount.email_used_today) / userAccount.email_quota_daily) * 100))}%`
                        : "0%"
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Recent Requests */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/60">
              <h3 className="font-bold text-[#1A1A1A] mb-4">Recent Searches</h3>
              <div className="space-y-3">
                {recentRequests.length > 0 ? (
                  recentRequests.map(req => (
                    <div key={req.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-bold text-sm text-gray-900 line-clamp-1">{req.name}</div>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${req.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {req.status === 'delivered' ? 'Ready' : 'Running'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {Array.isArray(req.platform) ? req.platform.join(", ") : "Any"} • {new Date(req.dateSubmitted).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic">No recent searches.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
