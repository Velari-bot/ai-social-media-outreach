'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/auth-helpers';
import { useRouter } from 'next/navigation';

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

                // Let's also try to close the window after a short delay
                setTimeout(() => {
                    // window.close(); 
                }, 1000);

            } catch (err: any) {
                console.error('Auth error:', err);
                setStatus('error');
                setError(err.message);
            }
        }

        authenticate();
    }, [router]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0b] text-white p-4">
            <div className="w-full max-w-md space-y-8 text-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                    Verality Extension
                </h1>

                <div className="bg-[#161618] border border-white/5 p-8 rounded-2xl shadow-2xl">
                    {status === 'checking' && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                            <p className="text-gray-400">Verifying your account...</p>
                        </div>
                    )}

                    {status === 'authenticated' && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-xl font-medium">Successfully Connected!</p>
                            <p className="text-gray-400">You can now close this tab and go back to the extension.</p>
                        </div>
                    )}

                    {status === 'unauthenticated' && (
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-gray-400">Redirecting to login...</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-red-400">Error: {error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn-primary w-full py-2"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
