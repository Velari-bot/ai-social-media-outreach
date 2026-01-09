"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { getCurrentUser } from "@/lib/auth-helpers";
import { fetchUserAccount, fetchUserStats, fetchRecentRequests, createRequest, incrementQuota } from "@/lib/api-client";
import type { UserAccount, CreatorRequest, UserStats } from "@/lib/database";

interface RecentRequest {
  id: number;
  name: string;
  platform: string[];
  status: "pending" | "in_progress" | "delivered";
  dateSubmitted: string;
  resultsCount?: number;
}

export default function CreatorRequestPage({ searchParams }: { searchParams: { demo?: string } }) {
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
  });

  const [submitted, setSubmitted] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processingStep, setProcessingStep] = useState<"searching" | "enriching" | "preparing" | "complete">("searching");
  const [dailyQuota, setDailyQuota] = useState({ used: 0, limit: 100 });
  const [potentialMatches, setPotentialMatches] = useState<number | null>(null);

  // Calculate potential matches based on filters
  useEffect(() => {
    // If no platform and no major filters, show nothing
    const hasActiveFilters = selectedPlatform ||
      formData.topics !== "any" ||
      formData.location !== "any" ||
      formData.creatorType !== "any" ||
      formData.businessIntent !== "any" ||
      formData.followersMin ||
      formData.followersMax;

    if (!hasActiveFilters) {
      setPotentialMatches(null);
      return;
    }

    // Generate a deterministic "random" number based on filters for demo purposes
    // In a real app, this would be a backend count query
    const seed = JSON.stringify(formData).length + (selectedPlatform?.length || 0);
    // Base count ranges from 1k to 100k
    const maxCount = 100000;
    const minCount = 1000;

    // Simple pseudo-random generator based on seed
    const pseudoRandom = Math.sin(seed) * 10000;
    const count = Math.floor(Math.abs(pseudoRandom % (maxCount - minCount)) + minCount);

    setPotentialMatches(count);
  }, [formData, selectedPlatform]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  useEffect(() => {
    async function loadUserData() {
      // Check for demo mode from search params
      const demoMode = searchParams?.demo === "true";
      setIsDemo(demoMode);

      if (demoMode) {
        // Set mock data for demo
        // Set mock data for Demo
        setUserId("demo-user");
        setUserAccount({
          id: "demo",
          email: "demo@example.com",
          name: "Demo User",
          plan: "pro",
          email_quota_daily: 100,
          email_used_today: 25,
          created_at: new Date().toISOString(),
        } as any);
        setUserStats({
          id: "demo",
          requests_this_week: 12,
          emails_sent_this_week: 124,
          creators_contacted: 850,
          average_reply_rate: 24.8,
          created_at: new Date().toISOString(),
        } as any);
        setDailyQuota({ used: 25, limit: 100 });
        setRecentRequests([
          {
            id: 1,
            name: "Demo Campaign - All Platforms",
            platform: ["YouTube", "Twitch", "TikTok", "Instagram"],
            status: "delivered",
            dateSubmitted: new Date().toISOString().split('T')[0],
            resultsCount: 25
          },
          {
            id: 2,
            name: "Tech Reviewers",
            platform: ["YouTube"],
            status: "delivered",
            dateSubmitted: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            resultsCount: 12
          },
          {
            id: 3,
            name: "Gaming Streamers",
            platform: ["Twitch"],
            status: "delivered",
            dateSubmitted: new Date(Date.now() - 172800000).toISOString().split('T')[0],
            resultsCount: 8
          },
          {
            id: 4,
            name: "Lifestyle Influencers",
            platform: ["Instagram", "TikTok"],
            status: "delivered",
            dateSubmitted: new Date(Date.now() - 259200000).toISOString().split('T')[0],
            resultsCount: 5
          }
        ]);
        setLoading(false);
        return;
      }

      try {
        // Get current user
        const user = getCurrentUser();
        if (!user) {
          toast.error("Please log in to continue");
          window.location.href = "/login";
          return;
        }

        setUserId(user.uid);

        // Fetch user account data
        try {
          const accountResponse = await fetchUserAccount();
          if (accountResponse.success && accountResponse.account) {
            setUserAccount(accountResponse.account);
            setDailyQuota({
              used: accountResponse.account.email_used_today,
              limit: accountResponse.account.email_quota_daily,
            });
          } else {
            // Create default account if doesn't exist
            const { createUserAccount } = await import('@/lib/api-client');
            const createResponse = await createUserAccount({
              email: user.email || '',
              name: user.displayName || '',
            });
            if (createResponse.success && createResponse.account) {
              setUserAccount(createResponse.account);
              setDailyQuota({
                used: createResponse.account.email_used_today,
                limit: createResponse.account.email_quota_daily,
              });
            }
          }
        } catch (error) {
          console.error('Error fetching account:', error);
        }

        // Fetch user stats
        try {
          const statsResponse = await fetchUserStats();
          if (statsResponse.success && statsResponse.stats) {
            setUserStats(statsResponse.stats);
          }
        } catch (error) {
          console.error('Error fetching stats:', error);
        }

        // Fetch recent requests
        try {
          const requestsResponse = await fetchRecentRequests(10);
          if (requestsResponse.success && requestsResponse.requests) {
            const requests = requestsResponse.requests;
            const formattedRequests: RecentRequest[] = requests.map(req => ({
              id: typeof req.id === 'string' ? parseInt(req.id) || 0 : req.id,
              name: req.name,
              platform: req.platforms,
              status: req.status as "pending" | "in_progress" | "delivered",
              dateSubmitted: typeof req.date_submitted === 'string' ? req.date_submitted.split("T")[0] : new Date(req.date_submitted).toISOString().split("T")[0],
              resultsCount: req.results_count,
            }));
            setRecentRequests(formattedRequests);
          }
        } catch (error) {
          console.error('Error fetching requests:', error);
        }
      } catch (error: any) {
        console.error("Error loading user data:", error);
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [searchParams]);

  const quickStats = userStats ? {
    requestsThisWeek: userStats.requests_this_week,
    emailsSentThisWeek: userStats.emails_sent_this_week,
    creatorsContacted: userStats.creators_contacted,
    averageReplyRate: userStats.average_reply_rate,
  } : {
    requestsThisWeek: 0,
    emailsSentThisWeek: 0,
    creatorsContacted: 0,
    averageReplyRate: 0,
  };

  const quotaPercentage = (dailyQuota.used / dailyQuota.limit) * 100;
  const quotaWarning = quotaPercentage >= 90;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleMultiSelect = (field: string, value: string) => {
    setFormData((prev) => {
      const fieldValue = prev[field as keyof typeof prev];
      const current: string[] = Array.isArray(fieldValue) ? (fieldValue as string[]) : [];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform) {
      toast.error("Please select at least one platform");
      return;
    }

    // In demo mode, skip auth check
    if (!userId && !isDemo) {
      toast.error("Please log in to submit requests");
      return;
    }

    setSubmitted(true);
    setShowProcessingModal(true);
    setProcessingStep("searching");

    // Simulate processing steps with animations
    setTimeout(() => {
      setProcessingStep("enriching");
    }, 1500);

    setTimeout(() => {
      setProcessingStep("preparing");
    }, 3000);

    // If demo mode, just simulate success after time
    if (isDemo) {
      setTimeout(() => {
        // Update local state to mimic new request
        const requestName = formData.topics !== "any" ? formData.topics : `${selectedPlatform} Creators`;
        const newRequest = {
          id: Date.now(),
          name: requestName,
          platform: [selectedPlatform],
          status: "processing" as any, // Visual temporary status
          dateSubmitted: new Date().toISOString().split('T')[0],
          resultsCount: 0
        };

        // Increment demo quota
        setDailyQuota(prev => ({ ...prev, used: prev.used + 1 }));

        setProcessingStep("complete");
        setTimeout(() => {
          setShowProcessingModal(false);
          toast.success("Request submitted! Our AI is finding creators for you.");
          // Reset form
          handleReset();
        }, 1000);
      }, 4500);

      setTimeout(() => {
        setSubmitted(false);
      }, 6000);
      return;
    }

    try {
      // Create request in database
      const requestName = formData.topics !== "any" ? formData.topics : `${selectedPlatform} Creators`;
      const requestResponse = await createRequest({
        name: requestName,
        platforms: [selectedPlatform],
        criteria: formData,
      });

      if (requestResponse.success && requestResponse.request) {
        // Update quota
        try {
          await incrementQuota();
          if (userAccount) {
            const newUsed = userAccount.email_used_today + 1;
            setDailyQuota({ used: newUsed, limit: userAccount.email_quota_daily });
            setUserAccount({ ...userAccount, email_used_today: newUsed });
          }
        } catch (error) {
          console.error('Error incrementing quota:', error);
        }

        // Refresh recent requests
        try {
          const requestsResponse = await fetchRecentRequests(10);
          if (requestsResponse.success && requestsResponse.requests) {
            const requests = requestsResponse.requests;
            const formattedRequests: RecentRequest[] = requests.map(req => ({
              id: typeof req.id === 'string' ? parseInt(req.id) || 0 : req.id,
              name: req.name,
              platform: req.platforms,
              status: req.status as "pending" | "in_progress" | "delivered",
              dateSubmitted: typeof req.date_submitted === 'string' ? req.date_submitted.split("T")[0] : new Date(req.date_submitted).toISOString().split("T")[0],
              resultsCount: req.results_count,
            }));
            setRecentRequests(formattedRequests);
          }
        } catch (error) {
          console.error('Error refreshing requests:', error);
        }

        // Complete processing after all steps
        setTimeout(() => {
          setProcessingStep("complete");
          setTimeout(() => {
            setShowProcessingModal(false);
            toast.success("Request submitted! Our AI is finding creators for you.");
          }, 1000);
        }, 4500);
      } else {
        setShowProcessingModal(false);
        toast.error("Failed to submit request");
      }
    } catch (error: any) {
      setShowProcessingModal(false);
      toast.error(error.message || "Failed to submit request");
    } finally {
      setTimeout(() => {
        setSubmitted(false);
      }, 6000);
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
    });
    setSelectedPlatform(null);
    setSubmitted(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "in_progress":
        return "In Progress";
      case "delivered":
        return "Delivered";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <div className="flex h-[calc(100vh-5rem)] pt-32 px-8 gap-6 max-w-[1800px] mx-auto items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      <div className="flex h-[calc(100vh-5rem)] pt-32 px-8 gap-6 max-w-[1800px] mx-auto">
        {/* Left Sidebar - Filters */}
        <div className="w-80 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-y-auto scrollbar-hide">
          <div className="p-6 space-y-6">
            {/* Platform Toggle */}
            <div>
              <div className="flex gap-1.5 mb-4 bg-gray-100 p-1 rounded-lg border-2 border-gray-300">
                <button
                  onClick={() => setSelectedPlatform(selectedPlatform === "Instagram" ? null : "Instagram")}
                  className={`flex-1 px-3 py-2.5 rounded-md font-medium text-xs transition-all whitespace-nowrap ${selectedPlatform === "Instagram"
                    ? "bg-white text-gray-900 shadow-md border border-gray-200"
                    : "bg-transparent text-gray-600 hover:text-gray-900"
                    }`}
                >
                  Instagram
                </button>
                <button
                  onClick={() => setSelectedPlatform(selectedPlatform === "TikTok" ? null : "TikTok")}
                  className={`flex-1 px-3 py-2.5 rounded-md font-medium text-xs transition-all whitespace-nowrap ${selectedPlatform === "TikTok"
                    ? "bg-white text-gray-900 shadow-md border border-gray-200"
                    : "bg-transparent text-gray-600 hover:text-gray-900"
                    }`}
                >
                  TikTok
                </button>
                <button
                  onClick={() => setSelectedPlatform(selectedPlatform === "YouTube" ? null : "YouTube")}
                  className={`flex-1 px-3 py-2.5 rounded-md font-medium text-xs transition-all whitespace-nowrap ${selectedPlatform === "YouTube"
                    ? "bg-white text-gray-900 shadow-md border border-gray-200"
                    : "bg-transparent text-gray-600 hover:text-gray-900"
                    }`}
                >
                  YouTube
                </button>
              </div>
            </div>

            {/* Creator Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Creator Type</label>
              <select
                name="creatorType"
                value={formData.creatorType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
              >
                <option value="any">Any</option>
                <option value="influencer">Influencer</option>
                <option value="ugc_creator">UGC Creator</option>
                <option value="affiliate">Affiliate Marketer</option>
                <option value="brand_ambassador">Brand Ambassador</option>
                <option value="nano_influencer">Nano Influencer (1k-10k)</option>
                <option value="micro_influencer">Micro Influencer (10k-50k)</option>
              </select>
            </div>

            {/* Niche / Topic */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Niche / Topic</label>
              <select
                name="topics"
                value={formData.topics}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
              >
                <option value="any">Any</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="gaming">Gaming</option>
                <option value="fashion-beauty">Fashion & Beauty</option>
                <option value="fitness-health">Fitness & Health</option>
                <option value="food-cooking">Food & Cooking</option>
                <option value="travel">Travel</option>
                <option value="technology">Technology</option>
                <option value="music">Music</option>
                <option value="business-finance">Business & Finance</option>
                <option value="parenting">Parenting</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Location</label>
              <select
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
              >
                <option value="any">Any</option>
                <option value="usa">United States</option>
                <option value="canada">Canada</option>
                <option value="uk">United Kingdom</option>
                <option value="europe">Europe</option>
                <option value="asia">Asia</option>
                <option value="australia">Australia</option>
              </select>
            </div>

            {/* Followers */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Follower Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="followersMin"
                  value={formData.followersMin}
                  onChange={handleInputChange}
                  placeholder="Min"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
                />
                <input
                  type="number"
                  name="followersMax"
                  value={formData.followersMax}
                  onChange={handleInputChange}
                  placeholder="Max"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
                />
              </div>
            </div>

            {/* Business Intent */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Business Intent</label>
              <select
                name="businessIntent"
                value={formData.businessIntent}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
              >
                <option value="any">Any</option>
                <option value="sponsored_posts">Has done Sponsored Posts</option>
                <option value="affiliate_links">Uses Affiliate Links</option>
                <option value="email_in_bio">Email in Bio</option>
                <option value="open_to_collabs">Open to Collabs</option>
                <option value="agency_managed">Agency Managed</option>
              </select>
            </div>

            {/* Submit and Reset Buttons */}
            <div className="pt-4 space-y-3 border-t border-gray-200">
              {submitted && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 text-sm font-medium">
                    ✓ Request submitted! Our AI is finding creators for you.
                  </p>
                  <p className="text-green-600 text-xs mt-1">Estimated delivery: 5-10 minutes</p>
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={submitted || !selectedPlatform}
                className="w-full px-4 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Submit Request
              </button>
              <button
                onClick={handleReset}
                className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area - Results */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-y-auto scrollbar-hide">
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {potentialMatches !== null ? `${formatNumber(potentialMatches)} profiles` : '0 profiles'}
              </h2>
              {potentialMatches !== null && (
                <button className="px-4 py-2 bg-black text-white rounded-lg font-medium text-sm hover:bg-gray-900 transition-colors">
                  + Bulk save
                </button>
              )}
            </div>

            {/* Results */}
            {potentialMatches !== null ? (
              <div className="space-y-4">
                {/* Mock Profiles for Demo */}
                {[
                  {
                    id: 1,
                    name: "Alex “FrostByte” Chen",
                    handle: "@FrostBytePlays",
                    platform: "YouTube",
                    followers: "248K",
                    engagement: "4.8%",
                    bio: "Tech reviews, gaming setups, and mechanical keyboards. 🎮 ⌨️",
                    imgColor: "bg-blue-600"
                  },
                  {
                    id: 2,
                    name: "Sarah Jenkins",
                    handle: "@sarah.content",
                    platform: "Instagram",
                    followers: "125K",
                    engagement: "3.2%",
                    bio: "Sustainable living & lifestyle content creator based in NYC. 🌿",
                    imgColor: "bg-pink-600"
                  },
                  {
                    id: 3,
                    name: "Nina Patel",
                    handle: "@NOVA_Geek",
                    platform: "Twitch",
                    followers: "312K",
                    engagement: "9.2%",
                    bio: "Live streaming coding sessions and indie game dev. 💻",
                    imgColor: "bg-purple-600"
                  },
                  {
                    id: 4,
                    name: "Marcus Lee",
                    handle: "@PwnWizard",
                    platform: "TikTok",
                    followers: "186K",
                    engagement: "13.5%",
                    bio: "Quick tech tips and gadget hacks. 📱",
                    imgColor: "bg-black"
                  }
                ].filter(profile => {
                  // Filter by Platform if selected
                  if (selectedPlatform && profile.platform !== selectedPlatform) return false;

                  // Filter by Topic (Simple match for demo)
                  if (formData.topics !== 'any') {
                    const topic = formData.topics;
                    const bio = profile.bio.toLowerCase();
                    if (topic === 'gaming' && !bio.includes('game') && !bio.includes('gaming')) return false;
                    if (topic === 'technology' && !bio.includes('tech')) return false;
                    if (topic === 'lifestyle' && !bio.includes('lifestyle')) return false;
                    // Add more mappings if needed, or default to true to show something
                  }

                  return true;
                }).map((profile) => (
                  <div key={profile.id} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white group">
                    <div className={`w-12 h-12 rounded-full ${profile.imgColor} flex items-center justify-center text-white font-bold text-lg`}>
                      {profile.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <h3 className="font-bold text-gray-900">{profile.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{profile.handle}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${profile.platform === 'YouTube' ? 'bg-red-500' :
                                profile.platform === 'Twitch' ? 'bg-purple-500' :
                                  profile.platform === 'TikTok' ? 'bg-black' : 'bg-pink-500'
                                }`}></span>
                              {profile.platform}
                            </span>
                          </div>
                        </div>
                        <button className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          Analyze Profile
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{profile.bio}</p>
                      <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                          {profile.followers} Followers
                        </div>
                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                          {profile.engagement} Engagement
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {potentialMatches > 4 && (
                  <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm text-gray-500">
                    + {formatNumber(potentialMatches - 4)} more profiles match your criteria
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Start your search</h3>
                <p>Select filters or type keywords to find creators</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Email Quota & Recent Requests */}
        <div className="w-80 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-y-auto scrollbar-hide">
          <div className="p-6 space-y-6">
            {/* Daily Email Quota */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Daily Email Quota</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-gray-900">
                  {dailyQuota.used} / {dailyQuota.limit}
                </span>
                <span className="text-xs text-gray-500">emails sent</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div
                  className={`h-2.5 rounded-full transition-all ${quotaPercentage >= 90
                    ? "bg-red-500"
                    : quotaPercentage >= 70
                      ? "bg-yellow-500"
                      : "bg-green-500"
                    }`}
                  style={{ width: `${quotaPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {dailyQuota.limit - dailyQuota.used} remaining today
              </p>
            </div>

            {/* Alert Notification */}
            {quotaWarning && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs text-yellow-800">
                    You've reached {Math.round(quotaPercentage)}% of your daily email quota
                  </p>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Requests This Week</p>
                  <p className="text-lg font-bold text-gray-900">{quickStats.requestsThisWeek}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Emails Sent</p>
                  <p className="text-lg font-bold text-gray-900">{quickStats.emailsSentThisWeek}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Creators Contacted</p>
                  <p className="text-lg font-bold text-gray-900">{quickStats.creatorsContacted}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Reply Rate</p>
                  <p className="text-lg font-bold text-gray-900">{quickStats.averageReplyRate}%</p>
                </div>
              </div>
            </div>

            {/* Recent Requests */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Requests</h3>
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">{request.name}</h4>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {request.platform.map((p) => (
                            <span
                              key={p}
                              className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{request.dateSubmitted}</p>
                        {request.status === "delivered" && request.resultsCount && (
                          <p className="text-xs text-gray-600 font-medium">
                            {request.resultsCount} creators found
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {getStatusLabel(request.status)}
                      </span>
                    </div>
                    {request.status === "delivered" && (
                      <button
                        className="w-full mt-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors bg-black text-white hover:bg-gray-900"
                      >
                        View Results
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Modal */}
      {showProcessingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[#FF6B9C] border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#FF6B9C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Finding creators…</h2>
            </div>

            {/* Step Indicators */}
            <div className="space-y-4 mb-8">
              <div className={`flex items-center gap-3 transition-all duration-500 ${processingStep === "searching" ? "opacity-100" : "opacity-60"
                }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${processingStep === "searching"
                  ? "bg-[#FF6B9C] text-white scale-110"
                  : processingStep !== "complete"
                    ? "bg-gray-200 text-gray-400"
                    : "bg-green-500 text-white"
                  }`}>
                  {processingStep !== "searching" && processingStep !== "complete" ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : processingStep === "complete" ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </div>
                <span className="text-gray-900 font-medium">Searching creators</span>
              </div>

              <div className={`flex items-center gap-3 transition-all duration-500 ${processingStep === "enriching" ? "opacity-100" : processingStep === "preparing" || processingStep === "complete" ? "opacity-60" : "opacity-40"
                }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${processingStep === "enriching"
                  ? "bg-[#FF6B9C] text-white scale-110"
                  : processingStep === "searching"
                    ? "bg-gray-100 text-gray-300"
                    : processingStep !== "complete"
                      ? "bg-gray-200 text-gray-400"
                      : "bg-green-500 text-white"
                  }`}>
                  {processingStep === "searching" ? null : processingStep !== "enriching" && processingStep !== "complete" ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : processingStep === "complete" ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </div>
                <span className="text-gray-900 font-medium">Enriching emails</span>
              </div>

              <div className={`flex items-center gap-3 transition-all duration-500 ${processingStep === "preparing" ? "opacity-100" : processingStep === "complete" ? "opacity-60" : "opacity-40"
                }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${processingStep === "preparing"
                  ? "bg-[#FF6B9C] text-white scale-110"
                  : processingStep === "complete"
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-300"
                  }`}>
                  {processingStep !== "preparing" && processingStep !== "complete" ? null : processingStep === "complete" ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </div>
                <span className="text-gray-900 font-medium">Preparing outreach</span>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">Estimated time:</span>
                <br />
                Results ready in ~15–30 minutes
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
