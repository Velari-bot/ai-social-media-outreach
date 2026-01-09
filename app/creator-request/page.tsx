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
    creatorInput: "",
    emailAvailable: false,
    hideSaved: false,
    location: "any",
    gender: "any",
    ageMin: "any",
    ageMax: "any",
    language: "any",
    followersMin: "",
    followersMax: "",
    engagementRate: "",
    viewsMin: "",
    viewsMax: "",
    topics: "any",
    hashtags: "",
    mentions: "",
    captions: "",
    collaborations: "",
    bio: "",
    lastPosted: "any",
    categories: "any",
    followersGrowthMin: "",
    followersGrowthMax: "",
    hasSponsoredPosts: false,
    accountType: "any",
    fakeFollowers: false,
    verifiedOnly: false,
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
      formData.creatorInput ||
      formData.hashtags ||
      formData.categories !== "any" ||
      formData.location !== "any";

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
        const newRequest = {
          id: Date.now(),
          name: formData.creatorInput || `${selectedPlatform} Creators`,
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
      const requestName = formData.creatorInput || `${selectedPlatform} Creators`;
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
      creatorInput: "",
      emailAvailable: false,
      hideSaved: false,
      location: "any",
      gender: "any",
      ageMin: "any",
      ageMax: "any",
      language: "any",
      followersMin: "",
      followersMax: "",
      engagementRate: "",
      viewsMin: "",
      viewsMax: "",
      topics: "any",
      hashtags: "",
      mentions: "",
      captions: "",
      collaborations: "",
      bio: "",
      lastPosted: "any",
      categories: "any",
      followersGrowthMin: "",
      followersGrowthMax: "",
      hasSponsoredPosts: false,
      accountType: "any",
      fakeFollowers: false,
      verifiedOnly: false,
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

            {/* Search Bar */}
            <div>
              <input
                type="text"
                placeholder="ex. lifestyle influencer posting fashion and beauty content"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
              />
            </div>

            {/* @creator or email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">@creator or email</label>
              <input
                type="text"
                name="creatorInput"
                value={formData.creatorInput}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
              />
            </div>

            {/* Email Available Toggle */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Email Available</label>
              <select
                name="emailAvailable"
                value={formData.emailAvailable ? "yes" : "no"}
                onChange={(e) => setFormData((prev) => ({ ...prev, emailAvailable: e.target.value === "yes" }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            {/* Hide Saved Profiles Toggle */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Hide Saved Profiles</label>
              <select
                name="hideSaved"
                value={formData.hideSaved ? "yes" : "no"}
                onChange={(e) => setFormData((prev) => ({ ...prev, hideSaved: e.target.value === "yes" }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
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
                <option value="europe">Europe</option>
                <option value="asia">Asia</option>
                <option value="australia">Australia</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
              >
                <option value="any">Any</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary / Other</option>
              </select>
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Age</label>
              <div className="flex gap-2">
                <select
                  name="ageMin"
                  value={formData.ageMin}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
                >
                  <option value="any">Any</option>
                  <option value="13-17">13-17</option>
                  <option value="18-24">18-24</option>
                  <option value="25-34">25-34</option>
                  <option value="35-44">35-44</option>
                  <option value="45-54">45-54</option>
                  <option value="55+">55+</option>
                </select>
                <select
                  name="ageMax"
                  value={formData.ageMax}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
                >
                  <option value="any">Any</option>
                  <option value="13-17">13-17</option>
                  <option value="18-24">18-24</option>
                  <option value="25-34">25-34</option>
                  <option value="35-44">35-44</option>
                  <option value="45-54">45-54</option>
                  <option value="55+">55+</option>
                </select>
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Language</label>
              <select
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
              >
                <option value="any">Any</option>
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
                <option value="portuguese">Portuguese</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Followers */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Followers</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="followersMin"
                  value={formData.followersMin}
                  onChange={handleInputChange}
                  placeholder="-"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
                />
                <input
                  type="number"
                  name="followersMax"
                  value={formData.followersMax}
                  onChange={handleInputChange}
                  placeholder="-"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
                />
              </div>
            </div>

            {/* Engagement rate */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Engagement Rate</label>
              <select
                name="engagementRate"
                value={formData.engagementRate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
              >
                <option value="">Any</option>
                <option value="≥1%">≥1%</option>
                <option value="≥3%">≥3%</option>
                <option value="≥5%">≥5%</option>
                <option value="≥10%">≥10%</option>
              </select>
            </div>

            {/* Views */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Views</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="viewsMin"
                  value={formData.viewsMin}
                  onChange={handleInputChange}
                  placeholder="-"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
                />
                <input
                  type="number"
                  name="viewsMax"
                  value={formData.viewsMax}
                  onChange={handleInputChange}
                  placeholder="-"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
                />
              </div>
            </div>

            {/* Topics */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Topics</label>
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
                <option value="other">Other</option>
              </select>
            </div>

            {/* Hashtags */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Hashtags</label>
              <input
                type="text"
                name="hashtags"
                value={formData.hashtags}
                onChange={handleInputChange}
                placeholder="#hashtag1 #hashtag2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
              />
            </div>

            {/* Mentions */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Mentions</label>
              <input
                type="text"
                name="mentions"
                value={formData.mentions}
                onChange={handleInputChange}
                placeholder="@username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
              />
            </div>

            {/* Captions */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Captions</label>
              <input
                type="text"
                name="captions"
                value={formData.captions}
                onChange={handleInputChange}
                placeholder="keyword in captions"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
              />
            </div>

            {/* Collaborations */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Collaborations</label>
              <input
                type="text"
                name="collaborations"
                value={formData.collaborations}
                onChange={handleInputChange}
                placeholder="brand name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Bio</label>
              <input
                type="text"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="keywords in bio"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
              />
            </div>

            {/* Last posted */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Last Posted</label>
              <select
                name="lastPosted"
                value={formData.lastPosted}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
              >
                <option value="any">Any</option>
                <option value="1">1 day ago</option>
                <option value="3">3 days ago</option>
                <option value="7">7 days ago</option>
                <option value="14">14 days ago</option>
                <option value="30">30 days ago</option>
              </select>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Categories</label>
              <select
                name="categories"
                value={formData.categories}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
              >
                <option value="any">Any</option>
                <option value="influencer">Influencer</option>
                <option value="creator">Creator</option>
                <option value="brand">Brand</option>
                <option value="business">Business</option>
              </select>
            </div>

            {/* Followers growth */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Followers Growth</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="followersGrowthMin"
                  value={formData.followersGrowthMin}
                  onChange={handleInputChange}
                  placeholder="-"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
                />
                <input
                  type="number"
                  name="followersGrowthMax"
                  value={formData.followersGrowthMax}
                  onChange={handleInputChange}
                  placeholder="-"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
                />
              </div>
            </div>

            {/* Has Sponsored Posts Toggle */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Has Sponsored Posts</label>
              <select
                name="hasSponsoredPosts"
                value={formData.hasSponsoredPosts ? "yes" : "no"}
                onChange={(e) => setFormData((prev) => ({ ...prev, hasSponsoredPosts: e.target.value === "yes" }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Account Type</label>
              <select
                name="accountType"
                value={formData.accountType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
              >
                <option value="any">Any</option>
                <option value="personal">Personal</option>
                <option value="business">Business / Brand</option>
              </select>
            </div>

            {/* Fake Followers Toggle */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Fake Followers</label>
              <select
                name="fakeFollowers"
                value={formData.fakeFollowers ? "yes" : "no"}
                onChange={(e) => setFormData((prev) => ({ ...prev, fakeFollowers: e.target.value === "yes" }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900 text-sm"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            {/* Show only verified creators */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="verifiedOnly"
                name="verifiedOnly"
                checked={formData.verifiedOnly}
                onChange={handleInputChange}
                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-2 focus:ring-black"
              />
              <label htmlFor="verifiedOnly" className="text-sm text-gray-700">Show only verified creators</label>
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

            {/* Results will go here - placeholder for now */}
            <div className="text-center py-20 text-gray-500">
              <p>Select filters and platform to see creator results</p>
            </div>
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
