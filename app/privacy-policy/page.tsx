
"use client";

import Navbar from "@/components/Navbar";

export default function PrivacyPolicy() {
    return (
        <main className="min-h-screen bg-[#F3F1EB]">
            <Navbar />
            <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <h1 className="text-4xl font-black text-[#1A1A1A] mb-8">Privacy Policy</h1>
                <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="font-bold mb-4">Last updated: January 9, 2026</p>

                    <p>
                        Welcome to Verality ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy.
                        If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us at support@verality.io.
                    </p>

                    <h3 className="text-2xl font-bold mt-8 mb-4 text-black">1. Information We Collect</h3>
                    <p>
                        We collect personal information that you adhere to provide to us when registering at the Services, expressing an interest in obtaining information about us or our products and services,
                        when participating in activities on the Services or otherwise contacting us.
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li><strong>Personal Data:</strong> Name, email address, contact information.</li>
                        <li><strong>Credentials:</strong> Passwords, password hints, and similar security information used for authentication and account access.</li>
                        <li><strong>Payment Data:</strong> Data necessary to process your payment if you make purchases, such as your payment instrument number (such as a credit card number), and the security code associated with your payment instrument.</li>
                    </ul>

                    <h3 className="text-2xl font-bold mt-8 mb-4 text-black">2. Google User Data</h3>
                    <p>
                        Verality's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.
                    </p>
                    <p className="mt-2">
                        Specifically, if you connect your Gmail account:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>We only access your emails to facilitate the outreach campaigns you explicitly initiate.</li>
                        <li>We do not sell your email data to third parties.</li>
                        <li>We do not use your email data for advertising purposes.</li>
                        <li>We do not read your emails except as necessary to detect replies to your outreach campaigns or for security/support purposes as requested by you.</li>
                    </ul>

                    <h3 className="text-2xl font-bold mt-8 mb-4 text-black">3. How We Use Your Information</h3>
                    <p>
                        We use personal information collected via our Services for a variety of business purposes described below:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>To facilitate account creation and logon process.</li>
                        <li>To send you marketing and promotional communications (you can opt-out at any time).</li>
                        <li>To send administrative information to you.</li>
                        <li>To fulfill and manage your orders.</li>
                        <li>To deliver services to the user.</li>
                    </ul>

                    <h3 className="text-2xl font-bold mt-8 mb-4 text-black">4. Sharing Your Information</h3>
                    <p>
                        We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
                    </p>

                    <h3 className="text-2xl font-bold mt-8 mb-4 text-black">5. Contact Us</h3>
                    <p>
                        If you have questions or comments about this policy, you may email us at support@verality.io.
                    </p>
                </div>
            </div>
        </main>
    );
}
