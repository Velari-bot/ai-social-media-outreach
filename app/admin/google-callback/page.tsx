"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

function CallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Connecting your Gmail account...');

    useEffect(() => {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            setStatus('error');
            setMessage(`Google authentication failed: ${error}`);
            return;
        }

        if (!code) {
            setStatus('error');
            setMessage('No authorization code received from Google.');
            return;
        }

        const exchangeToken = async () => {
            try {
                // The redirect URI must match exactly what was sent to getGmailOAuthUrl
                // Since we are on this page, the current origin + path is the redirect URI
                const redirectUri = `${window.location.origin}/admin/google-callback`;

                const response = await fetch('/api/admin/gmail/exchange', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code, redirectUri }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to exchange tokens');
                }

                setStatus('success');
                setMessage(`Successfully connected: ${data.email}`);

                // Redirect back to admin after a short delay
                setTimeout(() => {
                    router.push('/admin');
                }, 2000);

            } catch (err: any) {
                console.error('Exchange error:', err);
                setStatus('error');
                setMessage(err.message || 'An unexpected error occurred during connection.');
            }
        };

        exchangeToken();
    }, [searchParams, router]);

    return (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full text-center">
            {status === 'loading' && (
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                    <h2 className="text-xl font-bold text-black">Connecting...</h2>
                    <p className="text-gray-500">{message}</p>
                </div>
            )}

            {status === 'success' && (
                <div className="flex flex-col items-center gap-4">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                    <h2 className="text-xl font-bold text-black">Connected!</h2>
                    <p className="text-gray-600">{message}</p>
                    <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
                </div>
            )}

            {status === 'error' && (
                <div className="flex flex-col items-center gap-4">
                    <XCircle className="w-12 h-12 text-red-500" />
                    <h2 className="text-xl font-bold text-black">Connection Failed</h2>
                    <p className="text-red-600 bg-red-50 p-3 rounded-xl text-sm">{message}</p>
                    <Link href="/admin" className="mt-4 px-6 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors">
                        Return to Admin
                    </Link>
                </div>
            )}
        </div>
    );
}

export default function GoogleCallbackPage() {
    return (
        <div className="min-h-screen bg-[#F3F1EB] flex items-center justify-center p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <CallbackContent />
            </Suspense>
        </div>
    );
}
