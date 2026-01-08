"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    if (!email || !auth?.currentUser) return;
    setIsResending(true);
    try {
      // Resend verification email
      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/dashboard`,
      });
      toast.success("Verification email sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend email");
    } finally {
      setIsResending(false);
    }
  };

  const gmailUrl = `https://mail.google.com/mail/u/0/#inbox`;

  return (
    <main className="min-h-screen flex bg-gray-100 p-6">
      <div className="w-full bg-white border border-gray-200 rounded-3xl overflow-hidden flex min-h-[calc(100vh-3rem)]">
        {/* Left Side - Gradient Panel */}
        <div className="hidden md:flex md:w-[40%] bg-gradient-to-b from-[#FFD4A3] via-[#FF9EC5] to-[#D4A3FF] rounded-l-3xl relative overflow-hidden">
          {/* Logo */}
          <div className="absolute top-8 left-8">
            <div className="text-2xl font-black text-black">mo</div>
          </div>
        </div>

        {/* Right Side - Content Panel */}
        <div className="w-full md:w-[60%] bg-white flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8 rounded-r-3xl md:rounded-none">
          <div className="w-full max-w-md text-center">
            {/* Logo */}
            <div className="mb-8">
              <div className="text-3xl font-black text-black mb-6">mo</div>
            </div>

            {/* Heading */}
            <h1 className="text-2xl sm:text-3xl font-black text-black mb-4">
              CHECK YOUR EMAIL
            </h1>

            {/* Message */}
            <p className="text-gray-600 mb-8 text-sm">
              An email was sent to <strong>{email || "your email address"}</strong>, please click the link in the email.
            </p>

            {/* Email Provider Button */}
            <div className="mb-6">
              <a
                href={gmailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-6 py-3.5 border border-gray-300 rounded-xl hover:border-gray-400 transition-colors font-medium flex items-center justify-center gap-3 bg-white"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-black">Open Gmail</span>
              </a>
            </div>

            {/* Manual Check Button */}
            <div className="mb-6">
              <button
                onClick={async () => {
                  if (auth?.currentUser) {
                    await auth.currentUser.reload();
                    if (auth.currentUser.emailVerified) {
                      toast.success("Email verified!");
                      window.location.href = "/onboarding";
                    } else {
                      toast.error("Email not yet verified. Please check your inbox.");
                    }
                  } else {
                    // If no user session, they might need to login again
                    window.location.href = "/login";
                  }
                }}
                className="w-full px-6 py-3.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
              >
                I've verified my email
              </button>
            </div>

            {/* Troubleshooting Links */}
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">
                Didn't receive an email?{" "}
                <button
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-black underline hover:no-underline font-medium disabled:opacity-50"
                >
                  Resend verification
                </button>
              </p>
              <p className="text-gray-600">
                Wrong e-mail?{" "}
                <Link
                  href="/signup"
                  className="text-black underline hover:no-underline font-medium"
                >
                  Re-enter your address
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex bg-gray-100 p-6">
        <div className="w-full bg-white border border-gray-200 rounded-3xl overflow-hidden flex min-h-[calc(100vh-3rem)] items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </main>
    }>
      <CheckEmailContent />
    </Suspense>
  );
}

