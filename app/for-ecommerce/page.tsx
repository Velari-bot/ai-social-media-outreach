import FeaturePage from "@/components/marketing/FeaturePage";
import { ShoppingBag, Gift, BarChart4, Truck } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Influencer Marketing Automation for Ecommerce | Verality",
    description: "Automate product seeding and affiliate recruitment for your ecommerce brand. Drive sales with UGC and influencer partnerships.",
    keywords: ["ecommerce influencer marketing", "shopify influencer tool", "product seeding automation"],
    alternates: {
        canonical: '/for-ecommerce',
    },
};

export default function EcommercePage() {
    return (
        <FeaturePage
            title="Drive Ecommerce Sales with Creators"
            subtitle="Automate product seeding and affiliate recruitment. Turn influencers into your best sales channel."
            benefits={[
                {
                    title: "Product Seeding at Scale",
                    description: "Identify 500+ micro-influencers and automate the 'Can I send you a free gift?' outreach sequence.",
                    icon: <Gift className="w-7 h-7" />
                },
                {
                    title: "UGC Generation",
                    description: "Get a flood of authentic user-generated content for your ads without paying agency production fees.",
                    icon: <ShoppingBag className="w-7 h-7" />
                },
                {
                    title: "Affiliate Recruitment",
                    description: "Find creators who are already fans of your niche and invite them to your ambassador program automatically.",
                    icon: <Truck className="w-7 h-7" />
                }
            ]}
            howItWorks={[
                {
                    step: 1,
                    title: "Find Brand Fits",
                    description: "Search for creators posting about products like yours."
                },
                {
                    step: 2,
                    title: "Offer Gift",
                    description: "Send a personalized DM offering free product in exchange for a post."
                },
                {
                    step: 3,
                    title: "Track Sales",
                    description: "Monitor which creators drive traffic and conversions."
                }
            ]}
            seoContent={{
                title: "The Seeding Strategy for Ecommerce",
                content: (
                    <>
                        <p className="mb-4">
                            For DTC brands, <strong>product seeding</strong> (gifting) is the most cost-effective way to grow. But emailing creators one by one is slow.
                        </p>
                        <p className="mb-4">
                            Verality allows you to run "seeding campaigns" on autopilot. You set the criteria (e.g., "Skincare influencers in USA with 10k-50k followers"), and our AI handles the introduction.
                        </p>
                        <p>
                            Get more UGC, more authentic shoutouts, and lower your CAC by leveraging the power of micro-influencers.
                        </p>
                    </>
                )
            }}
        />
    );
}
