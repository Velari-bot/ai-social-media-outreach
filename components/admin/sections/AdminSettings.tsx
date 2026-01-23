
"use client";

import { useState, useEffect } from "react";
import { Save, Shield, Bell, Globe, Key, Database, Mail } from "lucide-react";

export default function AdminSettings() {
    const [gmailConnected, setGmailConnected] = useState(false);
    const [gmailEmail, setGmailEmail] = useState("");

    useEffect(() => {
        async function checkGmail() {
            try {
                const res = await fetch('/api/admin/gmail/status');
                const data = await res.json();
                if (data.connected) {
                    setGmailConnected(true);
                    setGmailEmail(data.email);
                }
            } catch (e) {
                console.error("Failed to check gmail status", e);
            }
        }
        checkGmail();
    }, []);
    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-black text-black">Admin Settings</h1>
                <p className="text-gray-500 mt-1">Configure global application parameters and security.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Platform Config */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                                <Globe className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-black">Platform Configuration</h3>
                                <p className="text-xs text-gray-400 font-medium">Global app-wide settings.</p>
                            </div>
                        </div>
                        <button className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all flex items-center gap-2">
                            <Save className="w-3.5 h-3.5" />
                            Save Changes
                        </button>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">APP NAME</label>
                                <input type="text" defaultValue="Verality AI" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-black font-medium focus:ring-2 focus:ring-black/5 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">SUPPORT EMAIL</label>
                                <input type="email" defaultValue="support@verality.io" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-black font-medium focus:ring-2 focus:ring-black/5 outline-none" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-sm font-bold text-black">Maintenance Mode</p>
                                    <p className="text-xs text-gray-500">Toggle site visibility for maintenance.</p>
                                </div>
                            </div>
                            <div className="w-12 h-6 bg-gray-200 rounded-full relative cursor-pointer">
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Affiliate Program */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                                <Database className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-black">Affiliate Program</h3>
                                <p className="text-xs text-gray-400 font-medium">Join our partner program and earn commissions.</p>
                            </div>
                        </div>
                        <a
                            href="/affiliates/signup"
                            target="_blank"
                            className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-purple-700 transition-all flex items-center gap-2 shadow-sm shadow-purple-200"
                        >
                            Sign Up Now
                        </a>
                    </div>
                </div>

                {/* Data Correction Tools */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                                <Shield className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-black">Data Corrections</h3>
                                <p className="text-xs text-gray-400 font-medium">Fix data integrity issues.</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-2xl">
                            <div>
                                <p className="font-bold text-sm text-gray-900">Fix MRR / Plan Bug</p>
                                <p className="text-xs text-gray-500 mt-1">Downgrades users who were incorrectly assigned &apos;Pro&apos; plan without payment.</p>
                            </div>
                            <button
                                onClick={async () => {
                                    if (confirm("Are you sure you want to scan and fix bugged Pro users? This will downgrade users without a subscription ID.")) {
                                        try {
                                            const res = await fetch('/api/admin/fix-price-bug', { method: 'POST' });
                                            const data = await res.json();
                                            if (data.success) {
                                                alert(data.message);
                                                window.location.reload();
                                            } else {
                                                alert("Error: " + data.error);
                                            }
                                        } catch (e) {
                                            alert("Failed to execute fix.");
                                        }
                                    }
                                }}
                                className="px-4 py-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-xl hover:bg-red-50 transition-colors shadow-sm"
                            >
                                Run Fix Script
                            </button>
                        </div>
                    </div>
                </div>

                {/* API & Keys */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                            <Key className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-black">API Connections</h3>
                            <p className="text-xs text-gray-400 font-medium">Manage external service integrations.</p>
                        </div>
                    </div>
                    <div className="p-8 space-y-4 text-sm">

                        {/* Gmail Integration */}
                        <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors group border border-dashed border-gray-200 hover:border-blue-200">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm ${gmailConnected ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500 group-hover:bg-white'}`}>
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="font-bold text-black">Booking Email Sender</p>
                                    <p className="text-xs text-gray-500 font-medium">
                                        {gmailConnected ? `Connected as ${gmailEmail}` : 'Connect Gmail account for sending invites'}
                                    </p>
                                </div>
                            </div>
                            {gmailConnected ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg border border-green-100 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                        Active
                                    </span>
                                    <button
                                        onClick={async () => {
                                            if (confirm("Send a test email to yourself?")) {
                                                const btn = document.getElementById('test-email-btn');
                                                if (btn) btn.innerText = "Sending...";

                                                try {
                                                    const res = await fetch('/api/admin/gmail/test', { method: 'POST' });
                                                    const data = await res.json();

                                                    if (res.ok) {
                                                        alert("Success! " + data.message);
                                                    } else {
                                                        alert("Error: " + JSON.stringify(data.error));
                                                    }
                                                } catch (err) {
                                                    alert("Failed to call test endpoint.");
                                                } finally {
                                                    if (btn) btn.innerText = "Test Config";
                                                }
                                            }
                                        }}
                                        id="test-email-btn"
                                        className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors border border-blue-100"
                                    >
                                        Test Config
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (confirm("Disconnect Gmail account?")) {
                                                try {
                                                    const res = await fetch('/api/admin/gmail/disconnect', { method: 'POST' });
                                                    if (res.ok) {
                                                        setGmailConnected(false);
                                                        setGmailEmail("");
                                                    }
                                                } catch (err) {
                                                    console.error("Failed to disconnect", err);
                                                    alert("Failed to disconnect Gmail account. Please try again.");
                                                }
                                            }
                                        }}
                                        className="text-xs font-bold text-gray-400 hover:text-red-500 px-3 py-1 rounded-lg transition-colors"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        const clientId = process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID;
                                        if (!clientId) {
                                            alert("Configuration Error: NEXT_PUBLIC_GMAIL_CLIENT_ID is missing.");
                                            return;
                                        }
                                        const redirectUri = `${window.location.origin}/admin/google-callback`;
                                        const scope = [
                                            'https://www.googleapis.com/auth/gmail.send',
                                            'https://www.googleapis.com/auth/userinfo.email'
                                        ].join(' ');

                                        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

                                        window.location.href = authUrl;
                                    }}
                                    className="text-xs font-bold text-white hover:bg-blue-700 bg-blue-600 px-4 py-2 rounded-xl transition-all shadow-sm shadow-blue-200"
                                >
                                    Connect Gmail
                                </button>
                            )}
                        </div>

                        <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-[10px] text-gray-400 group-hover:bg-white transition-colors">STR</div>
                                <div>
                                    <p className="font-bold text-black">Stripe Integration</p>
                                    <p className="text-xs text-green-600 font-medium">Connected & Active</p>
                                </div>
                            </div>
                            <button className="text-xs font-bold text-gray-400 hover:text-black">Configure</button>
                        </div>
                        <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-[10px] text-gray-400 group-hover:bg-white transition-colors">OAI</div>
                                <div>
                                    <p className="font-bold text-black">OpenAI GPT-4</p>
                                    <p className="text-xs text-green-600 font-medium">Quota: 85% Remaining</p>
                                </div>
                            </div>
                            <button className="text-xs font-bold text-gray-400 hover:text-black">Configure</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
