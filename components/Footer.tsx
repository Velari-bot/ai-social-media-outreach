import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t border-gray-200 bg-white relative z-10">
            <div className="max-w-[1440px] mx-auto px-6 py-16">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                                <img src="/v-nav.png" alt="V" className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-black">verality.io</span>
                        </Link>
                        <p className="text-gray-500 font-medium max-w-sm mb-6">
                            The all-in-one AI platform for influencer outreach. Find creators, get emails, and automate campaigns.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-bold text-black mb-4">Features</h3>
                        <ul className="space-y-3 text-sm font-medium text-gray-500">
                            <li><Link href="/ai-outreach" className="hover:text-black transition-colors">AI Outreach Tool</Link></li>
                            <li><Link href="/creator-discovery" className="hover:text-black transition-colors">Influencer Discovery</Link></li>
                            <li><Link href="/email-finder" className="hover:text-black transition-colors">Creator Database</Link></li>
                            <li><Link href="/dm-automation" className="hover:text-black transition-colors">DM Automation</Link></li>
                            <li><Link href="/campaigns" className="hover:text-black transition-colors">CRM & Campaigns</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-black mb-4">Resources</h3>
                        <ul className="space-y-3 text-sm font-medium text-gray-500">
                            <li><Link href="/newsletter" className="hover:text-black transition-colors">Newsletter</Link></li>
                            <li><Link href="/book" className="hover:text-black transition-colors">Book a Demo</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-black mb-4">Compare</h3>
                        <ul className="space-y-3 text-sm font-medium text-gray-500">
                            <li><Link href="/for-agencies" className="hover:text-black transition-colors">For Agencies</Link></li>
                            <li><Link href="/for-ecommerce" className="hover:text-black transition-colors">For Ecommerce</Link></li>
                            <li><Link href="/for-saas" className="hover:text-black transition-colors">For SaaS</Link></li>
                            <li><Link href="/for-startups" className="hover:text-black transition-colors">For Startups</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-black mb-4">Compare</h3>
                        <ul className="space-y-3 text-sm font-medium text-gray-500">
                            <li><Link href="/verality-vs-modash" className="hover:text-black transition-colors">vs Modash</Link></li>
                            <li><Link href="/verality-vs-upfluence" className="hover:text-black transition-colors">vs Upfluence</Link></li>
                            <li><Link href="/verality-vs-hypeauditor" className="hover:text-black transition-colors">vs HypeAuditor</Link></li>
                            <li><Link href="/best-influencer-outreach-software" className="hover:text-black transition-colors">Best Outreach Tools</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-400 font-medium">
                        © 2026 Verality Inc. All rights reserved.
                    </div>
                    <div className="flex gap-8 text-sm font-semibold text-gray-500">
                        <Link href="/tos" className="hover:text-black">Terms</Link>
                        <Link href="/privacy-policy" className="hover:text-black">Privacy</Link>
                        <Link href="/support" className="hover:text-black">Support</Link>
                        <Link href="/docs" className="hover:text-black">Docs</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
