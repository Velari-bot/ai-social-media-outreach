import ComparisonPage from "@/components/marketing/ComparisonPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Modash Alternative - Verality vs Modash Comparison | Verality",
    description: "Looking for a Modash alternative? Verality includes automated outreach (Email & DM) and a CRM for half the price. Compare Verality vs Modash.",
    keywords: ["modash alternative", "verality vs modash", "best influencer search tool"],
    alternates: {
        canonical: '/verality-vs-modash',
    },
};

export default function ModashComparisonPage() {
    return (
        <ComparisonPage
            competitorName="Modash"
            veralityAdvantage="Modash is great for search, but that's where it stops. Verality is the all-in-one platform that finds creators AND automates the outreach (Emails + DMs) to actually get them to reply."
            comparisonRows={[
                { feature: "Creator Database Size", verality: "250M+", competitor: "250M+" },
                { feature: "Enriched Personal Emails", verality: true, competitor: true },
                { feature: "Automated Email Sequences", verality: true, competitor: false },
                { feature: "Automated DM Sequences", verality: true, competitor: false },
                { feature: "Built-in CRM & Pipeline", verality: true, competitor: false },
                { feature: "Pricing Model", verality: "Monthly, No Contract", competitor: "Monthly" },
                { feature: "Starting Price", verality: "$99/mo", competitor: "$299/mo" },
            ]}
            faq={[
                {
                    question: "How is Verality different from Modash?",
                    answer: "Modash is primarily a search engine. They don't help you contact the influencers efficiently. Verality includes the search engine BUT connects it directly to an automated outreach system, so you can contact 100 creators in the time it takes to find 1 on Modash."
                },
                {
                    question: "Is Verality's data as good as Modash?",
                    answer: "Yes. we index the same major social platforms (Instagram, TikTok, YouTube) and provide similar depth of data including fake follower detection and audience demographics."
                },
                {
                    question: "Do I need to migrate my data?",
                    answer: "We offer a free concierge migration service. Just send us your Modash export CSV, and we will upload it to your Verality CRM instantly."
                }
            ]}
        />
    );
}
