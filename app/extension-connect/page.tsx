'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';

export default function ExtensionAuthPage() {
    const { user } = useAuth();
    const [status, setStatus] = useState<'checking' | 'ready' | 'success' | 'error'>('checking');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user) {
            setStatus('ready');
        } else {
            setStatus('error');
            setMessage('Please log in first');
        }
    }, [user]);

    const handleConnect = async () => {
        try {
            setStatus('checking');
            setMessage('Getting token...');

            // Get Firebase ID token
            const idToken = await user.getIdToken();

            // Exchange for extension JWT
            const response = await fetch('/api/extension/auth-token', {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });

            if (!response.ok) {
                throw new Error('Failed to get extension token');
            }

            const { token } = await response.json();

            // Send to extension via postMessage
            window.postMessage({
                type: 'VERALITY_EXTENSION_TOKEN',
                token: token,
                origin: window.location.origin
            }, '*');

            setStatus('success');
            setMessage('✓ Extension connected! You can close this tab.');

        } catch (error: any) {
            setStatus('error');
            setMessage(error.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
            <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
                <h1 className="text-3xl font-bold mb-4">Connect Extension</h1>

                {status === 'ready' && (
                    <>
                        <p className="text-gray-600 mb-6">
                            Click below to connect the Verality extension to your account
                        </p>
                        <button
                            onClick={handleConnect}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition"
                        >
                            Connect Extension
                        </button>
                    </>
                )}

                {status === 'checking' && (
                    <div className="py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="py-8">
                        <div className="text-6xl mb-4">✓</div>
                        <p className="text-green-600 font-semibold text-xl">{message}</p>
                        <p className="text-gray-500 text-sm mt-4">
                            Go back to YouTube and refresh the page
                        </p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="py-8">
                        <div className="text-6xl mb-4">✗</div>
                        <p className="text-red-600 font-semibold">{message}</p>
                        {!user && (
                            <a
                                href="/login"
                                className="mt-4 inline-block bg-purple-600 text-white py-2 px-6 rounded-lg hover:bg-purple-700"
                            >
                                Go to Login
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
