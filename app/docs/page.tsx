
"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-[#F3F1EB] flex flex-col font-sans">
            <Navbar />

            <main className="flex-grow pt-32 pb-20 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto space-y-12">

                    {/* Header */}
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl sm:text-5xl font-black text-black tracking-tight">
                            Documentation &amp; Setup
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            A comprehensive guide to configuring Verality, connecting your accounts, and launching your first outreach campaign.
                        </p>
                    </div>

                    <div className="w-full h-px bg-gray-200" />

                    {/* Table of Contents */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="#gmail-connection" className="text-blue-600 hover:text-blue-800 font-medium underline">
                                    1. Connecting Gmail (Google OAuth)
                                </a>
                            </li>
                            <li>
                                <a href="#creating-campaigns" className="text-blue-600 hover:text-blue-800 font-medium underline">
                                    2. Creating Creator Requests
                                </a>
                            </li>
                            <li>
                                <a href="#managing-replies" className="text-blue-600 hover:text-blue-800 font-medium underline">
                                    3. Managing Inbox &amp; Replies
                                </a>
                            </li>
                            <li>
                                <a href="#faq" className="text-blue-600 hover:text-blue-800 font-medium underline">
                                    4. Frequently Asked Questions
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Section 1: Gmail Connection */}
                    <section id="gmail-connection" className="space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white font-bold text-sm">1</span>
                            <h2 className="text-3xl font-bold text-black">Connecting Gmail</h2>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm prose max-w-none text-gray-700">
                            <p>
                                To allow Verality to send emails on your behalf, you need to connect your Gmail account securely via Google OAuth.
                                Because Verality interacts with sensitive scopes (sending emails, reading replies), Google requires a verified connection process.
                            </p>

                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 my-4 text-sm text-yellow-800">
                                <strong>Important Note:</strong> The app is currently in &quot;Testing&quot; mode with Google. You will see a &quot;Google hasn&apos;t verified this app&quot; warning. This is expected and safe for internal use.
                            </div>

                            <h4 className="text-xl font-bold text-black mt-6 mb-3">Step-by-Step Instructions</h4>

                            <ol className="list-decimal pl-5 space-y-4">
                                <li>
                                    Go to the <strong>Settings</strong> page via the user dashboard.
                                </li>
                                <li>
                                    Click the <strong>Connect Gmail</strong> button.
                                </li>
                                <li>
                                    You will be redirected to Google&apos;s sign-in page. Select the Gmail account you wish to use for outreach.
                                </li>
                            </ol>

                            <div className="mt-8 space-y-2">
                                <h5 className="font-bold text-black">Handling the &quot;Go to Verality (unsafe)&quot; Screen</h5>
                                <p className="text-sm">Since the app is unverified, you will likely see a warning screen. You must bypass this to proceed.</p>
                            </div>

                            {/* Step 1 Image */}
                            <div className="mt-6">
                                <p className="font-bold mb-2">1. When you see the warning, click the &quot;Advanced&quot; link:</p>
                                <div className="relative w-full rounded-xl overflow-hidden shadow-lg border border-gray-200">
                                    <Image
                                        src="/Click advanced.png"
                                        alt="Click Advanced on Google Warning"
                                        width={800}
                                        height={500}
                                        className="w-full h-auto"
                                    />
                                </div>
                            </div>

                            {/* Step 2 Image */}
                            <div className="mt-8">
                                <p className="font-bold mb-2">2. Then, click &quot;Go to verality.io (unsafe)&quot; at the bottom:</p>
                                <div className="relative w-full rounded-xl overflow-hidden shadow-lg border border-gray-200">
                                    <Image
                                        src="/Shown advanced.png"
                                        alt="Click Go to Verality Unsafe"
                                        width={800}
                                        height={500}
                                        className="w-full h-auto"
                                    />
                                </div>
                            </div>

                            {/* Step 3 Image */}
                            <div className="mt-8">
                                <p className="font-bold mb-2">3. Finally, ensure you CHECK ALL BOXES to grant necessary permissions:</p>
                                <div className="relative w-full rounded-xl overflow-hidden shadow-lg border border-gray-200">
                                    <Image
                                        src="/Must select.png"
                                        alt="Check all permission boxes"
                                        width={800}
                                        height={500}
                                        className="w-full h-auto"
                                    />
                                </div>
                                <p className="text-sm text-red-600 mt-2 font-medium">If you do not check all boxes (Send, Read, Manage), the connection will fail.</p>
                            </div>

                            <p className="mt-6">
                                Once authorized, you will be redirected back to Verality, and your Settings page should show &quot;Connected&quot;.
                            </p>
                        </div>
                    </section>

                    {/* Section 2: Campaigns */}
                    <section id="creating-campaigns" className="space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white font-bold text-sm">2</span>
                            <h2 className="text-3xl font-bold text-black">Finding Creators</h2>
                        </div>
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm prose max-w-none text-gray-700">
                            <p>
                                Verality uses advanced AI to find creators that match your niche.
                            </p>
                            <ul className="list-disc pl-5 mt-4 space-y-2">
                                <li>Navigate to <strong>Creator Request</strong> in the dashboard.</li>
                                <li>Enter a descriptive name for your search (e.g., &quot;Tech YouTubers &lt; 100k&quot;).</li>
                                <li>Select the platforms you want to target (YouTube, Instagram, TikTok).</li>
                                <li>In the description, be specific about the niche (e.g., &quot;Gaming channels that focus on Strategy games&quot;).</li>
                            </ul>
                            <p className="mt-4">
                                The system will automatically scan millions of creators, filter them by your criteria, and enrich their contact data.
                            </p>
                        </div>
                    </section>

                    {/* Section 3: Inbox */}
                    <section id="managing-replies" className="space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white font-bold text-sm">3</span>
                            <h2 className="text-3xl font-bold text-black">Managing Replies</h2>
                        </div>
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm prose text-gray-700">
                            <p>
                                When a creator replies to your automated email, it will appear in your <strong>Inbox</strong>.
                            </p>
                            <p className="mt-2">
                                The AI Monitor checks your inbox every hour. It identifies:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Positive replies (Interested)</li>
                                <li>Questions</li>
                                <li>Rejections/Unsubscribes</li>
                            </ul>
                            <p className="mt-4">
                                You can reply directly from the Verality Dashboard without logging into Gmail. The AI can also draft suggested replies for you based on the context.
                            </p>
                        </div>
                    </section>

                    {/* Section 4: FAQ */}
                    <section id="faq" className="space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white font-bold text-sm">4</span>
                            <h2 className="text-3xl font-bold text-black">FAQ</h2>
                        </div>
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">

                            <div>
                                <h4 className="font-bold text-black text-lg mb-2">Why did my Gmail connection disconnect?</h4>
                                <p className="text-gray-600">Google security tokens expire if not used, or if the password is changed. Simply go to Settings and reconnect if this happens.</p>
                            </div>

                            <div>
                                <h4 className="font-bold text-black text-lg mb-2">How many emails can I send per day?</h4>
                                <p className="text-gray-600">
                                    Your daily limit is set based on your plan (default 100/day for new accounts). We recommend warming up your email gradually to avoid spam filters.
                                </p>
                            </div>

                            <div>
                                <h4 className="font-bold text-black text-lg mb-2">Is the data real time?</h4>
                                <p className="text-gray-600">Yes, we fetch creator data live via our partner APIs (Influencer Club) to ensure follower counts and emails are accurate.</p>
                            </div>

                        </div>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
}
