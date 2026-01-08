"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { getCurrentUser } from "@/lib/auth-helpers";
import { fetchUserAccount, fetchUserStats, fetchRecentRequests, getGmailStatus } from "@/lib/api-client";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";

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
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    emailsSentToday: 0,
    emailsSentMonth: 0,
    repliesReceived: 0,
    activeConversations: 0,
    meetingsInterested: 0,
    remainingQuota: 100,
    replyRate: 0,
  });
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    gmail: false,
    aiOutreach: false,
    followups: false,
    creatorFinder: true,
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [newRepliesCount, setNewRepliesCount] = useState(0);

  // Load dashboard data
  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Wait for auth to initialize
        const user = await new Promise<any>((resolve) => {
          if (!auth) {
            resolve(null);
            return;
          }
          const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
          });
        });

        if (!user) {
          // Only redirect if we are SURE there is no user
          console.log("No user found, redirecting to login");
          toast.error("Please log in to continue");
          router.push("/login");
          return;
        }

        setUserId(user.uid);

        // Fetch user account for quota info
        try {
          const accountResponse = await fetchUserAccount();
          if (accountResponse.success && accountResponse.account) {
            const account = accountResponse.account;
            setMetrics((prev) => ({
              ...prev,
              emailsSentToday: account.email_used_today,
              emailsSentMonth: account.email_used_this_month,
              remainingQuota: account.email_quota_daily - account.email_used_today,
            }));
          } else {
            // If account fetch fails but user is logged in, they might be new
            // Double check if we should create an account or redirect to onboarding?
            // For now, let's just log it. The login page handles redirection to onboarding usually.
            console.warn("User logged in but no account found.");
          }
        } catch (error) {
          console.error('Error fetching account:', error);
        }

        // Fetch Gmail Status
        try {
          const gmailStatus = await getGmailStatus();
          setSystemStatus(prev => ({
            ...prev,
            gmail: !!gmailStatus.connected
          }));
        } catch (error) {
          console.error("Error fetching gmail status:", error);
        }

        // Fetch stats
        try {
          const statsResponse = await fetchUserStats();
          if (statsResponse.success && statsResponse.stats) {
            const stats = statsResponse.stats;
            setMetrics((prev) => ({
              ...prev,
              repliesReceived: stats.total_creators_contacted > 0
                ? Math.floor(stats.total_creators_contacted * 0.25) // Mock: 25% reply rate
                : 0,
              activeConversations: stats.total_creators_contacted > 0
                ? Math.floor(stats.total_creators_contacted * 0.15) // Mock: 15% active
                : 0,
              meetingsInterested: stats.total_creators_contacted > 0
                ? Math.floor(stats.total_creators_contacted * 0.10) // Mock: 10% interested
                : 0,
              replyRate: stats.average_reply_rate || 0,
            }));
          }
        } catch (error) {
          console.error('Error fetching stats:', error);
        }

        // Fetch recent requests as campaigns
        try {
          const requestsResponse = await fetchRecentRequests(10);
          if (requestsResponse.success && requestsResponse.requests) {
            const requests = requestsResponse.requests;
            const formattedCampaigns: Campaign[] = requests.map((req) => ({
              id: typeof req.id === 'string' ? parseInt(req.id) || 0 : req.id,
              name: req.name,
              platforms: req.platforms,
              status: req.status === "pending"
                ? "searching"
                : req.status === "in_progress"
                  ? "outreach_running"
                  : req.status === "delivered"
                    ? "awaiting_replies"
                    : "completed",
              creatorsContacted: req.results_count || 0,
              replies: Math.floor((req.results_count || 0) * 0.25), // Mock replies
            }));
            setCampaigns(formattedCampaigns);

            // Update Automation Status based on campaigns
            const hasActiveOutreach = requests.some(r => r.status === 'in_progress');
            const hasFollowups = requests.some(r => r.status === 'in_progress' || r.status === 'delivered');

            setSystemStatus(prev => ({
              ...prev,
              aiOutreach: hasActiveOutreach,
              followups: hasFollowups,
              creatorFinder: true // Always operational if we can fetch requests
            }));
          }
        } catch (error) {
          console.error('Error fetching requests:', error);
          setSystemStatus(prev => ({ ...prev, creatorFinder: false }));
        }

        // TODO: Fetch new replies count from database
        // This will need to check for unread replies
        setNewRepliesCount(0);

      } catch (error: any) {
        console.error("Error loading dashboard:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "searching":
        return "text-blue-700 bg-blue-100";
      case "outreach_running":
        return "text-green-700 bg-green-100";
      case "awaiting_replies":
        return "text-yellow-700 bg-yellow-100";
      case "completed":
        return "text-gray-700 bg-gray-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "searching":
        return "Searching";
      case "outreach_running":
        return "Outreach Running";
      case "awaiting_replies":
        return "Awaiting Replies";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };


  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F3EF] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F3EF] font-sans" style={{ backgroundImage: 'none' }}>
      <Navbar />

      <div className="w-full px-4 sm:px-6 pt-24 pb-8 sm:pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl sm:text-5xl font-black text-black mb-2 tracking-tight">Dashboard</h1>
                <p className="text-lg text-gray-700">
                  Here's how much value we're generating for you right now.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/settings"
                  className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-black flex items-center justify-center"
                  title="Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
                {newRepliesCount > 0 && (
                  <Link
                    href="/inbox"
                    className="relative px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-black flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{newRepliesCount} new {newRepliesCount === 1 ? 'reply' : 'replies'}</span>
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
                      {newRepliesCount}
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* 1. Top KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors shadow-sm">
              <div className="text-3xl font-black mb-1 text-black">{metrics.emailsSentToday}</div>
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-1">Emails Sent</div>
              <div className="text-xs text-gray-500">Today</div>
            </div>
            <div className="p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors shadow-sm">
              <div className="text-3xl font-black mb-1 text-black">{metrics.emailsSentMonth}</div>
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-1">Emails Sent</div>
              <div className="text-xs text-gray-500">This Month</div>
            </div>
            <div className="p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors shadow-sm">
              <div className="text-3xl font-black mb-1 text-blue-600">{metrics.repliesReceived}</div>
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wider">Replies Received</div>
            </div>
            <div className="p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors shadow-sm">
              <div className="text-3xl font-black mb-1 text-green-600">{metrics.activeConversations}</div>
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wider">Active Conversations</div>
            </div>
            <div className="p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors shadow-sm">
              <div className="text-3xl font-black mb-1 text-purple-600">{metrics.meetingsInterested}</div>
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wider">Meetings / Interested</div>
            </div>
            <div className="p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors shadow-sm">
              <div className="text-3xl font-black mb-1 text-black">{metrics.remainingQuota}</div>
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-1">Remaining</div>
              <div className="text-xs text-gray-500">Daily Quota</div>
            </div>
          </div>

          {/* Reply Rate Card (Optional) */}
          {metrics.replyRate > 0 && (
            <div className="mb-8 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 uppercase tracking-wider mb-1">Reply Rate</div>
                  <div className="text-3xl font-black text-black">{metrics.replyRate.toFixed(1)}%</div>
                </div>
                <div className="w-24 h-24 relative">
                  <svg className="transform -rotate-90 w-24 h-24">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(metrics.replyRate / 100) * 251.2} 251.2`}
                      className="text-purple-600"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* 2. System Status / Automation Health */}
              <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                <h2 className="text-xl font-bold text-black mb-4">Automation Status</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-700 font-medium">Gmail</span>
                    <span className={`flex items-center gap-2 text-sm font-medium ${systemStatus.gmail ? "text-green-600" : "text-red-600"}`}>
                      {systemStatus.gmail ? (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Connected
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          Disconnected
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-700 font-medium">AI Outreach</span>
                    <span className={`flex items-center gap-2 text-sm font-medium ${systemStatus.aiOutreach ? "text-green-600" : "text-red-600"}`}>
                      {systemStatus.aiOutreach ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-current"></div>
                          Running
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-current"></div>
                          Stopped
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-700 font-medium">Follow-ups</span>
                    <span className={`flex items-center gap-2 text-sm font-medium ${systemStatus.followups ? "text-green-600" : "text-red-600"}`}>
                      {systemStatus.followups ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-current"></div>
                          Enabled
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-current"></div>
                          Disabled
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-700 font-medium">Creator Finder</span>
                    <span className={`flex items-center gap-2 text-sm font-medium ${systemStatus.creatorFinder ? "text-green-600" : "text-red-600"}`}>
                      {systemStatus.creatorFinder ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-current"></div>
                          Operational
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-current"></div>
                          Offline
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Active Campaigns / Requests */}
              <div>
                <h2 className="text-2xl font-bold text-black mb-4">Active Campaigns / Requests</h2>
                <div className="space-y-3">
                  {campaigns.length > 0 ? (
                    campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="p-5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-black mb-1">{campaign.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              {campaign.platforms.map((platform, idx) => (
                                <span key={idx} className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                  {platform}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getStatusColor(campaign.status)}`}>
                            {getStatusLabel(campaign.status)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Creators Contacted</div>
                            <div className="text-lg font-bold text-black">{campaign.creatorsContacted}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Replies</div>
                            <div className="text-lg font-bold text-blue-600">{campaign.replies}</div>
                          </div>
                        </div>
                        <Link
                          href={`/creator-request?id=${campaign.id}`}
                          className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          View Details
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 bg-white border border-gray-200 rounded-xl text-center shadow-sm">
                      <p className="text-gray-600 mb-4">No active campaigns yet</p>
                      <Link
                        href="/creator-request"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-900 transition-colors text-sm font-bold"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Your First Campaign
                      </Link>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column - Quick Actions */}
            <div className="space-y-6">
              {/* 5. Quick Actions */}
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
                  <Link
                    href="/templates"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-black rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Email Templates
                  </Link>
                  <Link
                    href="/export"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-black rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export to Sheet
                  </Link>
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
