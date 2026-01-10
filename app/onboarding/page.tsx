"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { getCurrentUser } from "@/lib/auth-helpers";
import { fetchUserAccount, connectGmail, updateUserAccount, getGmailStatus } from "@/lib/api-client";

type PurposeType = "brand" | "agency" | "ugc" | "other" | null;

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [purpose, setPurpose] = useState<PurposeType>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Handle OAuth callback
  const processingRef = useRef(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Check if onboarding is already completed
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Only run this check if we are NOT processing a callback code
      // If code exists, let the callback handler deal with it
      if (searchParams.get('code')) return;

      try {
        const [accountRes, gmailRes] = await Promise.all([
          fetchUserAccount(),
          getGmailStatus()
        ]);

        const hasPurpose = !!accountRes.account?.purpose;
        const isGmailConnected = !!gmailRes.connected;

        if (hasPurpose && isGmailConnected) {
          // Both done, go to app
          router.replace('/creator-request');
        } else if (hasPurpose) {
          // Purpose done, go to step 2
          setPurpose(accountRes.account.purpose);
          setStep(2);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setCheckingStatus(false);
      }
    };

    if (authInitialized) {
      checkOnboardingStatus();
    }
  }, [authInitialized, router, searchParams]);

  useEffect(() => {
    // Wait for auth to initialize
    const checkAuth = async () => {
      try {
        const { auth } = await import('@/lib/firebase');
        if (!auth) {
          setAuthInitialized(true);
          return;
        }

        const unsubscribe = auth.onAuthStateChanged((user) => {
          setAuthInitialized(true);
        });

        return unsubscribe;
      } catch (err) {
        console.error("Auth init failed", err);
        setAuthInitialized(true);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!authInitialized) return;

    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      toast.error(`Gmail connection failed: ${error}`);
      router.replace('/onboarding');
      return;
    }

    if (code && !processingRef.current) {
      processingRef.current = true;
      handleOAuthCallback(code);
    }
  }, [searchParams, router, authInitialized]);

  const handlePurposeSelect = (selectedPurpose: PurposeType) => {
    setPurpose(selectedPurpose);
    setTimeout(() => setStep(2), 300);
  };

  const handleGmailConnect = async () => {
    setIsLoading(true);
    try {
      // Get OAuth URL
      const redirectUri = `${window.location.origin}/api/gmail/callback`;
      const oauthUrlResponse = await fetch(`/api/gmail/oauth-url?redirectUri=${encodeURIComponent(redirectUri)}`);
      const oauthUrlData = await oauthUrlResponse.json();

      if (!oauthUrlData.success || !oauthUrlData.url) {
        throw new Error('Failed to generate Gmail OAuth URL');
      }

      // Redirect to Google OAuth
      window.location.href = oauthUrlData.url;
    } catch (error: any) {
      toast.error(error.message || "Failed to connect Gmail");
      setIsLoading(false);
    }
  };

  const handleOAuthCallback = async (code: string) => {
    setIsLoading(true);
    console.log("Starting OAuth callback exchange...");
    try {
      toast.loading("Completing Gmail connection...", { id: 'gmail-connect' });

      const redirectUri = `${window.location.origin}/api/gmail/callback`;
      console.log("Calling connectGmail API...");
      const result = await connectGmail(code, redirectUri);
      console.log("connectGmail result:", result);

      if (!result.success) {
        throw new Error(result.error || "Failed to connect Gmail");
      }

      toast.dismiss('gmail-connect');
      toast.success(`Gmail connected: ${result.email}`);

      // Save data back to profile
      const user = await getCurrentUser();
      if (user) {
        try {
          await updateUserAccount({
            purpose: purpose || 'other',
            first_name: firstName,
            last_name: lastName,
            business_name: businessName,
            name: `${firstName} ${lastName}`.trim()
          });
          console.log('Account data saved');
        } catch (error) {
          console.error('Error saving account data:', error);
        }
      }

      // Clear URL params
      router.replace('/onboarding');

      // Redirect to creator request page
      setTimeout(() => {
        router.push("/creator-request");
      }, 1000);
    } catch (error: any) {
      console.error("OAuth callback error:", error);
      toast.dismiss('gmail-connect');
      toast.error(error.message || "Failed to complete Gmail connection");
      router.replace('/onboarding');
      processingRef.current = false; // Allow retry if needed
    } finally {
      setIsLoading(false);
    }
  };

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

        {/* Right Side - Form Panel */}
        <div className="w-full md:w-[60%] bg-white flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8 rounded-r-3xl md:rounded-none">
          <div className="w-full max-w-md">
            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <div className={`flex-1 h-1 ${step >= 1 ? "bg-[#FF6B9C]" : "bg-gray-200"}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? "bg-[#FF6B9C] text-white" : "bg-gray-200 text-gray-500"}`}>
                  1
                </div>
                <div className={`flex-1 h-1 ${step >= 2 ? "bg-[#FF6B9C]" : "bg-gray-200"}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? "bg-[#FF6B9C] text-white" : "bg-gray-200 text-gray-500"}`}>
                  2
                </div>
                <div className={`flex-1 h-1 ${step >= 3 ? "bg-[#FF6B9C]" : "bg-gray-200"}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? "bg-[#FF6B9C] text-white" : "bg-gray-200 text-gray-500"}`}>
                  3
                </div>
              </div>
            </div>

            {/* Step 1: Personal Details */}
            {step === 1 && (
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-black text-center mb-3">
                  Let's get started
                </h1>
                <p className="text-gray-600 text-center mb-8 text-sm">
                  Please provide your real name. We use this for professional email signatures in your outreach.
                </p>

                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. John"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 text-black font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Smith"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 text-black font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Business Name (Optional)</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Verality AI"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 text-black font-medium"
                    />
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
                    <div className="text-blue-500 pt-0.5 font-bold">ⓘ</div>
                    <p className="text-[11px] text-blue-700 font-medium leading-normal">
                      This is optional, but highly recommended for better reply rates. If left blank, we will use a professional generic signature.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="btn-primary w-full"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: Welcome & Purpose */}
            {step === 2 && (
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-black text-center mb-3">
                  What's your goal?
                </h1>
                <p className="text-gray-600 text-center mb-8 text-sm">
                  We'll customize your experience based on what you're building.
                </p>

                <div className="mb-6">
                  <div className="space-y-3">
                    <button
                      onClick={() => handlePurposeSelect("brand")}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-[#FF6B9C] hover:bg-pink-50 transition-all text-left bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked={purpose === "brand"}
                          onChange={() => handlePurposeSelect("brand")}
                          className="w-4 h-4 text-[#FF6B9C] border-gray-300 focus:ring-[#FF6B9C]"
                        />
                        <span className="text-gray-900 font-medium">Find creators for brand deals</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handlePurposeSelect("agency")}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-[#FF6B9C] hover:bg-pink-50 transition-all text-left bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked={purpose === "agency"}
                          onChange={() => handlePurposeSelect("agency")}
                          className="w-4 h-4 text-[#FF6B9C] border-gray-300 focus:ring-[#FF6B9C]"
                        />
                        <span className="text-gray-900 font-medium">Outreach for agencies</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handlePurposeSelect("ugc")}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-[#FF6B9C] hover:bg-pink-50 transition-all text-left bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked={purpose === "ugc"}
                          onChange={() => handlePurposeSelect("ugc")}
                          className="w-4 h-4 text-[#FF6B9C] border-gray-300 focus:ring-[#FF6B9C]"
                        />
                        <span className="text-gray-900 font-medium">Book creators for UGC</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handlePurposeSelect("other")}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-[#FF6B9C] hover:bg-pink-50 transition-all text-left bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked={purpose === "other"}
                          onChange={() => handlePurposeSelect("other")}
                          className="w-4 h-4 text-[#FF6B9C] border-gray-300 focus:ring-[#FF6B9C]"
                        />
                        <span className="text-gray-900 font-medium">Other</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-black font-bold rounded-xl hover:bg-gray-200 transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!purpose}
                    className="flex-[2] btn-primary disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Connect Gmail */}
            {step === 3 && (
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-black text-center mb-3">
                  Connect your Gmail
                </h1>
                <p className="text-gray-600 text-center mb-6 text-sm">
                  Connect your Gmail to send and track outreach automatically.
                  <br />
                  <span className="text-gray-500">We only access emails related to outreach you send through our platform.</span>
                </p>

                {/* Checkmarks */}
                <div className="mb-6 space-y-3 bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">Send emails for you</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">Track replies automatically</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">Follow up without you lifting a finger</span>
                  </div>
                </div>

                <button
                  onClick={handleGmailConnect}
                  disabled={isLoading}
                  className="btn-primary w-full mb-4"
                >
                  {isLoading ? (
                    "Connecting..."
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span>Connect Gmail</span>
                    </>
                  )}
                </button>

                {step === 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep(2);
                    }}
                    className="w-full px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
                  >
                    ← Back
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex bg-gray-100 p-6">
        <div className="w-full bg-white border border-gray-200 rounded-3xl overflow-hidden flex min-h-[calc(100vh-3rem)] items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
