'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, Chrome } from 'lucide-react';

export default function ExtensionConnectPage() {
    const [user, setUser] = useState<User | null>(null);
    const [status, setStatus] = useState<'checking' | 'ready' | 'success' | 'error'>('checking');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!auth) {
            setStatus('error');
            setMessage('Firebase auth not initialized');
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                setStatus('ready');
            } else {
                setStatus('error');
                setMessage('Please log in first');
            }
        });

        return () => unsubscribe();
    }, []);

    const handleConnect = async () => {
        if (!user) return;

        try {
            setStatus('checking');
            setMessage('Getting token...');

            const idToken = await user.getIdToken();

            const response = await fetch('/api/extension/auth-token', {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });

            if (!response.ok) {
                throw new Error('Failed to get extension token');
            }

            const { token } = await response.json();

            window.postMessage({
                type: 'VERALITY_EXTENSION_TOKEN',
                token: token,
                origin: window.location.origin
            }, '*');

            setStatus('success');
            setMessage('Extension connected successfully!');

        } catch (error: any) {
            setStatus('error');
            setMessage(error.message);
        }
    };

    return (
        <main className="min-h-screen relative font-sans selection:bg-black selection:text-white overflow-hidden bg-[#FFFBF5]">
            {/* Animated Background Blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FF9E0B]/20 blur-[100px] rounded-full mix-blend-multiply animate-blob pointer-events-none z-0" />
            <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] bg-[#6B4BFF]/20 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-2000 pointer-events-none z-0" />
            <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-[#FF5252]/15 blur-[120px] rounded-full mix-blend-multiply animate-blob animation-delay-4000 pointer-events-none z-0" />

            {/* Grid Pattern */}
            <div
                className="fixed inset-0 z-0 opacity-[0.15] pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, #00000008 1px, transparent 1px),
                        linear-gradient(to bottom, #00000008 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Content */}
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-20">
                {/* Back Link */}
                <Link
                    href="/dashboard"
                    className="absolute top-8 left-8 text-sm text-gray-600 hover:text-black transition-colors flex items-center gap-2"
                >
                    ← Back to Dashboard
                </Link>

                {/* Main Card */}
                <div className="w-full max-w-lg">
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 p-12 text-center">
                        {/* Icon */}
                        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Chrome className="w-10 h-10 text-white" />
                        </div>

                        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            Connect Extension
                        </h1>

                        {status === 'ready' && (
                            <>
                                <p className="text-gray-600 mb-8 text-lg">
                                    Click below to authorize the Verality Chrome extension
                                </p>
                                <button
                                    onClick={handleConnect}
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-3"
                                >
                                    <Chrome className="w-5 h-5" />
                                    Connect Extension
                                </button>
                                <p className="text-sm text-gray-500 mt-4">
                                    This will allow the extension to access your Verality account
                                </p>
                            </>
                        )}

                        {status === 'checking' && (
                            <div className="py-12">
                                <Loader2 className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
                                <p className="text-gray-600 text-lg">{message}</p>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="py-12">
                                <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                                </div>
                                <p className="text-green-600 font-semibold text-2xl mb-2">{message}</p>
                                <p className="text-gray-600 mb-6">
                                    You can now close this tab and use the extension on YouTube
                                </p>
                                <Link
                                    href="/dashboard"
                                    className="inline-block bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Back to Dashboard
                                </Link>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="py-12">
                                <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                                    <XCircle className="w-12 h-12 text-red-600" />
                                </div>
                                <p className="text-red-600 font-semibold text-xl mb-4">{message}</p>
                                {!user && (
                                    <Link
                                        href="/login"
                                        className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-8 rounded-lg hover:shadow-lg transition-all"
                                    >
                                        Go to Login
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Help Text */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600">
                            Need help? <Link href="/support" className="text-purple-600 hover:underline">Contact Support</Link>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
