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
import OutcomeMetricsPanel from "@/components/OutcomeMetricsPanel";
import { Eye, X, ExternalLink, Youtube, Instagram, Music, Globe, Mail, MapPin, Users, Info, Loader2, Download, Search, ArrowRight } from "lucide-react";

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
  lifetimeSavings: number;
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
  recurring: boolean;
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
    lifetimeSavings: 0,
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
            lifetimeSavings: 0,
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
            lifetimeSavings: accountRes.account.lifetime_savings_usd || 0
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
          criteria: req.criteria || req.filters_json || {},
          recurring: !!req.is_recurring
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

  const triggerAutopilot = async (campaignId: number, e: any) => {
    e.stopPropagation();
    if (isDemo) {
      toast.error("Cannot run autopilot in demo info");
      return;
    }

    const toastId = toast.loading("Resuming Autopilot: Finding creators...");

    try {
      // 1. Force Search
      const searchRes = await fetch('/api/debug/force-search', {
        method: 'POST',
        body: JSON.stringify({ userId, campaignId: campaignId.toString() })
      });
      const searchData = await searchRes.json();

      if (!searchData.success && !searchData.error?.includes('No quota')) {
        throw new Error(searchData.error || "Search failed");
      }

      const found = searchData.found || 0;

      // 2. Force Email Send (if creators found or just to be safe)
      toast.loading(`Found ${found} new creators! Sending emails...`, { id: toastId });

      const sendRes = await fetch('/api/debug/force-send', {
        method: 'POST',
        body: JSON.stringify({ userId, forceAll: true })
      });
      const sendData = await sendRes.json();

      toast.success(`Autopilot Complete: ${found} found, ${sendData.sendResult?.sent || 0} emails sent!`, { id: toastId });

      // Refresh dashboard
      // window.location.reload(); // Or just let stats update on next poll

    } catch (err: any) {
      console.error(err);
      toast.error("Autopilot failed: " + err.message, { id: toastId });
    }
  };

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 space-y-8 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200/60">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight mb-2">
              {getTimeGreeting()}, {userName || userEmail?.split('@')[0]}
            </h1>
            <p className="text-gray-500 font-medium text-lg">
              Here is what&apos;s happening with your outreach today.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
              <span className="text-sm font-bold text-gray-600 uppercase tracking-widest">
                {metrics.creditsRemaining.toLocaleString()} Credits Left
              </span>
            </div>

            <Link
              href="/creator-request"
              className="px-6 py-2.5 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/10 flex items-center gap-2"
            >
              <span>+ New Campaign</span>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pipeline Volume */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Pipeline Volume</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-3xl font-black text-black mb-1">{metrics.totalCreatorsFound.toLocaleString()}</div>
                <div className="text-sm font-bold text-gray-500">Creators Found</div>
              </div>
              <div>
                <div className="text-3xl font-black text-black mb-1">{metrics.totalEmailsSent.toLocaleString()}</div>
                <div className="text-sm font-bold text-gray-500">Emails Sent</div>
              </div>
            </div>
          </div>

          {/* Performance Outcomes */}
          <div className="bg-black text-white rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:scale-[1.01] transition-transform">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

            <div className="flex justify-between items-start relative z-10">
              <div>
                <h3 className="text-xs font-black text-white/60 uppercase tracking-widest mb-6">Campaign Performance</h3>
                <div className="flex gap-12">
                  <div>
                    <div className="text-4xl font-black text-white mb-1">{metrics.activeConversations}</div>
                    <div className="text-sm font-bold text-white/60">Active Convos</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-green-400 mb-1">{metrics.meetingsInterested}</div>
                    <div className="text-sm font-bold text-green-400/80">Interested Leads</div>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <div className="text-2xl font-black text-white/40">${(metrics.lifetimeSavings || 0).toLocaleString()}</div>
                <div className="text-xs font-bold text-white/20 uppercase tracking-wider">Est. Value</div>
              </div>
            </div>
          </div>
        </div>

        {/* Outcome Metrics Panel - Priority #1 */}
        <OutcomeMetricsPanel />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          {/* Main Feed: Campaigns & Activity */}
          <div className="lg:col-span-2 space-y-8">

            {/* Active Campaigns */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-black flex items-center gap-3">
                  Your Campaigns
                  <span className="bg-gray-100 text-black text-xs px-2 py-1 rounded-full">{recentCampaigns.length}</span>
                </h2>
                {recentCampaigns.length > 0 && (
                  <Link href="/creator-request" className="text-sm font-bold text-gray-500 hover:text-black">View All</Link>
                )}
              </div>

              <div className="space-y-4">
                {recentCampaigns && recentCampaigns.length > 0 ? (
                  recentCampaigns.map((campaign) => (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      onDelete={handleDeleteCampaign}
                      onRunNow={(id, e) => triggerAutopilot(id, e)}
                      onClick={() => router.push(`/creator-request?id=${campaign.id}`)}
                    />
                  ))
                ) : (
                  <div className="p-12 bg-white rounded-3xl border border-gray-100 text-center shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-black text-black mb-2">No active campaigns</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">Start searching for creators to launch your first automated outreach campaign.</p>
                    <Link href="/creator-request" className="inline-flex px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors">
                      Start Discovery
                    </Link>
                  </div>
                )}
              </div>
            </section>

          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">

            {/* Quick Inbox Preview */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-black text-lg">Inbox Activity</h3>
                <Link href="/inbox" className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100">
                  <ArrowRight className="w-4 h-4 text-black" />
                </Link>
              </div>

              {recentThreads.length > 0 ? (
                <div className="space-y-4">
                  {recentThreads.map((thread) => (
                    <div key={thread.id} className="flex gap-4 group cursor-pointer" onClick={() => router.push('/inbox')}>
                      <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                        {thread.creator_email?.charAt(0).toUpperCase() || "C"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-black truncate">
                          {thread.creator_handle || thread.creator_email}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {thread.last_message_from === 'user' ? 'You: ' : ''}{thread.snippet || (thread.last_message_from === 'user' ? 'Check inbox...' : 'New message')}
                        </p>
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold whitespace-nowrap">
                        {thread.updated_at ? new Date(thread.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No recent messages.
                </div>
              )}
            </div>

            {/* System Status - Clean */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-black text-sm uppercase tracking-wide">System Health</h3>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status.gmail && status.aiOutreach ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                  <span className="text-xs font-bold text-gray-500">{status.gmail ? 'Operational' : 'Attention Needed'}</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <StatusRow label="Gmail Connection" active={status.gmail} />
                <StatusRow label="AI Agent" active={status.aiOutreach} />
                <StatusRow label="Lead Finder" active={status.creatorFinder} />
              </div>

              <div className="pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">Autopilot</span>
                  <button
                    onClick={async () => {
                      const newState = !aiAutopilot;
                      setAiAutopilot(newState);
                      try {
                        await updateUserAccount({ ai_autopilot_enabled: newState });
                        await fetch('/api/user/campaigns/toggle-all-autopilot', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId, enabled: newState })
                        });
                        setRecentCampaigns(prev => prev.map(c => ({ ...c, recurring: newState })));
                        toast.success(newState ? "Autopilot enabled" : "Autopilot disabled");
                      } catch (e) {
                        setAiAutopilot(!newState);
                        console.error(e);
                        toast.error("Failed to update autopilot");
                      }
                    }}
                    className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out relative ${aiAutopilot ? 'bg-black' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${aiAutopilot ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {!status.gmail && (
                <Link href="/settings" className="mt-4 block w-full py-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold text-center hover:bg-red-100">
                  Fix Connection
                </Link>
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
      )
      }
    </main >
  );
}



function CampaignCard({ campaign, onDelete, onClick, onRunNow }: { campaign: Campaign, onDelete: (id: number) => void, onClick: () => void, onRunNow?: (id: number, e: any) => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white p-6 rounded-2xl border-2 border-gray-100 hover:border-black transition-all group cursor-pointer hover:shadow-xl hover:shadow-black/5 active:scale-[0.98] relative"
    >
      <div className="flex justify-between items-start relative z-10">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
              {getPlatformIcon(campaign.platforms?.[0] || 'any', "w-4 h-4")}
            </div>
            <h3 className="font-bold text-lg text-black mr-2">{campaign.name}</h3>

            {/* Status Badges */}
            <div className="flex items-center gap-2">
              <StatusBadge status={campaign.status} />
              {campaign.recurring && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide bg-green-100 text-green-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Autopilot
                  </span>
                  <button
                    onClick={(e) => onRunNow?.(campaign.id, e)}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-green-600 transition-colors"
                    title="Run Autopilot Now (Force Search & Email)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0v2.433l-.31-.31a7 7 0 0 0-11.712 3.138.75.75 0 0 0 1.449.39 5.5 5.5 0 0 1 9.201-2.466l.312.312h-2.433a.75.75 0 0 0 0 1.5h4.242a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium truncate max-w-[200px]">
            {(campaign.platforms && campaign.platforms.length > 0) ? campaign.platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ') : 'YouTube'}
            <span className="text-gray-300 mx-2">•</span>
            {campaign.recurring ? "Finding new creators daily" : "One-time search"}
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
    awaiting_replies: "Sent First Email",
    completed: "Done"
  };

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
