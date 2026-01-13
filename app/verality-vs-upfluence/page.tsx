import ComparisonPage from "@/components/marketing/ComparisonPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Upfluence Alternative - Cheaper & Better | Verality",
    description: "Upfluence helps big brands, but Verality helps you move fast. No annual contracts, modern UI, and better automation. Compare Verality vs Upfluence.",
    keywords: ["upfluence alternative", "verality vs upfluence", "influencer marketing platform comparison"],
    alternates: {
        canonical: '/verality-vs-upfluence',
    },
};

export default function UpfluenceComparisonPage() {
    return (
        <ComparisonPage
            competitorName="Upfluence"
            veralityAdvantage="Upfluence is legacy software that costs $20k/year with strict contracts. Verality is the modern, flexible alternative built for performance marketers who want ROI, not shelfware."
            comparisonRows={[
                { feature: "Contract Requirement", verality: "None (Monthly)", competitor: "Annual Only" },
                { feature: "Setup Fee", verality: "$0", competitor: "$500+" },
                { feature: "Creator Search", verality: "Unlimited", competitor: "Limited by Plan" },
                { feature: "Automated DMs", verality: true, competitor: false },
                { feature: "User Interface", verality: "Modern & Fast", competitor: "Dated & Complex" },
                { feature: "Affiliate Tracking", verality: true, competitor: true },
                { feature: "Real-time Support", verality: true, competitor: "Ticket Based" },
            ]}
            faq={[
                {
                    question: "Why is Upfluence so expensive?",
                    answer: "Upfluence targets enterprise corporations with large budgets. They have high overheads. Verality is a product-led company, meaning we focus on software efficiency rather than sales teams, passing the savings to you."
                },
                {
                    question: "Can I use Verality for large teams?",
                    answer: "Absolutely. Our agency plans support unlimited team members, workspaces, and whitelabel reporting, just like the enterprise tools, but with a better user experience."
                }
            ]}
        />
    );
}
