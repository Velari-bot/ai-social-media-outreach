"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { fetchUserAccount, fetchUserStats, fetchRecentRequests, getGmailStatus, fetchRecentThreads, updateUserAccount } from "@/lib/api-client";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import DemoDashboard from "@/components/demo/DemoDashboard";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import { Eye, X, ExternalLink, Youtube, Instagram, Music, Globe, Mail, MapPin, Users, Info, Loader2, Download } from "lucide-react";

interface DashboardMetrics {
  repliesReceived: number;
  activeConversations: number;
  meetingsInterested: number;
  remainingQuota: number;
  totalEmailsSent: number;
  totalCreatorsFound: number;
  totalCredits: number;
  creditsUsed: number;
  creditsRemaining: number;
}

interface SystemStatus {
  gmail: boolean;
  aiOutreach: boolean;
  followups: boolean;
  creatorFinder: boolean;
}

interface Campaign {
  id: number;
  name: string;
  platforms: string[];
  status: "searching" | "outreach_running" | "awaiting_replies" | "completed";
  creatorsContacted: number;
  replies: number;
  criteria: any;
}

export default function DashboardPage() {
  return (
    <SubscriptionGuard>
      <Suspense fallback={<div className="h-screen bg-[#F5F3EF] flex items-center justify-center"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>}>
        <DashboardContent />
      </Suspense>
    </SubscriptionGuard>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    repliesReceived: 0,
    activeConversations: 0,
    meetingsInterested: 0,
    remainingQuota: 0,
    totalEmailsSent: 0,
    totalCreatorsFound: 0,
    totalCredits: 0,
    creditsUsed: 0,
    creditsRemaining: 0,
  });

  const [status, setStatus] = useState<SystemStatus>({
    gmail: false,
    aiOutreach: true,
    followups: true,
    creatorFinder: true,
  });

  const [outreachIntent, setOutreachIntent] = useState<string>("");
  const [aiAutopilot, setAiAutopilot] = useState<boolean>(false);

  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [viewingCampaign, setViewingCampaign] = useState<any | null>(null);
  const [viewingCreators, setViewingCreators] = useState<any[]>([]);
  const [loadingCreators, setLoadingCreators] = useState(false);
  const [recentThreads, setRecentThreads] = useState<any[]>([]);

  useEffect(() => {
    async function initDashboard() {
      if (isDemo) {
        setLoading(false);
        return;
      }

      const user = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.uid);
      setUserEmail(user.email);

      try {
        const [statsRes, accountRes, gmailRes, requestsRes, threadsRes] = await Promise.all([
          fetchUserStats(),
          fetchUserAccount(),
          getGmailStatus(),
          fetchRecentRequests(),
          fetchRecentThreads(5)
        ]);

        if (statsRes.success && statsRes.stats) {
          const stats = statsRes.stats;
          setMetrics({
            repliesReceived: stats.repliesReceived || 0,
            activeConversations: stats.activeConversations || 0,
            meetingsInterested: stats.meetingsInterested || 0,
            remainingQuota: stats.remainingQuota || 0,
            totalEmailsSent: stats.totalEmailsSent || 0,
            totalCreatorsFound: stats.totalCreatorsFound || 0,
            totalCredits: 0,
            creditsUsed: 0,
            creditsRemaining: 0,
          });
        }

        if (accountRes.success && accountRes.account) {
          setUserName(accountRes.account.name || accountRes.account.first_name || accountRes.account.business_name || null);
          setOutreachIntent(accountRes.account.outreach_intent || "");
          setAiAutopilot(!!accountRes.account.ai_autopilot_enabled);

          const totalCredits = accountRes.account.email_quota_daily || 0;
          const creditsUsed = accountRes.account.email_used_today || 0;

          setMetrics(prev => ({
            ...prev,
            totalCredits,
            creditsUsed,
            creditsRemaining: totalCredits - creditsUsed,
            // If we want total emails sent today to match usage, we can override, 
            // but stats.totalEmailsSent might be historical. We'll stick to stats for historical if available.
            // But actually, the dashboard tile says "Emails Sent". Usually implies total.
          }));
        }

        setStatus(prev => ({ ...prev, gmail: !!gmailRes.connected }));

        const requests = requestsRes.success ? (requestsRes.requests || []) : [];
        const campaigns: Campaign[] = requests.map((req: any) => ({
          id: req.id,
          name: req.name,
          platforms: req.platforms || (Array.isArray(req.platform) ? req.platform : (req.platform ? [req.platform] : [])),
          status: req.status === "delivered" ? "awaiting_replies" : req.status === "in_progress" ? "outreach_running" : "searching",
          creatorsContacted: req.results_count || req.resultsCount || 0,
          replies: 0,
          criteria: req.criteria || req.filters_json || {}
        }));
        setRecentCampaigns(campaigns);

        if (threadsRes.success && threadsRes.threads) {
          setRecentThreads(threadsRes.threads);
        }

      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    initDashboard();
  }, [router, isDemo]);

  if (loading) {
    return (
      <main className="h-screen bg-[#F5F3EF] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading your command center...</p>
        </div>
      </main>
    );
  }

  if (isDemo) {
    return <DemoDashboard />;
  }

  const handleDeleteCampaign = async (id: number) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      const user = await getCurrentUser();
      const token = await user?.getIdToken();

      const res = await fetch(`/api/user/requests?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setRecentCampaigns(prev => prev.filter(c => c.id !== id));
        toast.success("Campaign deleted");
      } else {
        toast.error("Failed to delete");
      }
    } catch (e) {
      console.error("Delete failed", e);
      toast.error("Error deleting campaign");
    }
  };

  const handleViewCampaignResults = async (campaign: any) => {
    setViewingCampaign(campaign);
    setLoadingCreators(true);
    setViewingCreators([]);

    try {
      const user = await getCurrentUser();
      const token = await user?.getIdToken();

      const platform = (campaign.platforms?.[0] || 'youtube').toLowerCase();
      const filters = campaign.criteria || {};

      const res = await fetch(`/api/user/requests/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId: campaign.id,
          platform,
          filters,
          requestedCount: campaign.creatorsContacted || 50
        })
      });

      const data = await res.json();
      if (data.success) {
        setViewingCreators(data.creators || []);
      } else {
        toast.error("Failed to load creators");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error loading results");
    } finally {
      setLoadingCreators(false);
    }
  };

  const downloadCreatorsCSV = (creators: any[], filename: string) => {
    if (!creators || creators.length === 0) {
      toast.error("No creators to download");
      return;
    }

    // Define headers
    const headers = ["Name", "Handle", "Platform", "Email", "Followers", "Engagement Rate", "Location", "Profile URL"];

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...creators.map(c => {
        const row = [
          `"${(c.name || c.fullname || "").replace(/"/g, '""')}"`,
          `"${(c.handle || c.username || "").replace(/"/g, '""')}"`,
          `"${(c.platform || "").replace(/"/g, '""')}"`,
          `"${(c.email || "").replace(/"/g, '""')}"`,
          `"${c.followers || 0}"`,
          `"${(typeof c.engagement_rate === 'number' ? (c.engagement_rate * 100).toFixed(2) : c.engagement_rate) || 0}%"`,
          `"${(c.location || "").replace(/"/g, '""')}"`,
          `"${getPlatformUrl(c.platform, c.handle || c.username)}"`
        ];
        return row.join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Downloaded ${creators.length} creators`);
  };

  const handleDownloadAll = async () => {
    const toastId = toast.loading("Preparing all creators download...");

    try {
      const user = await getCurrentUser();
      const token = await user?.getIdToken();

      const res = await fetch(`/api/user/requests/results/export-all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success && data.creators) {
        downloadCreatorsCSV(data.creators, `all-creators-export-${new Date().toISOString().split('T')[0]}`);
        toast.dismiss(toastId);
      } else {
        toast.error("Failed to fetch all creators", { id: toastId });
      }
    } catch (e) {
      console.error(e);
      toast.error("Error downloading all creators", { id: toastId });
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <main className="min-h-screen bg-[#F3F1EB] font-sans pb-20 relative overflow-hidden">
      <Navbar />

      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-60">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] bg-gradient-to-br from-purple-100 via-pink-100 to-transparent blur-[100px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[50%] bg-gradient-to-bl from-blue-100 via-teal-50 to-transparent blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 space-y-8 relative z-10">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-black tracking-tight mb-2">
              {getTimeGreeting()}, {userName || userEmail?.split('@')[0]}
            </h1>
            <p className="text-lg text-black font-medium flex items-center gap-2">
              Your automated outreach is {aiAutopilot ? <span className="font-bold text-green-600">active</span> : <span className="font-bold text-orange-600">paused (Enable Autopilot)</span>}.
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full text-xs font-black text-black border border-gray-200 shadow-sm uppercase tracking-widest hover:bg-gray-50 transition-colors group"
              >
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse group-hover:animate-none"></span>
                Focus: {outreachIntent || "Phone Number & Rates"}
                <svg className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </Link>
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={handleDownloadAll}
              className="px-4 py-2.5 bg-white text-black border-2 border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all hover:scale-105 active:scale-95 shadow-sm flex items-center gap-2 h-[46px]"
              title="Download All Creators (CSV)"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export All</span>
            </button>
            <div className="px-5 py-2 bg-white rounded-xl border-2 border-gray-100 shadow-sm h-[46px] flex flex-col justify-center min-w-[140px]">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Credits</div>
              <div className="text-base font-black text-black leading-none whitespace-nowrap">
                {metrics.creditsRemaining.toLocaleString()} <span className="text-gray-300 font-medium">/ {metrics.totalCredits.toLocaleString()}</span>
              </div>
            </div>
            <Link
              href="/creator-request"
              className="px-6 py-2.5 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/10 flex items-center gap-2 h-[46px]"
            >
              <span>+ New Campaign</span>
            </Link>
          </div>
        </div>

        {/* Stats            {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatTile
            label="CREATORS FOUND"
            value={metrics.totalCreatorsFound || 0}
            suffix="total"
            color="bg-white border-2 border-gray-100"
          />
          <StatTile
            label="EMAILS SENT"
            value={metrics.totalEmailsSent || 0}
            suffix="total"
            color="bg-white border-2 border-gray-100"
          />
          <StatTile
            label="ACTIVE CONVOS"
            value={metrics.activeConversations || 0}
            suffix="ongoing"
            color="bg-white border-2 border-blue-100"
            textColor="text-blue-900"
          />
          <StatTile
            label="INTERESTED"
            value={metrics.meetingsInterested || 0}
            suffix="leads"
            color="bg-white border-2 border-green-100"
            textColor="text-green-900"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          {/* Main Feed: Campaigns & Activity */}
          <div className="lg:col-span-2 space-y-8">

            {/* Active Campaigns */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-black flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
                  Active Campaigns
                </h2>
                <Link href="/creator-request" className="text-sm font-bold text-gray-900 hover:text-black hover:underline">View All</Link>
              </div>

              <div className="space-y-3">
                {recentCampaigns && recentCampaigns.length > 0 ? (
                  recentCampaigns.map((c) => (
                    <CampaignCard key={c.id} campaign={c} onDelete={handleDeleteCampaign} onClick={() => handleViewCampaignResults(c)} />
                  ))
                ) : (
                  <div className="p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-center">
                    <p className="text-gray-900 font-bold mb-4">No active campaigns running.</p>
                    <Link href="/creator-request" className="text-sm font-bold text-black border-b-2 border-black pb-0.5 hover:text-gray-600 hover:border-gray-600 transition-colors">Start your first campaign</Link>
                  </div>
                )}
              </div>
            </section>

            {/* Recent Inbox Activity */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-black">Inbox Activity</h2>
                <Link href="/inbox" className="text-sm font-bold text-gray-900 hover:text-black hover:underline">Go to Inbox</Link>
              </div>

              <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
                {recentThreads.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {recentThreads.map((thread) => (
                      <div key={thread.id} className="p-5 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-transparent hover:border-black" onClick={() => router.push('/inbox')}>
                        <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold shrink-0">
                          {thread.creator_email?.charAt(0).toUpperCase() || "C"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-black truncate">
                            {thread.last_message_from === 'user' ? 'You replied to ' : 'Reply from '}
                            <span className="underline">{thread.creator_handle || thread.creator_email}</span>
                          </p>
                          <p className="text-sm text-gray-600 mt-1 truncate">
                            {thread.last_message_from === 'user' ? 'AI Reply Sent' : 'New message received'}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wide font-bold">
                            {thread.updated_at ? new Date(thread.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-900 font-medium text-sm">
                    No recent replies found.
                  </div>
                )}
              </div>
            </section>

          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">

            {/* Action Card - High Contrast */}
            <div className="bg-black rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-1">Check your Inbox</h3>
                <p className="text-gray-300 text-sm mb-6">Review new leads and AI conversations.</p>

                <div className="flex justify-between items-end mb-4">
                  <span className="text-5xl font-black">{metrics.repliesReceived}</span>
                  <span className="text-sm text-gray-300 mb-2 font-bold">new replies</span>
                </div>

                <Link href="/inbox" className="block w-full py-3 bg-white text-black rounded-xl font-bold text-center hover:bg-gray-200 transition-colors">
                  Open Inbox
                </Link>
              </div>
            </div>

            {/* System Status - Clean */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-black text-sm uppercase tracking-wide">System Health</h3>
                {/* Autopilot Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-gray-400">Autopilot</span>
                  <button
                    onClick={async () => {
                      const newState = !aiAutopilot;
                      setAiAutopilot(newState);
                      try {
                        await updateUserAccount({ ai_autopilot_enabled: newState });
                        toast.success(newState ? "Autopilot enabled" : "Autopilot disabled");
                      } catch (e) {
                        setAiAutopilot(!newState);
                        toast.error("Failed to update autopilot");
                      }
                    }}
                    className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out relative ${aiAutopilot ? 'bg-green-500' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${aiAutopilot ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <StatusRow label="Gmail Connected" active={status.gmail} />
                <StatusRow label="AI Agent" active={status.aiOutreach} />
                <StatusRow label="Lead Finder" active={status.creatorFinder} />
              </div>
              {!status.gmail && (
                <Link href="/settings" className="mt-4 block w-full py-2 border-2 border-red-100 bg-red-50 text-red-600 rounded-lg text-xs font-bold text-center hover:bg-red-100">
                  Fix Connection
                </Link>
              )}
              {aiAutopilot && (
                <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg flex gap-2">
                  <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                  <p className="text-xs text-green-800 font-medium leading-relaxed">
                    Autopilot is <strong>active</strong>. The AI will continuously find and engage creators until your daily email limit is reached.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Results Modal */}
      {viewingCampaign && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewingCampaign(null)} />
          <div className="bg-white w-full max-w-5xl max-h-[85vh] rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 rounded-2xl">
                  {getPlatformIcon(viewingCampaign.platforms?.[0] || 'any', "w-6 h-6")}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-black leading-tight">{viewingCampaign.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Campaign Results</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span className="text-xs font-black text-black uppercase">{viewingCreators.length} Found</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadCreatorsCSV(viewingCreators, `${viewingCampaign.name}-export`)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
                <button
                  onClick={() => setViewingCampaign(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-black"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50/30">
              {loadingCreators ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-black" />
                  <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">Fetching Creators...</p>
                </div>
              ) : viewingCreators.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4">
                  <p className="text-gray-400 font-medium">No results found for this campaign.</p>
                </div>
              ) : (
                <div className="p-4 sm:p-6 pb-20">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {viewingCreators.map((c, i) => (
                      <div key={i} className="bg-white p-5 rounded-3xl border-2 border-gray-100 shadow-sm hover:shadow-xl hover:border-black transition-all group relative overflow-hidden">
                        {/* Platform Badge */}
                        <div className="absolute top-4 left-4 px-3 py-1.5 bg-white border-2 border-gray-100 rounded-full shadow-sm flex items-center gap-2 z-10">
                          {getPlatformIcon(c.platform || viewingCampaign.platforms?.[0], "w-4 h-4")}
                          <span className="text-xs font-black text-gray-900 uppercase">{(c.platform || viewingCampaign.platforms?.[0] || 'unknown')}</span>
                        </div>
                        <div className="pt-8">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-black truncate pr-6">{c.fullname || c.name || c.username}</h3>
                            <p className="text-xs text-gray-400 font-medium">@{String(c.handle || c.username || "").replace(/^@/, "")}</p>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200/50">
                                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                                  {(c.platform || viewingCampaign.platforms?.[0]) === 'youtube' ? 'Subscribers' : 'Followers'}
                                </div>
                                <div className="text-2xl font-black text-blue-900">{(Number(c.followers) > 0 || c.followers === 0) ? new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(c.followers) : "N/A"}</div>
                              </div>
                              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl border border-green-200/50">
                                <div className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Engagement</div>
                                <div className="text-2xl font-black text-green-900">{(Number(c.engagement_rate) * 100 >= 0) ? `${(Number(c.engagement_rate) * 100).toFixed(1)}%` : "N/A"}</div>
                              </div>
                            </div>

                            <div className="mt-4 space-y-2">
                              {c.email ? (
                                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100">
                                  <Mail className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate">{c.email}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-400 rounded-xl text-xs font-bold border border-gray-100">
                                  <Mail className="w-4 h-4 flex-shrink-0" />
                                  <span>No Email Found</span>
                                </div>
                              )}
                              {c.location && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold border border-gray-100">
                                  <MapPin className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate">{c.location}</span>
                                </div>
                              )}
                            </div>
                            <a
                              href={getPlatformUrl(c.platform || viewingCampaign.platforms?.[0], c.handle || c.username)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all group-hover:scale-105 active:scale-95 shadow-lg shadow-black/10"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>Go to Profile</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-white border-t border-gray-100 flex items-center justify-between shrink-0">
              <div className="text-xs text-gray-400 font-medium max-w-md">
                Note: Detailed contact data and deep analytics are enriched during the campaign outreach process.
              </div>
              <button
                onClick={() => setViewingCampaign(null)}
                className="px-8 py-3 bg-black text-white rounded-xl font-bold shadow-lg shadow-black/10 hover:bg-gray-800 transition-all active:scale-95"
              >
                Close Results
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatTile({ label, value, suffix, color, textColor = "text-black" }: any) {
  return (
    <div className={`${color} p-6 rounded-2xl shadow-sm flex flex-col justify-between h-36 hover:shadow-md transition-shadow`}>
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</span>
      <div>
        <span className={`text-4xl font-black ${textColor} tracking-tight`}>{value}</span>
        <span className="text-sm text-gray-400 ml-1 font-bold">{suffix}</span>
      </div>
    </div>
  );
}

function CampaignCard({ campaign, onDelete, onClick }: { campaign: Campaign, onDelete: (id: number) => void, onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white p-6 rounded-2xl border-2 border-gray-100 hover:border-black transition-all group cursor-pointer hover:shadow-xl hover:shadow-black/5 active:scale-[0.98] relative"
    >
      <div className="flex justify-between items-start relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
              {getPlatformIcon(campaign.platforms?.[0] || 'any', "w-4 h-4")}
            </div>
            <h3 className="font-bold text-lg text-black">{campaign.name}</h3>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-sm text-gray-500 font-medium truncate max-w-[200px]">
            Targeting {(campaign.platforms && campaign.platforms.length > 0) ? campaign.platforms.join(', ') : 'YouTube'}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(campaign.id);
            }}
            className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Campaign"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <div className="text-right">
            <span className="block text-2xl font-black text-black">{campaign.creatorsContacted}</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest whitespace-nowrap">Found Creators</span>
          </div>
        </div>
      </div>
      {/* Progress Bar & View Results Action */}
      <div className="mt-5 flex items-center gap-4 h-6">
        <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden relative">
          <div className="h-full bg-black w-[65%] rounded-full transition-all group-hover:w-[100%] duration-1000"></div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-300 w-24 flex-shrink-0">
          <div className="flex justify-end items-center gap-1.5 text-[10px] font-black uppercase text-black">
            Results <Eye className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}

function getPlatformIcon(platform: string, className = "h-3 w-3") {
  const p = platform?.toLowerCase();
  if (p === 'youtube') return <Youtube className={`${className} text-red-600`} />;
  if (p === 'instagram') return <Instagram className={`${className} text-pink-600`} />;
  if (p === 'tiktok') return <Music className={`${className} text-black`} />;
  return <Globe className={`${className} text-gray-400`} />;
}

function getPlatformUrl(platform: string, handle: string) {
  const p = platform?.toLowerCase();
  const h = handle?.replace(/^@/, "") || "";
  if (!h) return "#";
  if (p === 'youtube') return `https://youtube.com/@${h}`;
  if (p === 'instagram') return `https://instagram.com/${h}`;
  if (p === 'tiktok') return `https://tiktok.com/@${h}`;
  return "#";
}

function StatusRow({ label, active }: { label: string, active: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`}></span>
        <span className={`text-xs font-bold ${active ? 'text-green-600' : 'text-red-500'}`}>{active ? 'Online' : 'Offline'}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Campaign["status"] }) {
  const styles = {
    searching: "bg-blue-100 text-blue-700",
    outreach_running: "bg-purple-100 text-purple-700",
    awaiting_replies: "bg-amber-100 text-amber-700",
    completed: "bg-green-100 text-green-700"
  };

  const labels = {
    searching: "Finding",
    outreach_running: "Sending",
    awaiting_replies: "Waiting",
    completed: "Done"
  };

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
