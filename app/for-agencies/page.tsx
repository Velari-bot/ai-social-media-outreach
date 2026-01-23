import FeaturePage from "@/components/marketing/FeaturePage";
import { Users, FileBarChart, Briefcase, Layers } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Influencer Outreach for Agencies - Scale Client Campaigns | Verality",
    description: "The best influencer software for agencies. Manage multiple clients, whitelabel reports, and automate outreach at scale.",
    keywords: ["influencer marketing for agencies", "agency outreach software", "multi-client influencer tool"],
    alternates: {
        canonical: '/for-agencies',
    },
};

export default function AgenciesPage() {
    return (
        <FeaturePage
            title="Scale Your Agency's Outreach"
            subtitle="Manage 10+ clients from one dashboard. Find creators, automate outreach, and prove ROI without hiring more staff."
            benefits={[
                {
                    title: "Multi-Client Workspaces",
                    description: "Keep client data separate. Switch between brand accounts with one click. No more logging in and out.",
                    icon: <Layers className="w-7 h-7" />
                },
                {
                    title: "Whitelabel Reporting",
                    description: "Generate professional PDF reports with your agency logo. Show clients exactly how many leads you generated.",
                    icon: <FileBarChart className="w-7 h-7" />
                },
                {
                    title: "Team Collaboration",
                    description: "Assign campaigns to specific team members. Comment on creator profiles and approve lists before sending.",
                    icon: <Users className="w-7 h-7" />
                }
            ]}
            howItWorks={[
                {
                    step: 1,
                    title: "Onboard Client",
                    description: "Create a dedicated workspace for the brand."
                },
                {
                    step: 2,
                    title: "Set Strategy",
                    description: "Define the creator persona and budget for the client."
                },
                {
                    step: 3,
                    title: "Execute & Report",
                    description: "Run the auto-pilot outreach and export weekly success metrics."
                }
            ]}
            seoContent={{
                title: "Why Agencies Switch to Verality",
                content: (
                    <>
                        <p className="mb-4">
                            Running an influencer marketing agency is operationally heavy. You are constantly searching for talent, negotiating rates, and chasing deliverables.
                        </p>
                        <p className="mb-4">
                            Verality is built for <strong>high-volume agency workflows</strong>. Unlike other tools that charge per seat or limit your search, we provide scalable infrastructure so you can handle more clients with the same team size.
                        </p>
                        <p>
                            Increase your margins by automating the &quot;busy work&quot; of discovery and initial outreach.
                        </p>
                    </>
                )
            }}
        />
    );
}
