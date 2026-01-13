import ComparisonPage from "@/components/marketing/ComparisonPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "HypeAuditor Alternative - Unlimited Reports | Verality",
    description: "Don't pay per report. Verality gives you unlimited analysis and automated outreach. The best HypeAuditor alternative for 2026.",
    keywords: ["hypeauditor alternative", "verality vs hypeauditor", "influencer analytics tool"],
    alternates: {
        canonical: '/verality-vs-hypeauditor',
    },
};

export default function HypeAuditorComparisonPage() {
    return (
        <ComparisonPage
            competitorName="HypeAuditor"
            veralityAdvantage="HypeAuditor charges you based on 'credits' for every report you view. Verality gives you unlimited data access plus the tools to actually contact the influencers you find."
            comparisonRows={[
                { feature: "Data Access", verality: "Unlimited", competitor: "Credit Based" },
                { feature: "Creator Contact Info", verality: "Included", competitor: "Extra Cost" },
                { feature: "Outreach Automation", verality: true, competitor: "Basic Mailing Only" },
                { feature: "Fake Follower Check", verality: true, competitor: true },
                { feature: "Campaign CRM", verality: true, competitor: true },
                { feature: "Price", verality: "$$", competitor: "$$$$" },
            ]}
            faq={[
                {
                    question: "Does Verality catch fake followers?",
                    answer: "Yes. We use similar machine learning models to detect bot followers and engagement padding, ensuring you don't waste budget on fake influencers."
                },
                {
                    question: "Can I try it for free?",
                    answer: "Yes, you can start a free trial with Verality to see the data quality yourself. No credit card required."
                }
            ]}
        />
    );
}
