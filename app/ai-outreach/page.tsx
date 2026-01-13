import FeaturePage from "@/components/marketing/FeaturePage";
import { Search, Mail, Send, Zap } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "AI Outreach Tool - Automate Social Media DM & Email | Verality",
    description: "Verality is the best AI outreach tool for finding creators and sending DMs/emails automatically. Scale your campaigns today.",
    keywords: ["ai outreach tool", "ai social media outreach", "automated outreach"],
    alternates: {
        canonical: '/ai-outreach',
    },
};

export default function AIOutreachPage() {
    return (
        <FeaturePage
            title="The #1 AI Outreach Tool for Creators"
            subtitle="Stop manual DMs. Use AI to find creators, get their emails, and send personalized messages at scale."
            benefits={[
                {
                    title: "Instant Discovery",
                    description: "Don't waste hours scrolling. Our AI finds thousands of creators that match your exact niche criteria in seconds.",
                    icon: <Search className="w-7 h-7" />
                },
                {
                    title: "Email Enrichment",
                    description: "We automatically find confirmed, personal email addresses for every creator. No more 'info@' generic inboxes.",
                    icon: <Mail className="w-7 h-7" />
                },
                {
                    title: "Intelligent Automation",
                    description: "Send personalized DMs and emails. The sequence automatically stops when a creator replies, ensuring a human touch.",
                    icon: <Send className="w-7 h-7" />
                }
            ]}
            howItWorks={[
                {
                    step: 1,
                    title: "Define Ideal Creator",
                    description: "Set filters for follower count, engagement rate, location, and niche keywords."
                },
                {
                    step: 2,
                    title: "AI Finds Leads",
                    description: "Verality scans millions of profiles to build your verified prospect list instantly."
                },
                {
                    step: 3,
                    title: "Launch Campaign",
                    description: "Your outreach runs on autopilot while you sleep. Wake up to warm leads."
                }
            ]}
            seoContent={{
                title: "Why use an AI Outreach Tool?",
                content: (
                    <>
                        <p className="mb-4">
                            An <strong>AI outreach tool</strong> is essential for modern influencer marketing. Traditionally, brands had to hire teams of virtual assistants to manually find influencers, guess their email addresses, and copy-paste messages one by one. This process is slow, expensive, and unscalable.
                        </p>
                        <p className="mb-4">
                            Verality changes the game by automating every step of this funnel. From <strong>influencer discovery</strong> to <strong>email finding</strong> and <strong>outreach automation</strong>, our platform acts as an infinite workforce that works 24/7.
                        </p>
                        <p>
                            Whether you are an agency managing 50 clients or a startup trying to get your first 100 affiliates, using an AI-powered tool ensures consistent, high-volume outreach without sacrificing personalization.
                        </p>
                    </>
                )
            }}
        />
    );
}
