import FeaturePage from "@/components/marketing/FeaturePage";
import { Rocket, Zap, TrendingUp, Megaphone } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Startup Growth Hacks - Automate Creator Outreach | Verality",
    description: "Bootstrap your distribution. Find and contact 1,000s of potential users and creators without a marketing team.",
    keywords: ["startup marketing automation", "growth hacking tools", "creator outreach for startups"],
    alternates: {
        canonical: '/for-startups',
    },
};

export default function StartupsPage() {
    return (
        <FeaturePage
            title="Hack Your Startup's Growth"
            subtitle="The ultimate distribution tool for founders. Get your first 1,000 customers by leveraging other people's audiences."
            benefits={[
                {
                    title: "Zero to One",
                    description: "Don't have an audience? Borrow someone else's. Partner with creators who already won the trust of your target market.",
                    icon: <Rocket className="w-7 h-7" />
                },
                {
                    title: "Cost-Effective",
                    description: "Cheaper than Facebook Ads. Pay for performance or product exchange instead of burning cash on CPMs.",
                    icon: <Zap className="w-7 h-7" />
                },
                {
                    title: "Viral Loops",
                    description: "Coordinate a 'launch day' where 50 micro-influencers post about you at the same time.",
                    icon: <Megaphone className="w-7 h-7" />
                }
            ]}
            howItWorks={[
                {
                    step: 1,
                    title: "Find Early Adopters",
                    description: "Search for people tweeting about your problem space."
                },
                {
                    step: 2,
                    title: "Personal Outreach",
                    description: "Use AI to write personalized notes asking for feedback."
                },
                {
                    step: 3,
                    title: "Iterate",
                    description: "Use their feedback to improve product-market fit."
                }
            ]}
            seoContent={{
                title: "Distribution for Early Stage Startups",
                content: (
                    <>
                        <p className="mb-4">
                            "Build it and they will come" is a lie. You need distribution.
                        </p>
                        <p className="mb-4">
                            Verality gives startups the power of a 10-person marketing team. You can scrape leads, find emails, and automate cold outreach in minutes.
                        </p>
                        <p>
                            Whether you are looking for beta testers, affiliates, or just buzz—automating your outreach is the highest leverage activity a founder can do.
                        </p>
                    </>
                )
            }}
        />
    );
}
