import FeaturePage from "@/components/marketing/FeaturePage";
import { UserCheck, Database, Download, MailCheck } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Influencer Email Finder - Get Personal Emails | Verality",
    description: "Find verified personal emails for Instagram and TikTok influencers. Stop sending DMs to general inboxes. Get 99% accuracy.",
    keywords: ["influencer email finder", "find creator emails", "email enrichment tool", "tiktok email finder"],
    alternates: {
        canonical: '/email-finder',
    },
};

export default function EmailFinderPage() {
    return (
        <FeaturePage
            title="The Most Accurate Influencer Email Finder"
            subtitle="Stop guessing. Get verified personal emails for Instagram, TikTok, and YouTube creators directly from our database."
            benefits={[
                {
                    title: "Personal Emails Only",
                    description: "We filter out generic agency emails like 'info@' or 'mgmt@'. Reach the creator directly on their personal smartphone.",
                    icon: <UserCheck className="w-7 h-7" />
                },
                {
                    title: "Waterfall Technology",
                    description: "We cross-reference 10+ data sources to find emails even if they aren't public in the bio. 30% higher find rate than competitors.",
                    icon: <Database className="w-7 h-7" />
                },
                {
                    title: "Real-Time Verification",
                    description: "Every email is pinged in real-time to ensure deliverability. Protect your sender reputation.",
                    icon: <MailCheck className="w-7 h-7" />
                }
            ]}
            howItWorks={[
                {
                    step: 1,
                    title: "Search Creators",
                    description: "Use our discovery tool or upload a list of social media handles."
                },
                {
                    step: 2,
                    title: "Instant Enrichment",
                    description: "Our system instantly matches specialized profiles with verified contact data."
                },
                {
                    step: 3,
                    title: "Start Outreach",
                    description: "Push verified emails directly to your campaigns within Verality."
                }
            ]}
            seoContent={{
                title: "How to find influencer emails at scale",
                content: (
                    <>
                        <p className="mb-4">
                            Sending DMs is great, but email still converts the best for high-value deals. The problem? Most influencers hide their email address or use a "manager" inbox that ignores you.
                        </p>
                        <p className="mb-4">
                            Verality's <strong>influencer email finder</strong> bypasses these gatekeepers. We use proprietary scraping technology and data partnerships to surface the <strong>personal email addresses</strong> of creators.
                        </p>
                        <p>
                            This isn't just about finding <i>an</i> email. It's about finding the <i>right</i> email—the one that pops up as a notification on their iPhone.
                        </p>
                    </>
                )
            }}
        />
    );
}
