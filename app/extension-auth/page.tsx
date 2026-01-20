'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/auth-helpers';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ShieldCheck, XCircle, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function ExtensionAuthPage() {
    const [status, setStatus] = useState<'checking' | 'authenticated' | 'unauthenticated' | 'error'>('checking');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        async function authenticate() {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    setStatus('unauthenticated');
                    // Redirect to login but return here after success
                    router.push('/login?redirect=/extension-auth');
                    return;
                }

                setStatus('authenticated');

                // Get the Firebase ID token
                const idToken = await user.getIdToken();

                // Request a token from the specialized endpoint
                const response = await fetch('/api/extension/auth-token', {
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to generate extension token');
                }

                const { token } = await response.json();

                // Send token to extension
                window.postMessage({ type: 'VERALITY_EXTENSION_AUTH', token }, '*');

            } catch (err: any) {
                console.error('Auth error:', err);
                setStatus('error');
                setError(err.message);
            }
        }

        authenticate();
    }, [router]);

    return (
        <main className="min-h-screen relative z-10 font-sans selection:bg-black selection:text-white overflow-hidden bg-[#fdfbf7]">
            <Navbar />

            {/* Grid Pattern Overlay (Matches Home) */}
            <div
                className="fixed inset-0 z-[-1] opacity-[0.4] pointer-events-none"
                style={{
                    backgroundImage: `
            linear-gradient(to right, white 1px, transparent 1px),
            linear-gradient(to bottom, white 1px, transparent 1px)
          `,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Vivid Background Blobs (Matches Home/Login Style) */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF9E0B]/20 blur-[100px] rounded-full mix-blend-multiply animate-blob pointer-events-none z-0 opacity-60" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#6B4BFF]/20 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-2000 pointer-events-none z-0 opacity-60" />

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
                <div className="w-full max-w-lg space-y-8">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tighter leading-tight italic">
                            Verality <span className="text-[#6B4BFF]">Extension</span>
                        </h1>
                        <p className="text-gray-500 font-medium">Authenticating your secure browser connection</p>
                    </div>

                    <div className="bg-white rounded-[40px] p-10 md:p-14 border border-gray-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)] relative overflow-hidden group">
                        {/* Subtle Gradient Accent */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 via-purple-500 to-red-500" />

                        {status === 'checking' && (
                            <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
                                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center shadow-inner relative overflow-hidden">
                                    <Loader2 className="w-10 h-10 text-[#6B4BFF] animate-spin" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Verifying Account</h3>
                                    <p className="text-gray-500 font-medium">Please wait while we establish a secure bridge...</p>
                                </div>
                            </div>
                        )}

                        {status === 'authenticated' && (
                            <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500">
                                <div className="w-24 h-24 bg-[#6B4BFF]/10 rounded-[32px] flex items-center justify-center shadow-sm relative group-hover:scale-110 transition-transform duration-500">
                                    <div className="absolute inset-0 bg-[#6B4BFF]/20 blur-xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-700" />
                                    <CheckCircle2 className="w-12 h-12 text-[#6B4BFF] relative z-10" />
                                </div>
                                <div className="text-center">
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-4">Successfully Connected</h2>
                                    <p className="text-gray-500 text-lg font-medium leading-relaxed">
                                        Account bridged. You can now close this tab and start using the Verality extension on YouTube.
                                    </p>
                                </div>

                                <div className="w-full pt-4">
                                    <div className="flex items-center justify-center gap-3 px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                                        <ShieldCheck className="w-5 h-5 text-green-500" />
                                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Secure Connection Active</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {status === 'unauthenticated' && (
                            <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
                                <Loader2 className="w-10 h-10 text-gray-300 animate-spin" />
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Redirecting to login...</p>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
                                <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center shadow-sm">
                                    <XCircle className="w-10 h-10 text-red-500" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Authentication Failed</h3>
                                    <p className="text-red-500/80 font-medium mb-8 leading-relaxed">{error}</p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="px-10 py-4 bg-black text-white rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="text-center">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" /> AES-256 Encrypted Connection
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
