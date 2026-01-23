import FeaturePage from "@/components/marketing/FeaturePage";
import { KanbanSquare, Repeat, DollarSign, LayoutDashboard } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Influencer Outreach Campaigns - Track & Manage | Verality",
    description: "Manage your influencer marketing campaigns. Track status, negotiate deals, and monitor ROI in one dashboard.",
    keywords: ["influencer crm", "influencer campaign management", "creator relationship management"],
    alternates: {
        canonical: '/campaigns',
    },
};

export default function CampaignsPage() {
    return (
        <FeaturePage
            title="Campaign Management & CRM"
            subtitle="Move creators from 'Contacted' to 'Posted' with a live Kanban board designed for influencer marketing."
            benefits={[
                {
                    title: "Drag-and-Drop CRM",
                    description: "Visualize your entire pipeline. Move creators through stages: Contacted, Negotiating, Shipped, Posted.",
                    icon: <KanbanSquare className="w-7 h-7" />
                },
                {
                    title: "Automated Follow-ups",
                    description: "Creators busy? Our system automatically sends polite nudges if they don't reply within 3 days.",
                    icon: <Repeat className="w-7 h-7" />
                },
                {
                    title: "ROI Tracking",
                    description: "Log deal values, shipping costs, and generated sales to calculate the exact ROI of every creator.",
                    icon: <DollarSign className="w-7 h-7" />
                }
            ]}
            howItWorks={[
                {
                    step: 1,
                    title: "Create Campaign",
                    description: "Group creators by product launch ('Summer Drop') or objective ('Brand Awareness')."
                },
                {
                    step: 2,
                    title: "Manage Pipeline",
                    description: "Watch as AI moves creators from 'New' to 'Replied'. You take over for closing."
                },
                {
                    step: 3,
                    title: "Analyze Results",
                    description: "See which creators delivered the best CPM and CPA."
                }
            ]}
            seoContent={{
                title: "A dedicated CRM for Creator Management",
                content: (
                    <>
                        <p className="mb-4">
                            Spreadsheets are where influencer campaigns go to die. You need a <strong>Creator Relationship Management (CRM)</strong> system that is built for the chaos of social media DMs.
                        </p>
                        <p className="mb-4">
                            Verality&apos;s campaign manager unifies your outreach data with your relationship status. Know exactly who has been sent product, who posted, and who is ghosting you.
                        </p>
                        <p>
                            By centralizing this data, you can run multiple campaigns simultaneously without losing track of a single relationship.
                        </p>
                    </>
                )
            }}
        />
    );
}
