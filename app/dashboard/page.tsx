"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { fetchUserAccount, fetchUserStats, fetchRecentRequests, getGmailStatus } from "@/lib/api-client";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import DemoDashboard from "@/components/demo/DemoDashboard";
import SubscriptionGuard from "@/components/SubscriptionGuard";

interface DashboardMetrics {
  emailsSentToday: number;
  emailsSentMonth: number;
  repliesReceived: number;
  activeConversations: number;
  meetingsInterested: number;
  remainingQuota: number;
  replyRate: number;
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
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    emailsSentToday: 0,
    emailsSentMonth: 0,
    repliesReceived: 0,
    activeConversations: 0,
    meetingsInterested: 0,
    remainingQuota: 0,
    replyRate: 0,
  });

  const [status, setStatus] = useState<SystemStatus>({
    gmail: false,
    aiOutreach: true,
    followups: true,
    creatorFinder: true,
  });

  const [outreachIntent, setOutreachIntent] = useState<string>("");

  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);

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
        const statsRes = await fetchUserStats();
        if (statsRes.success && statsRes.stats) {
          const stats = statsRes.stats;
          setMetrics({
            emailsSentToday: stats.emailsSentToday || 0,
            emailsSentMonth: stats.emailsSentMonth || 0,
            repliesReceived: stats.repliesReceived || 0,
            activeConversations: stats.activeConversations || 0,
            meetingsInterested: stats.meetingsInterested || 0,
            remainingQuota: stats.remainingQuota || 0,
            replyRate: stats.replyRate || 0,
          });
        }

        const accountRes = await fetchUserAccount();
        if (accountRes.success && accountRes.account) {
          setOutreachIntent(accountRes.account.outreach_intent || "");
        }

        const gmailRes = await getGmailStatus();
        setStatus(prev => ({ ...prev, gmail: !!gmailRes.connected }));

        const requestsRes = await fetchRecentRequests();
        const requests = requestsRes.success ? (requestsRes.requests || []) : [];
        const campaigns: Campaign[] = requests.map((req: any) => ({
          id: req.id,
          name: req.name,
          platforms: Array.isArray(req.platform) ? req.platform : (req.platform ? [req.platform] : []),
          status: req.status === "delivered" ? "awaiting_replies" : req.status === "in_progress" ? "outreach_running" : "searching",
          creatorsContacted: req.resultsCount || 0,
          replies: 0
        }));
        setRecentCampaigns(campaigns);

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
      const res = await fetch(`/api/user/requests?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer TEST_TOKEN' } // Using test token for now as per other parts
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
              {getTimeGreeting()}, {userEmail?.split('@')[0]}
            </h1>
            <p className="text-lg text-gray-900 font-medium flex items-center gap-2">
              Your automated outreach is <span className="font-bold text-green-600">active</span>.
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-black text-black border border-gray-200 uppercase tracking-widest hover:bg-gray-200 transition-colors group"
              >
                <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse group-hover:animate-none"></span>
                Focus: {outreachIntent || "Phone Number & Rates"}
                <svg className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </Link>
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/creator-request"
              className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/10 flex items-center gap-2"
            >
              <span>+ New Campaign</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid - High Contrast */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile
            label="Emails Sent"
            value={metrics.emailsSentToday}
            suffix="today"
            color="bg-white border-2 border-gray-100"
          />
          <StatTile
            label="Reply Rate"
            value={`${metrics.replyRate}%`}
            suffix="avg"
            color="bg-white border-2 border-gray-100"
          />
          <StatTile
            label="Active Convos"
            value={metrics.activeConversations}
            suffix="ongoing"
            color="bg-white border-2 border-blue-100"
            textColor="text-blue-900"
          />
          <StatTile
            label="Interested"
            value={metrics.meetingsInterested}
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
                    <CampaignCard key={c.id} campaign={c} onDelete={handleDeleteCampaign} />
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
                {metrics.repliesReceived > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {/* Simualted Recent Item */}
                    <div className="p-5 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-transparent hover:border-black" onClick={() => router.push('/inbox')}>
                      <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold shrink-0">
                        AI
                      </div>
                      <div>
                        <p className="text-sm font-bold text-black">AI replied to <span className="underline">Creator</span></p>
                        <p className="text-sm text-gray-600 mt-1">"Hey, checking in on the rates..."</p>
                        <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wide font-bold">Just now</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-900 font-medium text-sm">
                    No recent replies.
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
              <h3 className="font-bold text-black mb-4 text-sm uppercase tracking-wide">System Health</h3>
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
            </div>

          </div>
        </div>
      </div>
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

function CampaignCard({ campaign, onDelete }: { campaign: Campaign, onDelete: (id: number) => void }) {
  return (
    <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 hover:border-black transition-colors group">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg text-black">{campaign.name}</h3>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-sm text-gray-500 font-medium">Targeting {(campaign.platforms || []).join(', ')}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => onDelete(campaign.id)}
            className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Campaign"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <div>
            <span className="block text-2xl font-black text-black text-right">{campaign.creatorsContacted}</span>
            <span className="text-xs text-gray-400 font-bold uppercase">Contacted</span>
          </div>
        </div>
      </div>
      {/* Progress Bar - High Contrast */}
      <div className="mt-5 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
        <div className="h-full bg-black w-[45%] rounded-full"></div>
      </div>
    </div>
  );
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
