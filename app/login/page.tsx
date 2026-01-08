"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { signIn, signUp, signInWithGoogle, getGoogleAuthResult } from "@/lib/auth-helpers";
import { createUserAccount, fetchUserAccount } from "@/lib/api-client";

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

          // Check if user account exists
          let isNewUser = false;
          let accountCreationSuccess = false;

          try {
            const accountResponse = await fetchUserAccount();
            if (!accountResponse.success || !accountResponse.account) {
              console.log("User account not found via fetch, attempting creation...");
              // Account doesn't exist, create it
              isNewUser = true;
              const createResponse = await createUserAccount({
                email: user.email || '',
                name: user.displayName || '',
              });

              if (createResponse.success && createResponse.account) {
                console.log("User account created successfully");
                accountCreationSuccess = true;
                isNewUser = true;
              } else {
                throw new Error("Failed to create account record");
              }
            } else {
              // Account exists
              console.log("User account found:", accountResponse.account);
              // For existing accounts, send them to dashboard directly to avoid annoying them
              // We can add a "Complete Profile" prompt in the dashboard later if fields are missing
              isNewUser = false;
              accountCreationSuccess = true;
            }
          } catch (error: any) {
            console.error("Error finding/accessing account:", error);
            // Account might not exist or API error, try to create it as fallback
            try {
              console.log("Attempting account creation fallback...");
              const createResponse = await createUserAccount({
                email: user.email || '',
                name: user.displayName || '',
              });
              if (createResponse.success) {
                console.log("User account created successfully (fallback)");
                isNewUser = true;
                accountCreationSuccess = true;
              }
            } catch (createError: any) {
              console.error('User account creation failed:', createError);
              toast.error("Failed to set up your account: " + (createError.message || "Unknown error"));
              // Don't redirect if we strictly failed to create an account
              return;
            }
          }

          // Only redirect if we successfully found or created an account
          if (accountCreationSuccess) {
            if (isNewUser) {
              router.push("/onboarding");
            } else {
              router.push("/dashboard");
            }
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
      // First, try to sign in
      try {
        await signIn(email, password);
        toast.success("Welcome back!");

        // Check if user has completed onboarding
        try {
          const accountResponse = await fetchUserAccount();
          if (accountResponse.success && accountResponse.account) {
            const account = accountResponse.account;
            // If they have a purpose, they've completed step 1 of onboarding at least
            // You might also want to check if they have connected Gmail, but the request says "onboarding AND gmail"
            // Usually 'purpose' is set in step 1.
            if (account.purpose) {
              router.push("/dashboard");
            } else {
              router.push("/onboarding");
            }
          } else {
            // If we can't fetch account, assume they need to onboard or something is wrong
            // But to be safe for existing users (who might have data errors), let's try to create/fix or just send to dashboard?
            // User said: "if it is a previous made account... w/o onboarding"
            // Failing to fetch account might mean it doesn't exist?
            // If account doesn't exist but they signed in, we should create it.

            console.log("Account not found after login, attempting creation...");
            await createUserAccount({ email });
            router.push("/onboarding");
          }
        } catch (accountError) {
          console.error("Error checking account status:", accountError);
          // Fallback to dashboard if we can't check
          router.push("/dashboard");
        }

      } catch (signInError: any) {
        console.error("Sign in error:", signInError);

        // Check for API key errors first
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

        // If sign in fails, check if we should try to create an account
        // 'auth/user-not-found' is the old error code
        // 'auth/invalid-credential' is the new error code (with email enumeration protection)
        const errorCode = signInError.code || signInError.originalError?.code;

        if (errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential') {
          // Try to create account
          try {
            console.log("User not found or invalid credential, attempting auto-signup...");
            await signUp(email, password);
            toast.success("Account created! Please check your email to verify.");
            router.push(`/check-email?email=${encodeURIComponent(email)}`);
          } catch (signUpError: any) {
            console.error("Sign up error during fallback:", signUpError);
            const signUpErrorCode = signUpError.code || signUpError.originalError?.code;

            if (signUpError.message?.includes('API key') || signUpError.message?.includes('Firebase')) {
              toast.error(
                <div>
                  <div className="font-semibold mb-1">Firebase Configuration Required</div>
                  <div className="text-sm">Please set up Firebase in .env.local. See FIREBASE_SETUP.md</div>
                </div>,
                { duration: 6000 }
              );
            } else if (signUpErrorCode === 'auth/email-already-in-use') {
              // If signup fails because email exists, it means the original login error 
              // was actually a wrong password, not a missing user
              toast.error("Incorrect password. Please try again or reset your password.");
            } else {
              toast.error(signUpError.message || "Failed to create account");
            }
          }
        } else {
          // Show the actual error message from Firebase
          const errorMsg = signInError.message || signInError.code || "Failed to sign in";
          toast.error(errorMsg);
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message?.includes('API key') || error.message?.includes('Firebase')) {
        toast.error(
          <div>
            <div className="font-semibold mb-1">Firebase Configuration Required</div>
            <div className="text-sm">Please set up Firebase in .env.local. See FIREBASE_SETUP.md</div>
          </div>,
          { duration: 6000 }
        );
      } else {
        toast.error(error.message || "An error occurred");
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

        let isNewUser = false;
        let accountCreationSuccess = false;

        try {
          const accountResponse = await fetchUserAccount();
          if (!accountResponse.success || !accountResponse.account) {
            console.log("User account not found via fetch, attempting creation...");
            isNewUser = true;
            const createResponse = await createUserAccount({
              email: user.email || '',
              name: user.displayName || '',
            });

            if (createResponse.success && createResponse.account) {
              console.log("User account created successfully");
              accountCreationSuccess = true;
              isNewUser = true;
            } else {
              throw new Error("Failed to create account record");
            }
          } else {
            console.log("User account found:", accountResponse.account);
            // Default to dashboard for existing users
            isNewUser = false;
            accountCreationSuccess = true;
          }
        } catch (error: any) {
          console.error("Error finding/accessing account:", error);
          // Fallback creation
          try {
            console.log("Attempting account creation fallback...");
            const createResponse = await createUserAccount({
              email: user.email || '',
              name: user.displayName || '',
            });
            if (createResponse.success) {
              console.log("User account created successfully (fallback)");
              isNewUser = true;
              accountCreationSuccess = true;
            }
          } catch (createError: any) {
            console.error('User account creation failed:', createError);
            toast.error("Failed to set up your account: " + (createError.message || "Unknown error"));
            return;
          }
        }

        if (accountCreationSuccess) {
          if (isNewUser) {
            router.push("/onboarding");
          } else {
            router.push("/dashboard");
          }
        }
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast.dismiss();
      const errorMessage = error.message || "Failed to connect to Google";

      if (errorMessage === "Sign in cancelled") {
        return; // Don't show error for cancellation
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
    <main className="min-h-screen flex bg-gray-100 p-6">
      <div className="w-full bg-white border border-gray-200 rounded-3xl overflow-hidden flex min-h-[calc(100vh-3rem)]">
        {/* Left Side - Gradient Panel */}
        <div className="hidden md:flex md:w-[40%] bg-gradient-to-b from-[#FFD4A3] via-[#FF9EC5] to-[#D4A3FF] rounded-l-3xl relative overflow-hidden">
          {/* Logo */}
          <div className="absolute top-8 left-8">
            <div className="text-2xl font-black text-black">ve</div>
          </div>
        </div>

        {/* Right Side - Form Panel */}
        <div className="w-full md:w-[60%] bg-white flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8 rounded-r-3xl md:rounded-none">
          <div className="w-full max-w-sm">
            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-black text-black text-center mb-4 sm:mb-5">
              LOG IN OR SIGN UP
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
              By signing up, you agree to verality's{" "}
              <Link href="#" className="text-blue-600 underline">Privacy policy</Link>
              {" "}&{" "}
              <Link href="#" className="text-blue-600 underline">Terms of service</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
