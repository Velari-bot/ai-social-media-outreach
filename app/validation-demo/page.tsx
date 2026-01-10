
"use client";

import { useState } from 'react';
import Navbar from "@/components/Navbar";
import PreRunChecklist from "@/components/PreRunChecklist";
import { CampaignContext } from "@/lib/services/campaign-validator";

export default function ValidationDemoPage() {
    const [showChecklist, setShowChecklist] = useState(false);
    const [useBadData, setUseBadData] = useState(false);

    // Mock Context
    const context: CampaignContext = {
        campaignId: "camp_123",
        userId: "demo_user_123", // In real app, this would be actual user ID
        name: "Summer Fashion Outreach",
        platform: "instagram",
        creatorIds: ["creator_1", "creator_2", "creator_3", "creator_4"],
        emailTemplate: {
            subject: "Collab Opportunity",
            body: useBadData ? "Collab?" : "Hi {{name}}, we strictly adhere to all guidelines. Would you like to unsubscribe? Let us know.",
            offer: "Free product",
            cta: "Reply 'YES'"
        },
        schedule: {
            dailyLimit: 50,
            timezone: "America/New_York",
            startTime: "09:00"
        },
        brandContext: "Sustainable fashion brand"
    };

    if (useBadData) {
        // Intentionally break things
        context.name = ""; // Missing name
        context.emailTemplate.body = "Urgent $$$ guarantee!"; // Bad words, no unsub
        context.schedule.dailyLimit = 0; // Invalid limit
        context.creatorIds = []; // No creators
    }

    return (
        <main className="min-h-screen bg-[#F3F1EB] pb-20">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 pt-32">
                <h1 className="text-3xl font-black text-[#1A1A1A] mb-2">Campaign Validation Demo</h1>
                <p className="text-gray-500 mb-8">Test the pre-run validation gatekeeper before launching an outreach campaign.</p>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 text-black">

                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Campaign Summary</h2>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-600 flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={useBadData}
                                    onChange={(e) => setUseBadData(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                />
                                Simulate Validation Errors
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
                        <div>
                            <label className="block text-gray-400 font-bold text-xs uppercase mb-1">Campaign Name</label>
                            <div className="font-medium">{context.name || <span className="text-red-500 italic">Missing</span>}</div>
                        </div>
                        <div>
                            <label className="block text-gray-400 font-bold text-xs uppercase mb-1">Platform</label>
                            <div className="font-medium capitalize">{context.platform}</div>
                        </div>
                        <div>
                            <label className="block text-gray-400 font-bold text-xs uppercase mb-1">Recipients</label>
                            <div className="font-medium">{context.creatorIds.length} creators selected</div>
                        </div>
                        <div>
                            <label className="block text-gray-400 font-bold text-xs uppercase mb-1">Daily Limit</label>
                            <div className="font-medium">{context.schedule.dailyLimit} emails/day</div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-100">
                        <button
                            onClick={() => setShowChecklist(true)}
                            className="px-8 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/20 flex items-center gap-2"
                        >
                            <span>Validate & Launch</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>

            </div>

            {showChecklist && (
                <PreRunChecklist
                    context={context}
                    onCancel={() => setShowChecklist(false)}
                    onValidationComplete={(res) => {
                        alert("Campaign Launched! (Simulated)");
                        setShowChecklist(false);
                    }}
                />
            )}

        </main>
    );
}
