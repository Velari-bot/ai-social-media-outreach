import FeaturePage from "@/components/marketing/FeaturePage";
import { MessageCircle, ShieldAlert, Sliders, Inbox } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Influencer DM Automation – Auto-Send Messages | Verality",
    description: "Automate your Instagram and TikTok DMs. Send personalized messages at scale and track replies. The best tool for DM outreach.",
    keywords: ["influencer dm automation", "automated dms", "instagram dm bot", "tiktok auto dm"],
    alternates: {
        canonical: '/dm-automation',
    },
};

export default function DMAutomationPage() {
    return (
        <FeaturePage
            title="Automated DM Outreach for Creators"
            subtitle="Scale your DMs without getting banned. Send personalized, human-like messages to hundreds of creators daily."
            benefits={[
                {
                    title: "Safe Sending Limits",
                    description: "Our 'Human Mode' algorithm mimics real user behavior to keep your accounts safe. Scale up without getting flagged.",
                    icon: <ShieldAlert className="w-7 h-7" />
                },
                {
                    title: "Hyper-Personalization",
                    description: "Use dynamic variables like {FirstName}, {RecentPost}, and {City} to make every DM feel hand-typed.",
                    icon: <Sliders className="w-7 h-7" />
                },
                {
                    title: "Unified Inbox",
                    description: "Stop switching accounts. Reply to Instagram, TikTok, and Email conversations from a single dashboard.",
                    icon: <Inbox className="w-7 h-7" />
                }
            ]}
            howItWorks={[
                {
                    step: 1,
                    title: "Draft Template",
                    description: "Write your message using spin-syntax and variables to ensure uniqueness."
                },
                {
                    step: 2,
                    title: "Target Audience",
                    description: "Select a list of creators from your search results."
                },
                {
                    step: 3,
                    title: "Launch & Monitor",
                    description: "The system sends messages over time. You only step in when they reply."
                }
            ]}
            seoContent={{
                title: "Why automate influencer DMs?",
                content: (
                    <>
                        <p className="mb-4">
                            Direct Messages (DMs) have higher open rates than email, but they are impossible to scale manually. <strong>DM automation</strong> solves this volume problem.
                        </p>
                        <p className="mb-4">
                            However, most tools interact with APIs in a way that gets accounts banned. Verality uses a different approach—simulating human browsing behavior to perform actions safely.
                        </p>
                        <p>
                            By automating the first touchpoint, you can reach 10x more creators and only spend time talking to the ones interested in your offer.
                        </p>
                    </>
                )
            }}
        />
    );
}
