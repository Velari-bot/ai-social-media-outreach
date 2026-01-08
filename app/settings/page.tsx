"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { fetchUserAccount, getGmailStatus, disconnectGmail, getGmailOAuthUrl } from "@/lib/api-client";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";

interface GmailConnection {
  connected: boolean;
  email?: string;
  lastSync?: string;
}

interface DailyLimits {
  email_quota_daily: number;
  email_quota_monthly: number;
  email_used_today: number;
  email_used_this_month: number;
  remaining_daily: number;
  remaining_monthly: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gmailConnection, setGmailConnection] = useState<GmailConnection>({
    connected: false,
  });
  const [dailyLimits, setDailyLimits] = useState<DailyLimits>({
    email_quota_daily: 100,
    email_quota_monthly: 3000,
    email_used_today: 0,
    email_used_this_month: 0,
    remaining_daily: 100,
    remaining_monthly: 3000,
  });
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const user = getCurrentUser();
        
        if (!user) {
          toast.error("Please log in to continue");
          router.push("/login");
          return;
        }

        setUserId(user.uid);

        // Fetch user account for limits
        try {
          const accountResponse = await fetchUserAccount();
          if (accountResponse.success && accountResponse.account) {
            const account = accountResponse.account;
            setDailyLimits({
              email_quota_daily: account.email_quota_daily,
              email_quota_monthly: account.email_quota_monthly,
              email_used_today: account.email_used_today,
              email_used_this_month: account.email_used_this_month,
              remaining_daily: account.email_quota_daily - account.email_used_today,
              remaining_monthly: account.email_quota_monthly - account.email_used_this_month,
            });
          }
        } catch (error) {
          console.error('Error fetching account:', error);
        }

        // Check Gmail connection status
        try {
          const gmailResponse = await getGmailStatus();
          if (gmailResponse.success) {
            setGmailConnection({
              connected: gmailResponse.connected || false,
              email: gmailResponse.email,
              lastSync: gmailResponse.lastSync,
            });
          }
        } catch (error) {
          console.error('Error fetching Gmail status:', error);
        }

      } catch (error: any) {
        console.error("Error loading settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [router]);

  const handleConnectGmail = async () => {
    try {
      const oauthUrlResponse = await getGmailOAuthUrl();
      if (!oauthUrlResponse.success || !oauthUrlResponse.url) {
        throw new Error('Failed to generate Gmail OAuth URL');
      }
      // Redirect to Google OAuth
      window.location.href = oauthUrlResponse.url;
    } catch (error: any) {
      toast.error(error.message || "Failed to connect Gmail");
    }
  };

  const handleDisconnectGmail = async () => {
    if (!confirm("Are you sure you want to disconnect your Gmail account?")) {
      return;
    }

    try {
      const result = await disconnectGmail();
      if (result.success) {
        setGmailConnection({ connected: false });
        toast.success("Gmail account disconnected");
      } else {
        throw new Error(result.error || "Failed to disconnect");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to disconnect Gmail");
    }
  };

  const handleCancelSubscription = async () => {
    if (!showCancelConfirm) {
      setShowCancelConfirm(true);
      return;
    }

    // TODO: Implement actual subscription cancellation
    try {
      toast.success("Subscription cancelled successfully");
      setShowCancelConfirm(false);
      // Optionally redirect or refresh account data
    } catch (error: any) {
      toast.error("Failed to cancel subscription. Please contact support.");
      console.error("Error cancelling subscription:", error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F3EF] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F3EF] font-sans">
      <Navbar />

      <div className="w-full px-4 sm:px-6 pt-24 pb-8 sm:pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl sm:text-5xl font-black text-black mb-2 tracking-tight">Settings</h1>
                <p className="text-lg text-gray-700">
                  Manage your account settings and preferences
                </p>
              </div>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-black"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            {/* Gmail Connection Status */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-black mb-4">Gmail Connection</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Connection Status</div>
                    <div className="flex items-center gap-2">
                      {gmailConnection.connected ? (
                        <>
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium text-green-600">Connected</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium text-red-600">Not Connected</span>
                        </>
                      )}
                    </div>
                  </div>
                  {gmailConnection.connected ? (
                    <button
                      onClick={handleDisconnectGmail}
                      className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectGmail}
                      className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-900 transition-colors text-sm font-medium"
                    >
                      Connect Gmail
                    </button>
                  )}
                </div>
                {gmailConnection.connected && gmailConnection.email && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Connected Email</div>
                      <div className="text-sm text-gray-600">{gmailConnection.email}</div>
                    </div>
                  </div>
                )}
                {gmailConnection.connected && gmailConnection.lastSync && (
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Last Sync</div>
                      <div className="text-sm text-gray-600">
                        {new Date(gmailConnection.lastSync).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Daily Limits */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-black mb-4">Daily Limits</h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Daily Quota</div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <div className="text-3xl font-black text-black">{dailyLimits.remaining_daily}</div>
                      <div className="text-sm text-gray-500">/ {dailyLimits.email_quota_daily}</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-black h-2 rounded-full transition-all"
                        style={{
                          width: `${(dailyLimits.remaining_daily / dailyLimits.email_quota_daily) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {dailyLimits.email_used_today} emails sent today
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Monthly Quota</div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <div className="text-3xl font-black text-black">{dailyLimits.remaining_monthly}</div>
                      <div className="text-sm text-gray-500">/ {dailyLimits.email_quota_monthly}</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-black h-2 rounded-full transition-all"
                        style={{
                          width: `${(dailyLimits.remaining_monthly / dailyLimits.email_quota_monthly) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {dailyLimits.email_used_this_month} emails sent this month
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    Your limits reset daily at midnight UTC. Upgrade your plan to increase limits.
                  </p>
                </div>
              </div>
            </div>

            {/* Templates */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-black">Email Templates</h2>
                <Link
                  href="/templates"
                  className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-900 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  View & Edit Templates
                </Link>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600 mb-4">
                  Manage your email templates for outreach campaigns. Create, edit, and organize templates with variables.
                </p>
                <Link
                  href="/templates"
                  className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors inline-flex items-center gap-1"
                >
                  Go to Templates
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Billing */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-black mb-4">Billing</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Current Plan</div>
                    <div className="text-sm text-gray-600">Pro Plan</div>
                  </div>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toast.success("Billing portal link coming soon!");
                    }}
                    className="px-4 py-2 bg-white border border-gray-200 text-black rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Manage Billing
                  </a>
                </div>
                <div className="pt-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Update your payment method, view invoices, and manage your subscription.
                  </p>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toast.success("Redirecting to billing portal...");
                    }}
                    className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors inline-flex items-center gap-1"
                  >
                    Open Billing Portal
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Cancel Subscription */}
            <div className="bg-white border border-red-200 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-red-600 mb-4">Danger Zone</h2>
              <div className="space-y-4">
                {!showCancelConfirm ? (
                  <>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Cancel Subscription</div>
                      <p className="text-sm text-gray-600 mb-4">
                        Cancel your subscription at any time. Your account will remain active until the end of your billing period.
                      </p>
                      <button
                        onClick={handleCancelSubscription}
                        className="px-4 py-2 bg-white border-2 border-red-500 text-red-600 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium"
                      >
                        Cancel Subscription
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="text-sm font-medium text-red-800 mb-2">Are you sure?</div>
                      <p className="text-sm text-red-700 mb-4">
                        This action cannot be undone. Your subscription will be cancelled and you'll lose access to premium features at the end of your billing period.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCancelSubscription}
                          className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          Yes, Cancel Subscription
                        </button>
                        <button
                          onClick={() => setShowCancelConfirm(false)}
                          className="px-4 py-2 bg-white border border-gray-200 text-black rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          Keep Subscription
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


