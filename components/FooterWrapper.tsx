"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
    const pathname = usePathname();

    // List of paths where the footer should be hidden
    const hiddenPaths = [
        '/login',
        '/signup',
        '/dashboard',
        '/inbox',
        '/admin',
        '/creator-request',
        '/settings',
        '/email-finder',
        '/data'
    ];

    // Helper to check if path starts with hidden path (e.g. /admin/users)
    const shouldHide = hiddenPaths.some(path => pathname?.startsWith(path));

    if (shouldHide) return null;

    return <Footer />;
}
