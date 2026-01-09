
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { fetchUserAccount } from "@/lib/api-client";
import { getCurrentUser } from "@/lib/auth-helpers";
import toast from "react-hot-toast";

interface SubscriptionGuardProps {
    children: React.ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);

    useEffect(() => {
        async function checkSubscription() {
            try {
                // 1. Check if user is logged in
                const user = getCurrentUser();
                if (!user) {
                    // Allow login/signup/pricing/home etc. (handled by layout or other logic, 
                    // but if we are here, it's likely a protected page)
                    setLoading(false);
                    return;
                }

                // 2. Fetch user account to check plan
                const res = await fetchUserAccount();
                if (res.success && res.account) {
                    const plan = res.account.plan;
                    const isActive = plan === "pro" || plan === "enterprise";
                    setHasSubscription(isActive);

                    if (!isActive) {
                        // Redirect if on a protected page
                        router.push("/pricing");
                        toast.error("An active subscription is required to access this page.");
                    }
                } else {
                    setHasSubscription(false);
                    router.push("/pricing");
                }
            } catch (error) {
                console.error("Subscription check error:", error);
            } finally {
                setLoading(false);
            }
        }

        checkSubscription();
    }, [router, pathname]);

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

    // If authenticated and has subscription, or if it's a page that doesn't need it (though this guard is wrapped around protected ones)
    if (hasSubscription === true) {
        return <>{children}</>;
    }

    // Returning null while redirecting
    return null;
}
