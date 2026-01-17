
"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Image from "next/image";

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-[#F3F1EB] flex flex-col font-sans">
            <Navbar />

            <main className="flex-grow pt-32 pb-20 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12">

                    {/* Sidebar Navigation */}
                    <aside className="lg:w-64 flex-shrink-0">
                        <div className="sticky top-32 space-y-8">
                            <div>
                                <h3 className="font-bold text-gray-900 mb-4 px-2">Getting Started</h3>
                                <div className="space-y-1">
                                    <a href="#introduction" className="block px-2 py-1.5 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors">Introduction</a>
                                    <a href="#gmail-connection" className="block px-2 py-1.5 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors">Connecting Gmail</a>
                                    <a href="#account-setup" className="block px-2 py-1.5 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors">Account Setup</a>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-900 mb-4 px-2">Core Features</h3>
                                <div className="space-y-1">
                                    <a href="#discovery" className="block px-2 py-1.5 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors">Discovery Engine</a>
                                    <a href="#campaigns" className="block px-2 py-1.5 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors">Campaigns & Sequencing</a>
                                    <a href="#inbox" className="block px-2 py-1.5 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors">Unified Inbox</a>
                                    <a href="#crm" className="block px-2 py-1.5 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors">Sales CRM</a>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-900 mb-4 px-2">Support</h3>
                                <div className="space-y-1">
                                    <a href="#faq" className="block px-2 py-1.5 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors">FAQ & Troubleshooting</a>
                                    <a href="#billing" className="block px-2 py-1.5 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors">Billing & Plans</a>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <div className="flex-grow space-y-16 lg:pt-2">

                        {/* Introduction */}
                        <section id="introduction" className="scroll-mt-32">
                            <h2 className="text-3xl font-black text-gray-900 mb-6">Introduction to Verality</h2>
                            <div className="prose prose-lg max-w-none text-gray-600">
                                <p className="leading-relaxed">
                                    Verality is the all-in-one operating system for creator outreach. We replace your fragmented stack of tools (search, email finding, sequencing, and CRM) with a single, unified platform designed to help you close more deals in less time.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8 not-prose">
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 font-bold">1</div>
                                        <h4 className="font-bold text-gray-900 mb-2">Find Creators</h4>
                                        <p className="text-sm text-gray-500">Search millions of profiles with AI filters.</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4 font-bold">2</div>
                                        <h4 className="font-bold text-gray-900 mb-2">Automate Outreach</h4>
                                        <p className="text-sm text-gray-500">Send personalized drip sequences.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="w-full h-px bg-gray-200" />

                        {/* Gmail Connection (Preserved & Enhanced) */}
                        <section id="gmail-connection" className="scroll-mt-32">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full">Step 1</div>
                                <h2 className="text-3xl font-black text-gray-900">Connecting Gmail</h2>
                            </div>

                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm prose max-w-none text-gray-700">
                                <p>
                                    To allow Verality to send emails on your behalf, you need to connect your Gmail account securely via Google OAuth.
                                    Because Verality interacts with sensitive scopes (sending emails, reading replies), Google requires a verified connection process.
                                </p>

                                <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 my-6 flex gap-4 items-start">
                                    <div className="text-2xl">⚠️</div>
                                    <div>
                                        <div className="font-bold text-amber-900 mb-1">Testing Mode Notice</div>
                                        <div className="text-sm text-amber-800 leading-relaxed">
                                            The app is currently in "Testing" mode with Google. You will see a "Google hasn't verified this app" warning. This is expected and safe for internal use.
                                        </div>
                                    </div>
                                </div>

                                <h4 className="text-xl font-bold text-black mt-8 mb-4">Step-by-Step Instructions</h4>

                                <ol className="list-decimal pl-5 space-y-4 marker:text-gray-400 marker:font-bold">
                                    <li>Navigate to <strong>Settings</strong> &gt; <strong>Integrations</strong>.</li>
                                    <li>Click the <strong>Connect Gmail</strong> button.</li>
                                    <li>Select your outreach email account.</li>
                                    <li>
                                        <strong>Crucial Step:</strong> When you see the warning screen:
                                        <ul className="list-disc pl-5 mt-2 space-y-2 text-sm text-gray-600">
                                            <li>Click "Advanced"</li>
                                            <li>Click "Go to verality.io (unsafe)" at the bottom</li>
                                        </ul>
                                    </li>
                                    <li>
                                        <strong>Permissions:</strong> Check ALL boxes (Send, Read, Manage). If you miss one, the connection will fail.
                                    </li>
                                </ol>

                                {/* Images Grid */}
                                <div className="grid md:grid-cols-2 gap-6 mt-8 not-prose">
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-400 uppercase">1. Click Advanced</p>
                                        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-md">
                                            <Image src="/Click advanced.png" alt="Click Advanced" width={400} height={300} className="w-full" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-400 uppercase">2. Select Permissions</p>
                                        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-md">
                                            <Image src="/Must select.png" alt="Select Permissions" width={400} height={300} className="w-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="w-full h-px bg-gray-200" />

                        {/* Discovery Engine */}
                        <section id="discovery" className="scroll-mt-32">
                            <h2 className="text-3xl font-black text-gray-900 mb-6">Discovery Engine</h2>
                            <div className="prose prose-lg max-w-none text-gray-600">
                                <p>
                                    Stop wasting hours scrolling TikTok. Our Discovery Engine lets you filter 200M+ creators to find your perfect match in seconds.
                                </p>

                                <div className="space-y-8 mt-8">
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-lg">Search Filters</h4>
                                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 not-prose">
                                            <li className="bg-white p-4 rounded-xl border border-gray-100 text-sm font-medium flex items-center gap-3">
                                                <span className="w-2 h-2 bg-pink-500 rounded-full" /> Niche & Keywords
                                            </li>
                                            <li className="bg-white p-4 rounded-xl border border-gray-100 text-sm font-medium flex items-center gap-3">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full" /> Follower Count (Min/Max)
                                            </li>
                                            <li className="bg-white p-4 rounded-xl border border-gray-100 text-sm font-medium flex items-center gap-3">
                                                <span className="w-2 h-2 bg-purple-500 rounded-full" /> Engagement Rate
                                            </li>
                                            <li className="bg-white p-4 rounded-xl border border-gray-100 text-sm font-medium flex items-center gap-3">
                                                <span className="w-2 h-2 bg-green-500 rounded-full" /> Location / Country
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-gray-900 text-lg">Understanding "Credits"</h4>
                                        <p className="text-sm">
                                            Searching is free. You only use a "Credit" when you choose to <strong>Reveal Email</strong> or <strong>Add to Campaign</strong>. This ensures you only pay for data you actually use.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="w-full h-px bg-gray-200" />

                        {/* Campaigns */}
                        <section id="campaigns" className="scroll-mt-32">
                            <h2 className="text-3xl font-black text-gray-900 mb-6">Campaigns & Sequencing</h2>
                            <div className="prose prose-lg max-w-none text-gray-600">
                                <p>
                                    Automate your follow-ups without sounding like a robot. Verality supports multi-step email sequences that stop automatically when a creator replies.
                                </p>

                                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden my-8 not-prose">
                                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 font-bold text-xs uppercase text-gray-500">
                                        Campaign Structure Example
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 w-8 flex flex-col items-center">
                                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">1</div>
                                                <div className="w-0.5 h-full bg-gray-100 my-2" />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-gray-900">Initial Outreach (Day 0)</h5>
                                                <p className="text-sm text-gray-500">Keep it short. Mention their specific content. Value first.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 w-8 flex flex-col items-center">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm">2</div>
                                                <div className="w-0.5 h-full bg-gray-100 my-2" />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-gray-900">Follow Up (Day 3)</h5>
                                                <p className="text-sm text-gray-500">"Just floating this to the top of your inbox..."</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 w-8 flex flex-col items-center">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm">3</div>
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-gray-900">Final Bump (Day 7)</h5>
                                                <p className="text-sm text-gray-500">"I'll assume you're busy. Last message from me!"</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="w-full h-px bg-gray-200" />

                        {/* Inbox & CRM */}
                        <section id="inbox" className="scroll-mt-32">
                            <h2 className="text-3xl font-black text-gray-900 mb-6">Unified Inbox & CRM</h2>
                            <div className="prose prose-lg max-w-none text-gray-600">
                                <p>
                                    Never lose a deal in a messy inbox again. Every reply from a creator is automatically pulled into Verality and organized by campaign.
                                </p>
                                <ul className="mt-4 space-y-2">
                                    <li><strong>Status Tracking:</strong> Custom Kanban board (Interested, Negotiating, Signed, Paid).</li>
                                    <li><strong>Team Notes:</strong> Mention teammates with @username to collaborate on a deal.</li>
                                    <li><strong>Quick Replies:</strong> Use AI-generated response suggestions to reply 10x faster.</li>
                                </ul>
                            </div>
                        </section>

                        <div className="w-full h-px bg-gray-200" />

                        {/* FAQ */}
                        <section id="faq" className="scroll-mt-32">
                            <h2 className="text-3xl font-black text-gray-900 mb-6">Frequently Asked Questions</h2>
                            <div className="grid gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-gray-100">
                                    <h4 className="font-bold text-black text-lg mb-2">Why did my Gmail disconnect?</h4>
                                    <p className="text-gray-600">Security tokens expire if unused or if you change your password. Reconnect in Settings.</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-gray-100">
                                    <h4 className="font-bold text-black text-lg mb-2">Daily sending limits?</h4>
                                    <p className="text-gray-600">We cap new accounts at 100 emails/day to protect your domain reputation. Contact support to increase this.</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-gray-100">
                                    <h4 className="font-bold text-black text-lg mb-2">Can I export data?</h4>
                                    <p className="text-gray-600">Yes, you can export all creditor data and campaign stats to CSV for use in Excel or other tools.</p>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </main>
        </div>
    );
}
