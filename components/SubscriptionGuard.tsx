
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { fetchUserAccount } from "@/lib/api-client";
import { getCurrentUser } from "@/lib/auth-helpers";
import toast from "react-hot-toast";
import Link from "next/link";

interface SubscriptionGuardProps {
    children: React.ReactNode;
}

function SubscriptionGuardContent({ children }: SubscriptionGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isDemo = searchParams?.get("demo") === "true";

    const [loading, setLoading] = useState(true);
    const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function checkSubscription() {
            // Bypass for demo mode
            if (isDemo) {
                setHasSubscription(true);
                setLoading(false);
                return;
            }

            try {
                // 1. Check if user is logged in
                const user = await getCurrentUser();
                if (!user) {
                    // Not logged in
                    router.push("/login");
                    // Don't just set loading false, we want to hold the loader or redirect state
                    return;
                }

                // 2. Fetch user account to check plan
                const res = await fetchUserAccount();
                if (res.success && res.account) {
                    const plan = res.account.plan;
                    // Allow all paid plans including testing and custom
                    const paidPlans = ["basic", "pro", "growth", "scale", "enterprise", "testing", "custom_no_email"];
                    const isActive = paidPlans.includes(plan?.toLowerCase());
                    setHasSubscription(isActive);

                    if (!isActive) {
                        router.push("/pricing");
                        toast.error("An active subscription is required to access this page.");
                    }
                } else {
                    // API call succeeded but weird response? or handled in catch
                    setHasSubscription(false);
                    router.push("/pricing");
                }
            } catch (err: any) {
                console.error("Subscription check error:", err);
                // If the backend is down (500), we shouldn't just redirect or show nothing.
                setError(err.message || "Failed to verify subscription.");
            } finally {
                setLoading(false);
            }
        }

        checkSubscription();
    }, [router, pathname, isDemo]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F3F1EB] flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium">Verifying subscription...</p>
                </div>
            </div>
        );
    }

    // Demo or Active Sub
    if (hasSubscription === true) {
        return <>{children}</>;
    }

    // Error State
    if (error) {
        return (
            <div className="min-h-screen bg-[#F3F1EB] flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h2>
                    <p className="text-gray-500 mb-6 text-sm">{error}</p>
                    <p className="text-xs text-gray-400 mb-6 bg-gray-50 p-2 rounded">Tip: Check if FIREBASE_SERVICE_ACCOUNT is set in .env.local</p>

                    <div className="flex gap-3 justify-center">
                        <Link href="/" className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50">
                            Go Home
                        </Link>
                        <a href="/dashboard?demo=true" className="px-4 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800">
                            Try Demo Mode
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // If strictly false (redirecting happening in effect), return null or loader
    return (
        <div className="min-h-screen bg-[#F3F1EB] flex items-center justify-center opacity-50">
            <p className="text-gray-400 text-sm">Redirecting...</p>
        </div>
    );
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#F3F1EB]" />}>
            <SubscriptionGuardContent>{children}</SubscriptionGuardContent>
        </Suspense>
    );
}
