import { Metadata } from 'next';
import Navbar from "@/components/Navbar";
import Link from 'next/link';

export const metadata: Metadata = {
    title: "The Ultimate Guide to AI Creator Outreach (2025)",
    description: "Learn how to automate your influencer marketing with AI. A step-by-step guide to finding creators, personalizing emails, and scaling your campaigns.",
    keywords: ["AI creator outreach", "automated influencer marketing", "how to find influencers with AI"],
    openGraph: {
        title: "The Ultimate Guide to AI Creator Outreach (2025)",
        description: "Learn how to automate your influencer marketing with AI.",
        images: ['/v-nav.png'],
    }
};

export default function GuidePage() {
    return (
        <main className="min-h-screen bg-white font-sans text-gray-900 selection:bg-black selection:text-white">
            <Navbar />

            <article className="max-w-3xl mx-auto px-6 pt-40 pb-20">
                <div className="mb-10 text-center">
                    <div className="inline-block px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                        Strategy Guide
                    </div>
                    <h1 className="text-4xl md:text-5xl font-[850] leading-tight mb-6">
                        The Ultimate Guide to <br className="hidden md:block" />
                        <span className="text-[#6B4BFF]">AI Creator Outreach</span>
                    </h1>
                    <p className="text-xl text-gray-500 font-medium">
                        How to scale your influencer program from 10 to 1,000 creators without hiring more staff.
                    </p>
                </div>

                <div className="prose prose-lg prose-gray mx-auto prose-headings:font-bold prose-headings:text-black prose-a:text-blue-600">
                    <h2>Why Manual Outreach is Dead</h2>
                    <p>
                        If you&apos;re still using Google Sheets to track influencers and sending DMs one by one, you&apos;re already behind.
                        The most successful DTC brands in 2025 are using AI to automate the entire top-of-funnel process.
                    </p>
                    <p>
                        The problem with manual outreach is simple math: To get 10 posted videos, you need to ship products to 30 creators.
                        To get 30 creators to say &quot;yes&quot;, you need to email 300 of them. To find 300 good emails, you need to scan 1,000 profiles.
                    </p>
                    <p>
                        Doing this manually takes hundreds of hours. Doing it with AI takes 5 minutes.
                    </p>

                    <h2>Step 1: AI-Powered Discovery</h2>
                    <p>
                        Forget hashtags. AI tools like Verality allow you to search based on <strong>audience psychographics</strong>.
                        Instead of searching for &quot;#fitness&quot;, you can search for &quot;creators whose audience is 70% female, aged 18-24, located in Los Angeles, and interested in skincare.&quot;
                    </p>
                    <ul>
                        <li><strong>Lookalike Search:</strong> Upload your best performing creator, and let AI find 50 more just like them.</li>
                        <li><strong>Keywords in Bio:</strong> Filter specifically for &quot;UGC Creator&quot; or &quot;Athlete&quot; in their bio.</li>
                        <li><strong>Engagement Filters:</strong> Automatically filter out anyone with less than 2% engagement rate.</li>
                    </ul>

                    <h2>Step 2: Automated Personalization</h2>
                    <p>
                        Templates don&apos;t work. &quot;Hey dear&quot; DMs get ignored. But writing unique emails takes too long.
                    </p>
                    <p>
                        AI solves this by analyzing the creator&apos;s last 5 posts and writing a personalized &quot;icebreaker&quot; for every single email.
                        It mentions their specific content, compliments their style, and ties it back to your brand automatically.
                    </p>

                    <h2>Step 3: The automated Follow-up</h2>
                    <p>
                        70% of deals happen in the follow-up. Most creators are busy and miss the first email.
                        An automated system ensures that if they don&apos;t reply in 3 days, a polite bump email is sent.
                        If they still don&apos;t reply, a final &quot;breakup&quot; email is sent 4 days later.
                    </p>

                    <h2>Conclusion</h2>
                    <p>
                        The goal isn&apos;t to remove the human element—it&apos;s to remove the administrative work so the human can focus on building the relationship once the creator replies.
                    </p>

                    <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 mt-10 not-prose text-center">
                        <h3 className="text-2xl font-bold mb-4">Ready to try it yourself?</h3>
                        <p className="text-gray-600 mb-6">Verality finds verified emails and automates your outreach in one click.</p>
                        <Link href="/book" className="inline-flex items-center justify-center px-8 py-4 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-all">
                            Start Your Campaign
                        </Link>
                    </div>
                </div>
            </article>

        </main>
    );
}
