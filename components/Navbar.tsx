"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import toast from "react-hot-toast";

export default function Navbar() {
  return (
    <Suspense fallback={<div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none opacity-0"><div className="w-full max-w-[1200px] h-[72px]" /></div>}>
      <NavbarContent />
    </Suspense>
  );
}

function NavbarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get("demo") === "true";

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    if (isDemo) {
      setIsAuthenticated(true);
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    import('@/lib/firebase').then(({ auth }) => {
      if (!auth) {
        setLoading(false);
        return;
      }
      unsubscribe = onAuthStateChanged(auth, (user) => {
        setIsAuthenticated(!!user);
        setLoading(false);
      });
    }).catch((error) => {
      console.error('Error loading Firebase auth:', error);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isDemo]);

  const handleLogout = async () => {
    try {
      const { auth } = await import('@/lib/firebase');
      if (auth) {
        await signOut(auth);
        toast.success("Logged out successfully");
        router.push("/");
        router.refresh();
      }
    } catch (error: any) {
      toast.error("Failed to log out");
    }
  };

  const getLink = (path: string) => {
    return isDemo ? `${path}?demo=true` : path;
  };

  return (
    <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-[1200px] bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-full shadow-sm px-2 py-2.5 flex items-center justify-between h-[72px] transition-all duration-300">

        {/* Left Section: Navigation Links (Desktop) */}
        <div className="hidden lg:flex items-center gap-6 pl-6 flex-1 justify-start">
          <Link href="/" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
            Home
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
            Pricing
          </Link>
          {isAuthenticated && (
            <Link href={getLink("/dashboard")} className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
              Dashboard
            </Link>
          )}
        </div>

        {/* Center Section: Logo (Desktop: Center, Mobile: Left) */}
        <div className="flex-1 lg:flex-none flex justify-start lg:justify-center pl-4 lg:pl-0">
          <Link href={isAuthenticated ? getLink("/dashboard") : "/"} className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-lg rotate-3 group-hover:rotate-6 transition-transform">
              V
            </div>
            <span className="text-xl font-black tracking-tight text-black">verality.io</span>
          </Link>
        </div>

        {/* Right Section: Actions (Desktop) */}
        <div className="hidden lg:flex items-center gap-4 pr-2 flex-1 justify-end">
          {!loading && (
            <>
              {isAuthenticated ? (
                <>
                  <Link
                    href={getLink("/inbox")}
                    className="w-10 h-10 flex items-center justify-center rounded-full text-gray-600 hover:text-black hover:bg-gray-100 transition-all"
                    title="Inbox"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </Link>
                  <Link
                    href={getLink("/settings")}
                    className="w-10 h-10 flex items-center justify-center rounded-full text-gray-600 hover:text-black hover:bg-gray-100 transition-all"
                    title="Settings"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-10 h-10 flex items-center justify-center rounded-full text-gray-600 hover:text-black hover:bg-gray-100 transition-all"
                    title="Log out"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                  <Link
                    href={getLink("/creator-request")}
                    className="px-6 py-3 bg-black text-white rounded-full font-bold text-sm hover:bg-gray-800 transition-all hover:scale-105"
                  >
                    Find Creators
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
                    Log in
                  </Link>
                  <Link
                    href="/book"
                    className="px-6 py-3 bg-black text-white rounded-full font-bold text-sm hover:bg-gray-800 transition-all hover:scale-105"
                  >
                    Book a call
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="lg:hidden pr-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-700 hover:text-black transition-colors"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-[88px] left-4 right-4 pointer-events-auto bg-white border border-gray-200 rounded-3xl shadow-xl p-4 flex flex-col gap-2 z-40 transform origin-top animate-in fade-in slide-in-from-top-4 duration-200">
          {isAuthenticated ? (
            <>
              <Link href={getLink("/dashboard")} onClick={() => setMobileMenuOpen(false)} className="p-4 hover:bg-gray-50 rounded-xl font-medium text-black">Dashboard</Link>
              <Link href={getLink("/creator-request")} onClick={() => setMobileMenuOpen(false)} className="p-4 hover:bg-gray-50 rounded-xl font-medium text-black">Find Creators</Link>
              <Link href={getLink("/inbox")} onClick={() => setMobileMenuOpen(false)} className="p-4 hover:bg-gray-50 rounded-xl font-medium text-black">Inbox</Link>
              <Link href={getLink("/settings")} onClick={() => setMobileMenuOpen(false)} className="p-4 hover:bg-gray-50 rounded-xl font-medium text-black">Settings</Link>
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="p-4 hover:bg-gray-50 rounded-xl font-medium text-left text-red-600">Log out</button>
            </>
          ) : (
            <>
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="p-4 hover:bg-gray-50 rounded-xl font-medium text-black">Home</Link>
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="p-4 hover:bg-gray-50 rounded-xl font-medium text-black">Pricing</Link>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="p-4 hover:bg-gray-50 rounded-xl font-medium text-black">Log in</Link>
              <Link href="/book" onClick={() => setMobileMenuOpen(false)} className="p-4 bg-black text-white rounded-xl font-bold text-center mt-2">Book a call</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
