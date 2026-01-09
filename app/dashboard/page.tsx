"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { fetchUserAccount, fetchUserStats, fetchRecentRequests, getGmailStatus } from "@/lib/api-client";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import DemoDashboard from "@/components/demo/DemoDashboard";

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
    <Suspense fallback={<div className="min-h-screen bg-[#F3F1EB] flex items-center justify-center">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";

  const [userId, setUserId] = useState<string | null>(null);
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

  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    async function initDashboard() {
      // Demo Mode Logic
      if (isDemo) {
        setLoading(false);
        return;
      }

      // Normal Auth Logic
      const user = await getCurrentUser();

      if (!user) {
        // Redirect if not logged in
        router.push("/login");
        return;
      }

      setUserId(user.uid);

      try {
        // 1. Fetch User Stats (Metrics)
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

        // 2. Fetch Gmail Status
        const gmailRes = await getGmailStatus();
        setStatus(prev => ({ ...prev, gmail: !!gmailRes.connected }));

        // 3. Fetch Recent Requests (Campaigns)
        const requestsRes = await fetchRecentRequests();
        const requests = requestsRes.success ? (requestsRes.requests || []) : [];
        // Map requests to campaigns format
        const campaigns: Campaign[] = requests.map((req: any) => ({
          id: req.id,
          name: req.name,
          platforms: req.platform,
          status: req.status === "delivered" ? "awaiting_replies" : req.status === "in_progress" ? "outreach_running" : "searching",
          creatorsContacted: req.resultsCount || 0,
          replies: 0 // Mock for now
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
      <main className="min-h-screen bg-[#F3F1EB] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  // Render Demo Dashboard if in demo mode
  if (isDemo) {
    return <DemoDashboard />;
  }

  return (
    <main className="min-h-screen bg-[#F3F1EB] pb-20">
      <Navbar />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-28">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#1A1A1A]">Dashboard</h1>
          <p className="text-gray-500 font-medium mt-1">Overview of your outreach performance.</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Emails Sent (Today)"
            value={metrics.emailsSentToday.toString()}
            change="+12%"
            icon="📨"
          />
          <MetricCard
            label="Replies Received"
            value={metrics.repliesReceived.toString()}
            change="+5%"
            icon="↩️"
          />
          <MetricCard
            label="Active Conversations"
            value={metrics.activeConversations.toString()}
            change="+2"
            icon="💬"
          />
          <MetricCard
            label="Meetings Interested"
            value={metrics.meetingsInterested.toString()}
            change="+1"
            icon="📅"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Active Campaigns */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-[#1A1A1A]">Active Campaigns</h2>

            {recentCampaigns.length > 0 ? (
              <div className="space-y-4">
                {recentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/60 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-[#1A1A1A] text-lg">{campaign.name}</h3>
                        <div className="flex gap-2 mt-2">
                          {campaign.platforms.map(p => (
                            <span key={p} className="text-xs px-2 py-1 bg-gray-100 rounded-md font-medium text-gray-600 uppercase tracking-wide">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                      <StatusBadge status={campaign.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Contacted</p>
                        <p className="text-xl font-bold text-[#1A1A1A]">{campaign.creatorsContacted}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Replies</p>
                        <p className="text-xl font-bold text-[#1A1A1A]">{campaign.replies}</p>
                      </div>
                    </div>
                    <Link
                      href={`/creator-request?id=${campaign.id}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors mt-4"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100/60 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  🚀
                </div>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">No active campaigns</h3>
                <p className="text-gray-500 mb-6">Start finding creators to launch your first outreach campaign.</p>
                <Link href="/creator-request" className="px-6 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors inline-block">
                  Find Creators
                </Link>
              </div>
            )}
          </div>

          {/* Right Sidebar: System Status */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/60">
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">System Status</h2>
              <div className="space-y-4">
                <StatusItem label="Gmail Connected" active={status.gmail} />
                <StatusItem label="AI Outreach Engine" active={status.aiOutreach} />
                <StatusItem label="Auto-Followups" active={status.followups} />
                <StatusItem label="Creator Finder" active={status.creatorFinder} />
              </div>

              {!status.gmail && (
                <div className="mt-6 pt-4 border-t border-gray-50">
                  <p className="text-sm text-amber-600 font-medium mb-3">Gmail not connected. Campaigns paused.</p>
                  <Link href="/settings" className="w-full py-2.5 bg-black text-white rounded-xl font-bold text-sm block text-center hover:bg-gray-800 transition-colors">
                    Connect Gmail
                  </Link>
                </div>
              )}
            </div>

            {/* Quota Card */}
            <div className="bg-[#1A1A1A] p-6 rounded-2xl shadow-lg text-white relative overflow-hidden group">
              <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-gradient-to-bl from-purple-500/30 to-transparent rounded-full blur-3xl group-hover:blur-2xl transition-all duration-700" />

              <h2 className="text-lg font-bold mb-1 relative z-10">Email Quota</h2>
              <p className="text-gray-400 text-sm mb-6 relative z-10">Daily sending limit</p>

              <div className="mb-2 flex justify-between items-end relative z-10">
                <span className="text-3xl font-black">{metrics.remainingQuota}</span>
                <span className="text-sm text-gray-400 mb-1">/ 100 left</span>
              </div>

              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden relative z-10">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-1000"
                  style={{ width: `${(metrics.remainingQuota / 100) * 100}%` }}
                />
              </div>

              <button
                onClick={() => toast.error("Billing isn't ready yet (demo phase)")}
                className="mt-6 block w-full py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl font-bold text-sm text-center transition-colors relative z-10"
              >
                Upgrade Plan
              </button>
            </div>

            {/* Quick Actions (Restored) */}
            <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-black mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  href="/creator-request"
                  className="w-full px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition-colors text-sm font-bold flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Creator Request
                </Link>
                <Link
                  href="/inbox"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-black rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  View Inbox
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

function MetricCard({ label, value, change, icon }: { label: string, value: string, change: string, icon: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/60 hover:translate-y-[-2px] transition-transform duration-300">
      <div className="flex justify-between items-start mb-4">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">{change}</span>
      </div>
      <div>
        <h3 className="text-3xl font-black text-[#1A1A1A] mb-1 tracking-tight">{value}</h3>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}

function StatusItem({ label, active }: { label: string, active: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${active ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-gray-300"}`} />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      {active && <span className="text-xs font-bold text-green-600">Active</span>}
    </div>
  );
}

function StatusBadge({ status }: { status: Campaign["status"] }) {
  const styles = {
    searching: "bg-blue-50 text-blue-600",
    outreach_running: "bg-purple-50 text-purple-600",
    awaiting_replies: "bg-amber-50 text-amber-600",
    completed: "bg-green-50 text-green-600"
  };

  const labels = {
    searching: "Searching",
    outreach_running: "Outreach",
    awaiting_replies: "Awaiting Replies",
    completed: "Completed"
  };

  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
