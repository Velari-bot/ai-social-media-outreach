import FeaturePage from "@/components/marketing/FeaturePage";
import { Filter, BarChart3, ShieldCheck, Globe } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Influencer Discovery Tool – Find Creators in Seconds | Verality",
    description: "The fastest influencer discovery tool. Filter by engagement, niche, and location. Find Instagram, TikTok, and YouTube creators instantly.",
    keywords: ["influencer discovery tool", "find influencers", "creator search engine", "influencer database"],
    alternates: {
        canonical: '/creator-discovery',
    },
};

export default function CreatorDiscoveryPage() {
    return (
        <FeaturePage
            title="Smart Influencer Discovery Tool"
            subtitle="The search engine for creators. Filter 200M+ profiles by engagement, location, and audience demographics."
            benefits={[
                {
                    title: "Deep Search Filters",
                    description: "Drill down to the exact creator you need. Filter by keywords in bio, engagement rate, follower count, and location.",
                    icon: <Filter className="w-7 h-7" />
                },
                {
                    title: "Multi-Platform Search",
                    description: "One search engine for Instagram, TikTok, and YouTube. Find cross-platform stars easily.",
                    icon: <Globe className="w-7 h-7" />
                },
                {
                    title: "Vetted Quality",
                    description: "Our AI automatically filters out inactive accounts and low-quality profiles, so you only pay for real influence.",
                    icon: <ShieldCheck className="w-7 h-7" />
                }
            ]}
            howItWorks={[
                {
                    step: 1,
                    title: "Select Platform",
                    description: "Choose between Instagram, TikTok, or YouTube to start your search."
                },
                {
                    step: 2,
                    title: "Apply Filters",
                    description: "Set your criteria for engagement, keywords, and audience size."
                },
                {
                    step: 3,
                    title: "Export Data",
                    description: "Instantly get a list of creators with their contact info and metrics."
                }
            ]}
            seoContent={{
                title: "The Ultimate Influencer Discovery Engine",
                content: (
                    <>
                        <p className="mb-4">
                            Finding the right influencers is the hardest part of any campaign. A manual search on Instagram can take hours, and you still won't know if their followers are real.
                        </p>
                        <p className="mb-4">
                            Verality's <strong>influencer discovery tool</strong> solves this by indexing millions of creator profiles. We analyze engagement rates, posting frequency, and audience sentiment to give you a clear picture of a creator's value.
                        </p>
                        <p>
                            Don't rely on expensive agencies or outdated databases. Use real-time data to discover rising stars before your competitors do.
                        </p>
                    </>
                )
            }}
        />
    );
}
