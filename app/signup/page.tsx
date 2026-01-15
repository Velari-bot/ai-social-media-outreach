
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { signUp, signInWithGoogle } from "@/lib/auth-helpers";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize account in Firestore
  const initAccount = async (token: string, userEmail: string, userName: string) => {
    try {
      const res = await fetch('/api/user/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: userEmail,
          name: userName
        })
      });
      return await res.json();
    } catch (error) {
      console.error('Failed to init account:', error);
      return { success: false };
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      toast.error("Please fill in all fields");
      return;
    }
    setShowPasswordField(true);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    try {
      const user = await signUp(email, password);
      const token = await user.getIdToken();

      toast.success("Account created!");

      // Initialize Firestore account
      await initAccount(token, email, name);

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setIsLoading(true);
      const user = await signInWithGoogle();
      if (user) {
        const token = await user.getIdToken();
        toast.success("Signed in with Google!");

        // Initialize Firestore account
        await initAccount(token, user.email || '', user.displayName || '');

        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error('Google signup error:', error);
      if (error.message !== "Sign in cancelled") {
        toast.error(error.message || "Failed to sign in with Google");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex p-6 items-center justify-center bg-[#F3F1EB]">
      <div className="w-full bg-white border border-gray-200 rounded-3xl overflow-hidden flex min-h-[calc(100vh-3rem)]">
        {/* Left Side - Visuals */}
        <div className="hidden md:flex md:w-[45%] bg-[#F3F1EB] rounded-l-3xl relative overflow-hidden flex-col justify-between p-12">
          {/* Animated Background */}
          <div className="absolute top-[-20%] left-[-20%] w-[90%] h-[90%] bg-[#6B4BFF]/30 blur-[100px] rounded-full animate-blob" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[90%] h-[90%] bg-[#FF9E0B]/30 blur-[100px] rounded-full animate-blob animation-delay-2000" />

          <div className="relative z-10 w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-xl rotate-3">
            <img src="/v-nav.png" alt="Verality" className="w-5 h-5 object-contain" />
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl font-black text-black leading-tight mb-6">
              Start finding <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">top creators</span> in seconds.
            </h2>
            <div className="flex -space-x-3">
              {['/charli.jpg', '/dude.jpg', '/kim.jpg', '/mkbhd.jpg', '/mr-beast.jpg'].map((src, i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden shadow-sm">
                  <img src={src} alt="Creator" className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-white bg-black flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                +10k
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-[60%] flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-black text-black text-center mb-6">
              CREATE ACCOUNT
            </h1>

            <button
              onClick={handleGoogleSignup}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all mb-6 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest text-gray-400"><span className="px-4 bg-white">or</span></div>
            </div>

            <form onSubmit={showPasswordField ? handleSignupSubmit : handleEmailSubmit} className="space-y-4">
              {!showPasswordField && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-blue-400/30 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Work Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-blue-400/30 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="name@company.com"
                    />
                  </div>
                </>
              )}

              {showPasswordField && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Create Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoFocus
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-blue-400/30 rounded-xl focus:border-blue-500 focus:outline-none transition-colors pr-12"
                      placeholder="Min. 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-900 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {isLoading ? "Please wait..." : (showPasswordField ? "Complete Signup" : "Next Step")}
                {!isLoading && (
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>

              {showPasswordField && (
                <button
                  type="button"
                  onClick={() => setShowPasswordField(false)}
                  className="w-full text-center text-sm font-bold text-gray-400 hover:text-gray-600 mt-2"
                >
                  ← Back to details
                </button>
              )}
            </form>

            <p className="mt-8 text-center text-sm text-gray-500 font-medium">
              Already have an account?{" "}
              <Link href="/login" className="text-black font-black underline underline-offset-4">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
