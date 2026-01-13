import FeaturePage from "@/components/marketing/FeaturePage";
import { Laptop, Star, Video, Rocket } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "B2B Influencer Outreach for SaaS | Verality",
    description: "Scale your SaaS with influencer marketing. Find tech creators to review your software and drive demos.",
    keywords: ["saas influencer marketing", "b2b creator outreach", "software marketing automation"],
    alternates: {
        canonical: '/for-saas',
    },
};

export default function SaasPage() {
    return (
        <FeaturePage
            title="Grow Your SaaS with Tech Creators"
            subtitle="Get your software in front of thousands of potential users. Automate outreach to tech reviewers and thought leaders."
            benefits={[
                {
                    title: "Find Tech Influencers",
                    description: "Discover creators who specialize in software reviews, productivity hacks, and coding tutorials.",
                    icon: <Laptop className="w-7 h-7" />
                },
                {
                    title: "Drive Demos & Signups",
                    description: "Use creators to explain your complex product. Video reviews convert better than static landing pages.",
                    icon: <Video className="w-7 h-7" />
                },
                {
                    title: "Social Proof",
                    description: "Get trusted voices in your industry to validate your tool. Build authority overnight.",
                    icon: <Star className="w-7 h-7" />
                }
            ]}
            howItWorks={[
                {
                    step: 1,
                    title: "Identify Niche",
                    description: "Search for 'AI tools', 'Design software', or 'Marketing tech'."
                },
                {
                    step: 2,
                    title: "Send Brief",
                    description: "Invite creators to try your premium plan for free."
                },
                {
                    step: 3,
                    title: "Boost",
                    description: "Whitelabel their best content and run it as ads."
                }
            ]}
            seoContent={{
                title: "Influencer Marketing for B2B SaaS",
                content: (
                    <>
                        <p className="mb-4">
                            SaaS growth is getting harder with rising ad costs. <strong>B2B influencer marketing</strong> is the untapped channel.
                        </p>
                        <p className="mb-4">
                            Verality helps you find the "Tech Twitter" and "Productivity YouTube" stars who influence your buyers. Instead of cold outbound sales, get warm inbound leads from creator referrals.
                        </p>
                        <p>
                            Perfect for launching on Product Hunt or scaling your PLG motion.
                        </p>
                    </>
                )
            }}
        />
    );
}
