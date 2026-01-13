import ComparisonPage from "@/components/marketing/ComparisonPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Best Influencer Outreach Software 2026 - Top Rated | Verality",
    description: "Comparing the best influencer outreach tools. See why Verality is ranked #1 for automation, data accuracy, and price.",
    keywords: ["best influencer outreach software", "top influencer marketing tools", "influencer outreach tool reviews"],
    alternates: {
        canonical: '/best-influencer-outreach-software',
    },
};

export default function BestSoftwarePage() {
    return (
        <ComparisonPage
            competitorName="Traditional Tools"
            veralityAdvantage="Most influencer software was built in 2015 for large agencies. Verality is the only AI-native platform built for modern, high-volume automated outreach."
            comparisonRows={[
                { feature: "AI-Powered Search", verality: true, competitor: "Basic Filters" },
                { feature: "Personal Email Finder", verality: "99% Accuracy", competitor: "Low Accuracy" },
                { feature: "Automated DM Sequences", verality: true, competitor: false },
                { feature: "Smart Follow-ups", verality: true, competitor: false },
                { feature: "Modern Interface", verality: true, competitor: false },
                { feature: "Transparent Pricing", verality: true, competitor: "Hidden / Demo Only" },
            ]}
            faq={[
                {
                    question: "What makes Verality the best outreach software?",
                    answer: "Speed and Automation. While other tools act as static phonebooks, Verality is an active sales robot. It doesn't just give you a number; it makes the call for you (metaphorically speaking—by sending DMs and Emails)."
                },
                {
                    question: "Is it suitable for small brands?",
                    answer: "Yes! In fact, it was built for lean teams who need to punch above their weight class. You can run an enterprise-grade influencer program with just one person using Verality."
                }
            ]}
        />
    );
}
