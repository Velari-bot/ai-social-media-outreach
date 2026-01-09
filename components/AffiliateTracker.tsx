
"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

export default function AffiliateTracker() {
    const searchParams = useSearchParams();
    const trackedRef = useRef<boolean>(false);

    useEffect(() => {
        // Only track once per page load to avoid spamming on re-renders
        if (trackedRef.current) return;

        const refCode = searchParams.get("ref");
        if (refCode) {
            trackedRef.current = true;

            // Store in local storage for signup attribution
            if (typeof window !== 'undefined') {
                localStorage.setItem("verality_affiliate_ref", refCode);
            }

            // Send to server
            fetch("/api/affiliates/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refCode }),
            }).catch(err => console.error("Tracking error:", err));
        }
    }, [searchParams]);

    return null;
}
