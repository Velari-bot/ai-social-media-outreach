"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ReactNode } from "react";

interface FeaturePageProps {
    title: string;
    subtitle: string;
    heroImage?: string; // URL or component
    benefits: {
        title: string;
        description: string;
        icon: ReactNode;
    }[];
    howItWorks: {
        step: number;
        title: string;
        description: string;
    }[];
    seoContent?: {
        title: string;
        content: ReactNode;
    };
}

export default function FeaturePage({
    title,
    subtitle,
    benefits,
    howItWorks,
    seoContent
}: FeaturePageProps) {
    return (
        <main className="min-h-screen relative z-10 font-sans selection:bg-black selection:text-white pb-20">
            <Navbar />

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 max-w-[1440px] mx-auto flex flex-col items-center text-center relative z-10">
                <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-[850] text-[#1A1A1A] mb-8 tracking-tighter leading-[1.05] max-w-5xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                    {title}
                </h1>

                <p className="text-xl text-gray-600 mb-10 leading-relaxed font-medium max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                    {subtitle}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                    <Link
                        href="/book"
                        className="px-10 py-4 bg-black text-white rounded-full hover:bg-gray-800 hover:scale-105 transition-all font-bold text-lg shadow-xl shadow-black/10 flex items-center gap-2"
                    >
                        Start Free Trial <ArrowRight className="w-5 h-5 text-white/60" />
                    </Link>
                    <Link
                        href="/demo"
                        className="px-10 py-4 bg-white text-black border border-gray-200 rounded-full hover:bg-gray-50 hover:scale-105 transition-all font-bold text-lg shadow-sm"
                    >
                        View Demo
                    </Link>
                </div>
            </section>

            {/* Benefits Grid */}
            <section className="px-6 max-w-[1440px] mx-auto mb-32">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {benefits.map((benefit, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-[32px] p-8 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 group"
                        >
                            <div className="w-14 h-14 bg-gray-50 text-black rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-all duration-300">
                                {benefit.icon}
                            </div>
                            <h3 className="text-2xl font-bold mb-3">{benefit.title}</h3>
                            <p className="text-gray-500 font-medium leading-relaxed">
                                {benefit.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it Works / Steps */}
            <section className="py-24 bg-gray-50 border-y border-gray-200">
                <div className="max-w-[1440px] px-6 mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-[850] text-[#1A1A1A] mb-4">How it works</h2>
                        <p className="text-lg text-gray-500">Simple, automated, and effective.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        {/* Connector Line (Desktop only) */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 z-0" />

                        {howItWorks.map((step, i) => (
                            <div key={i} className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-24 h-24 bg-white rounded-full border-4 border-gray-100 flex items-center justify-center text-3xl font-[850] text-[#1A1A1A] mb-8 shadow-sm">
                                    {step.step}
                                </div>
                                <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                                <p className="text-gray-500 leading-relaxed font-medium max-w-xs">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SEO Content Section */}
            {seoContent && (
                <section className="py-24 max-w-4xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-[#1A1A1A] mb-8">{seoContent.title}</h2>
                    <div className="prose prose-lg text-gray-600 max-w-none">
                        {seoContent.content}
                    </div>
                </section>
            )}

            {/* CTA Section */}
            <section className="px-6 max-w-[1440px] mx-auto mb-20">
                <div className="bg-black rounded-[48px] p-12 md:p-24 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-20 pointer-events-none mix-blend-overlay" />
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/30 blur-[150px] rounded-full mix-blend-screen" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/30 blur-[150px] rounded-full mix-blend-screen" />

                    <div className="relative z-10 max-w-3xl mx-auto">
                        <h2 className="text-5xl md:text-7xl font-[850] mb-8 tracking-tighter">Start your campaign today.</h2>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/book" className="px-10 py-5 bg-white text-black rounded-full hover:bg-gray-100 font-bold text-xl shadow-xl hover:scale-105 transition-all">
                                Get Started Free
                            </Link>
                        </div>
                        <p className="mt-8 text-white/40 text-sm font-medium">No credit card required for trial.</p>
                    </div>
                </div>
            </section>

        </main>
    );
}
