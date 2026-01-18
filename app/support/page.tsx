"use client";

import Navbar from "@/components/Navbar";
import { Mail, MessageCircle, FileQuestion, ArrowRight } from "lucide-react";

export default function SupportPage() {
    return (
        <main className="min-h-screen bg-[#F3F1EB] font-sans">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-20">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
                        How can we help?
                    </h1>
                    <p className="text-xl text-gray-500 font-medium">
                        Get support for Verality AI. We're here to help you grow your outreach.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {/* Email Support */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl hover:shadow-2xl transition-all group">
                        <div className="h-14 w-14 bg-black rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Mail className="text-white h-7 w-7" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Email Support</h3>
                        <p className="text-gray-500 mb-6 min-h-[48px]">
                            Direct access to our engineering team for complex issues.
                        </p>
                        <a href="mailto:benderaiden826@gmail.com" className="text-black font-black flex items-center hover:gap-2 transition-all">
                            benderaiden826@gmail.com <ArrowRight className="h-4 w-4 ml-1" />
                        </a>
                    </div>

                    {/* Live Chat */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl hover:shadow-2xl transition-all group">
                        <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <MessageCircle className="text-white h-7 w-7" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Live Chat</h3>
                        <p className="text-gray-500 mb-6 min-h-[48px]">
                            Chat with us during business hours (9am - 5pm EST).
                        </p>
                        <button className="text-blue-600 font-black flex items-center hover:gap-2 transition-all" onClick={() => {/* Trigger Intercom or similar if available */ }}>
                            Start Chat <ArrowRight className="h-4 w-4 ml-1" />
                        </button>
                    </div>

                    {/* Documentation */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl hover:shadow-2xl transition-all group">
                        <div className="h-14 w-14 bg-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <FileQuestion className="text-white h-7 w-7" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Guides</h3>
                        <p className="text-gray-500 mb-6 min-h-[48px]">
                            Step-by-step guides on how to use Verality effectively.
                        </p>
                        <a href="/guides/ultimate-guide-to-ai-outreach" className="text-purple-600 font-black flex items-center hover:gap-2 transition-all">
                            View Guides <ArrowRight className="h-4 w-4 ml-1" />
                        </a>
                    </div>
                </div>

                <div className="mt-20 max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-gray-200 text-center">
                    <h3 className="font-bold text-lg mb-2">Frequently Asked Questions</h3>
                    <div className="text-left space-y-4 mt-6">
                        <div>
                            <h4 className="font-bold text-gray-900">How do I reset my password?</h4>
                            <p className="text-sm text-gray-500">You can reset your password from the login page by clicking "Forgot Password".</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900">Where can I see my invoices?</h4>
                            <p className="text-sm text-gray-500">Go to Settings &gt; Billing to view and download your past invoices.</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
