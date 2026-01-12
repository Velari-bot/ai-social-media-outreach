"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { signIn, signInWithGoogle, getGoogleAuthResult } from "@/lib/auth-helpers";
import { fetchUserAccount } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check for Google auth redirect result on page load
  useEffect(() => {
    const handleGoogleRedirect = async () => {
      try {
        const user = await getGoogleAuthResult();
        if (user) {
          // User just signed in with Google redirect
          toast.success("Signed in with Google!");
          console.log("Google auth successful, checking user account...");

          try {
            const accountResponse = await fetchUserAccount();
            if (accountResponse.success && accountResponse.account) {
              // Account exists
              console.log("User account found:", accountResponse.account);
              router.push("/dashboard");
            } else {
              // Account does not exist
              toast.error("Account not found. Please contact sales to get access.");
            }
          } catch (error: any) {
            console.error("Error finding/accessing account:", error);
            toast.error("Failed to verify account status.");
          }
        }
      } catch (error: any) {
        console.error('Error handling Google redirect:', error);
        toast.error("Authentication error: " + (error.message || "Please try again"));
      }
    };

    handleGoogleRedirect();
  }, [router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setShowPasswordField(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back!");

      // Check if user has completed onboarding
      try {
        const accountResponse = await fetchUserAccount();
        if (accountResponse.success && accountResponse.account) {
          router.push("/dashboard");
        } else {
          // Account created in Auth but not in DB? 
          // In a strict strict system this shouldn't happen if admin creates account.
          // But if it does, it's an error state.
          toast.error("Account setup incomplete. Please contact support.");
        }
      } catch (accountError) {
        console.error("Error checking account status:", accountError);
        router.push("/dashboard");
      }

    } catch (signInError: any) {
      console.error("Sign in error:", signInError);

      if (signInError.message?.includes('API key') || signInError.message?.includes('Firebase')) {
        toast.error(
          <div>
            <div className="font-semibold mb-1">Firebase Configuration Required</div>
            <div className="text-sm">Please set up Firebase in .env.local. See FIREBASE_SETUP.md</div>
          </div>,
          { duration: 6000 }
        );
        setIsLoading(false);
        return;
      }

      // Explicitly handle user not found
      const errorCode = signInError.code || signInError.originalError?.code;
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential') {
        toast.error("Invalid email or password. If you don't have an account, please contact sales.");
      } else {
        const errorMsg = signInError.message || signInError.code || "Failed to sign in";
        toast.error(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    try {
      toast.loading("Connecting to Google...");
      const user = await signInWithGoogle();
      toast.dismiss();

      if (user) {
        toast.success("Signed in with Google!");
        console.log("Google auth successful, checking user account...");

        try {
          const accountResponse = await fetchUserAccount();
          if (accountResponse.success && accountResponse.account) {
            console.log("User account found:", accountResponse.account);
            router.push("/dashboard");
          } else {
            // User authed with Google but no DB account found
            toast.error("Account not found. Please contact sales to get access.");
            // Optionally sign them out immediately
          }
        } catch (error: any) {
          console.error("Error finding/accessing account:", error);
          toast.error("Failed to verify account.");
        }
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast.dismiss();
      const errorMessage = error.message || "Failed to connect to Google";

      if (errorMessage === "Sign in cancelled") {
        return;
      }

      if (errorMessage.includes('API key') || errorMessage.includes('Firebase')) {
        toast.error(
          <div>
            <div className="font-semibold mb-1">Firebase Configuration Required</div>
            <div className="text-sm">Please set up Firebase in .env.local. See FIREBASE_SETUP.md</div>
          </div>,
          { duration: 6000 }
        );
      } else if (errorMessage.includes('Unauthorized domain')) {
        toast.error(
          <div>
            <div className="font-semibold mb-1">Domain Not Authorized</div>
            <div className="text-sm">Please add localhost to Firebase authorized domains</div>
          </div>,
          { duration: 6000 }
        );
      } else {
        toast.error(errorMessage);
      }
    }
  };

  return (
    <main className="min-h-screen flex p-6 items-center justify-center">
      <div className="w-full bg-white border border-gray-200 rounded-3xl overflow-hidden flex min-h-[calc(100vh-3rem)]">
        {/* Left Side - Rich Gradient & Personality */}
        <div className="hidden md:flex md:w-[45%] bg-[#F3F1EB] rounded-l-3xl relative overflow-hidden flex-col justify-between p-12 relative">

          {/* Rich Animated Gradient Background */}
          <div className="absolute top-[-20%] left-[-20%] w-[90%] h-[90%] bg-[#FF9E0B]/30 blur-[100px] rounded-full mix-blend-multiply animate-blob" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[90%] h-[90%] bg-[#6B4BFF]/30 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-2000" />
          <div className="absolute top-[40%] right-[-20%] w-[70%] h-[70%] bg-[#FF5252]/20 blur-[90px] rounded-full mix-blend-multiply animate-blob animation-delay-4000" />

          {/* Noise Overlay */}
          <div className="absolute inset-0 opacity-[0.4] bg-[url('/noise.png')] mix-blend-overlay pointer-events-none" />

          {/* Logo Area */}
          <div className="relative z-10 w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-xl rotate-3">
            <img src="/v-nav.png" alt="Verality" className="w-5 h-5 object-contain" />
          </div>

          {/* Personality Card - Glassmorphism */}
          <div className="relative z-10 glass-panel p-6 rounded-2xl border border-white/40 shadow-xl backdrop-blur-md bg-white/30 max-w-sm mt-auto transform hover:scale-[1.02] transition-transform duration-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
                <img src="/mr-beast.jpg" alt="Creator" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#1A1A1A]">MrBeast</div>
                <div className="text-xs text-gray-600 font-medium">@mrbeast • YouTube</div>
              </div>
              <div className="ml-auto px-2 py-1 bg-green-100/80 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-green-200">
                Replied
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full bg-white/50 rounded-full overflow-hidden">
                <div className="h-full w-[85%] bg-[#1A1A1A] rounded-full" />
              </div>
              <div className="flex justify-between text-xs font-semibold text-gray-600">
                <span>Engagement Score</span>
                <span>98/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form Panel */}
        <div className="w-full md:w-[60%] bg-white flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8 rounded-r-3xl md:rounded-none">
          <div className="w-full max-w-sm">
            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-black text-black text-center mb-4 sm:mb-5">
              LOG IN
            </h1>

            {/* Google Button */}
            <button
              onClick={handleGoogleAuth}
              className="btn-secondary mb-4"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={showPasswordField ? handlePasswordSubmit : handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Work email address
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={showPasswordField}
                  className="w-full px-3.5 py-2.5 border-2 border-blue-400 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="your@company.com"
                />
              </div>

              {showPasswordField && (
                <div className="transition-all duration-200 ease-in-out">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 border-2 border-blue-400 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900"
                      placeholder="Enter your password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading
                  ? "Signing in..."
                  : showPasswordField
                    ? "Continue"
                    : "Continue"}
              </button>

              {showPasswordField && (
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordField(false);
                    setPassword("");
                  }}
                  className="w-full px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  ← Back
                </button>
              )}
            </form>

            {/* Footer Text */}
            <p className="mt-5 text-xs text-gray-500 text-center">
              Don&apos;t have an account?{" "}
              <Link href="/book" className="text-blue-600 underline">Book a demo</Link>
              {" "}to get access.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
