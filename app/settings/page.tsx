"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { fetchUserAccount, getGmailStatus, disconnectGmail, getGmailOAuthUrl } from "@/lib/api-client";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import SubscriptionGuard from "@/components/SubscriptionGuard";

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
  return (
    <SubscriptionGuard>
      <Suspense fallback={<div className="min-h-screen bg-[#F3F1EB] flex items-center justify-center">Loading settings...</div>}>
        <SettingsContent />
      </Suspense>
    </SubscriptionGuard>
  );
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get("demo") === "true";

  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [gmailStatus, setGmailStatus] = useState<GmailConnection>({ connected: false });
  const [limits, setLimits] = useState<DailyLimits | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      if (isDemo) {
        setGmailStatus({ connected: true, email: "demo@verality.io", lastSync: new Date().toISOString() });
        setLimits({
          email_quota_daily: 100,
          email_quota_monthly: 3000,
          email_used_today: 12,
          email_used_this_month: 450,
          remaining_daily: 88,
          remaining_monthly: 2550
        });
        setLoading(false);
        return;
      }

      const user = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        // Fetch Gmail Status
        const status = await getGmailStatus();
        if (status.success) {
          setGmailStatus({
            connected: !!status.connected,
            email: status.email,
            lastSync: status.lastSync
          });
        }

        // Fetch Limits
        const accountRes = await fetchUserAccount();
        if (accountRes.success && accountRes.account) {
          const acc = accountRes.account;
          setLimits({
            email_quota_daily: acc.email_quota_daily || 100,
            email_quota_monthly: 3000,
            email_used_today: acc.email_used_today || 0,
            email_used_this_month: acc.email_used_this_month || 0,
            remaining_daily: (acc.email_quota_daily || 100) - (acc.email_used_today || 0),
            remaining_monthly: 3000 - (acc.email_used_this_month || 0)
          });
        }

      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [router, isDemo]);

  const handleConnectGmail = async () => {
    setConnecting(true);
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const res = await getGmailOAuthUrl();
      if (res.success && res.url) {
        window.location.href = res.url;
      }
    } catch (error) {
      console.error("Link error:", error);
      toast.error("Failed to start Gmail connection");
      setConnecting(false);
    }
  };

  const handleDisconnectGmail = async () => {
    if (!confirm("Are you sure you want to disconnect Gmail? Campaigns will stop.")) return;
    try {
      const user = await getCurrentUser();
      if (!user) return;

      await disconnectGmail();
      setGmailStatus({ connected: false });
      toast.success("Gmail disconnected");
    } catch (error) {
      toast.error("Failed to disconnect");
    }
  };

  const handleCancelSubscription = async () => {
    // Mock cancellation for now
    toast.success("Subscription cancelled. (Mock)");
    setShowCancelConfirm(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F3F1EB] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Loading settings...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F3F1EB] pb-20">
      <Navbar />

      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 pt-28">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#1A1A1A]">Settings</h1>
          <p className="text-gray-500 font-medium mt-1">Manage your account and integrations.</p>
        </div>

        <div className="grid gap-6">
          {/* Account Overview */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100/60">
            <h2 className="text-xl font-bold text-black mb-6">Account Limits</h2>

            {limits && (
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-medium text-gray-600">Daily Emails</span>
                    <span className="text-sm font-bold text-black">{limits.email_used_today} / {limits.email_quota_daily}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black transition-all duration-1000"
                      style={{ width: `${(limits.email_used_today / limits.email_quota_daily) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Resets every 24 hours</p>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-medium text-gray-600">Monthly Volume</span>
                    <span className="text-sm font-bold text-black">{limits.email_used_this_month} / {limits.email_quota_monthly}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-1000"
                      style={{ width: `${(limits.email_used_this_month / limits.email_quota_monthly) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Based on your billing cycle</p>
                </div>
              </div>
            )}
          </div>

          {/* Integrations */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100/60">
            <h2 className="text-xl font-bold text-black mb-6">Integrations</h2>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-200 shadow-sm">
                  <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-black">Gmail</h3>
                  <p className="text-sm text-gray-500">
                    {gmailStatus.connected
                      ? `Connected to ${gmailStatus.email || 'account'}`
                      : "Connect your email to send campaigns"}
                  </p>
                  {gmailStatus.lastSync && (
                    <p className="text-xs text-gray-400 mt-1">Last synced: {new Date(gmailStatus.lastSync).toLocaleString()}</p>
                  )}
                </div>
              </div>
              <div>
                {gmailStatus.connected ? (
                  <button
                    onClick={handleDisconnectGmail}
                    className="px-4 py-2 bg-white border border-gray-300 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={handleConnectGmail}
                    disabled={connecting}
                    className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50"
                  >
                    {connecting ? "Connecting..." : "Connect Gmail"}
                  </button>
                )}
              </div>
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
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toast.error("Billing isn't ready yet (demo phase)");
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 text-black rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Manage Billing
                </button>
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
                      onClick={() => setShowCancelConfirm(true)}
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

          <div className="text-center pt-8">
            <p className="text-sm text-gray-400">Verality.io v0.1.0 • <Link href="/terms" className="hover:underline">Terms</Link> • <Link href="/privacy" className="hover:underline">Privacy</Link></p>
          </div>
        </div>
      </div>
    </main>
  );
}
