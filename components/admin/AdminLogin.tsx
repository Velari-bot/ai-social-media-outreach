"use client";

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AdminLogin({ onLogin }: { onLogin: () => void }) {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 800));

        if (password === 'verality-admin') {
            onLogin();
            toast.success('Access Granted');
        } else {
            toast.error('Access Denied');
        }
        setLoading(false);
    };

    return (
        <div className="bg-white p-10 rounded-[32px] shadow-2xl border border-gray-100 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-10">
                <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-black/20">
                    <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tight">Admin Portal</h2>
                <p className="text-gray-500 mt-2 font-medium">Restricted access only.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter secure key"
                        className="w-full px-6 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium text-lg placeholder:text-gray-400 text-black"
                        autoFocus
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-900 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-xl shadow-black/10"
                >
                    {loading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <>
                            Enter Dashboard
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
