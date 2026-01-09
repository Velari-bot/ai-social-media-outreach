
"use client";

import Navbar from "@/components/Navbar";

export default function TermsOfService() {
    return (
        <main className="min-h-screen bg-[#F3F1EB]">
            <Navbar />
            <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <h1 className="text-4xl font-black text-[#1A1A1A] mb-8">Terms of Service</h1>
                <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="font-bold mb-4">Last updated: January 9, 2026</p>

                    <h3 className="text-2xl font-bold mt-8 mb-4 text-black">1. Agreement to Terms</h3>
                    <p>
                        These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and Verality ("we," "us" or "our"),
                        concerning your access to and use of the verality.io website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the "Site").
                    </p>

                    <h3 className="text-2xl font-bold mt-8 mb-4 text-black">2. Intellectual Property Rights</h3>
                    <p>
                        Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content")
                        and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
                    </p>

                    <h3 className="text-2xl font-bold mt-8 mb-4 text-black">3. User Representations</h3>
                    <p>
                        By using the Site, you represent and warrant that:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>All registration information you submit will be true, accurate, current, and complete.</li>
                        <li>You will maintain the accuracy of such information and promptly update such registration information as necessary.</li>
                        <li>You have the legal capacity and you agree to comply with these Terms of Service.</li>
                        <li>You are not a minor in the jurisdiction in which you reside.</li>
                    </ul>

                    <h3 className="text-2xl font-bold mt-8 mb-4 text-black">4. Prohibited Activities</h3>
                    <p>
                        You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
                    </p>

                    <h3 className="text-2xl font-bold mt-8 mb-4 text-black">5. Term and Termination</h3>
                    <p>
                        These Terms of Service shall remain in full force and effect while you use the Site. WITHOUT LIMITING ANY OTHER PROVISION OF THESE TERMS OF SERVICE, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY,
                        DENY ACCESS TO AND USE OF THE SITE (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON.
                    </p>

                    <h3 className="text-2xl font-bold mt-8 mb-4 text-black">6. Governing Law</h3>
                    <p>
                        These Terms shall be governed by and defined following the laws of Unites States. Verality and yourself irrevocably consent that the courts of United States shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these terms.
                    </p>

                    <h3 className="text-2xl font-bold mt-8 mb-4 text-black">7. Contact Us</h3>
                    <p>
                        In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at: support@verality.io
                    </p>
                </div>
            </div>
        </main>
    );
}
