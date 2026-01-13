"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ArrowRight, Check, X } from "lucide-react";
import { ReactNode } from "react";

interface ComparisonPageProps {
    competitorName: string;
    veralityAdvantage: string;
    comparisonRows: {
        feature: string;
        verality: boolean | string;
        competitor: boolean | string;
    }[];
    faq: {
        question: string;
        answer: string;
    }[];
}

export default function ComparisonPage({
    competitorName,
    veralityAdvantage,
    comparisonRows,
    faq
}: ComparisonPageProps) {
    return (
        <main className="min-h-screen relative z-10 font-sans selection:bg-black selection:text-white pb-20">
            <Navbar />

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 max-w-[1440px] mx-auto flex flex-col items-center text-center relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-600 font-bold text-sm mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    Stop overpaying for {competitorName}
                </div>
                <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-[850] text-[#1A1A1A] mb-8 tracking-tighter leading-[1.05] max-w-5xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                    The Better <span className="text-[#6B4BFF]">{competitorName} Alternative</span>
                </h1>

                <p className="text-xl text-gray-600 mb-10 leading-relaxed font-medium max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                    {veralityAdvantage}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                    <Link
                        href="/book"
                        className="px-10 py-4 bg-black text-white rounded-full hover:bg-gray-800 hover:scale-105 transition-all font-bold text-lg shadow-xl shadow-black/10 flex items-center gap-2"
                    >
                        Switch to Verality Free <ArrowRight className="w-5 h-5 text-white/60" />
                    </Link>
                </div>
            </section>

            {/* Comparison Table */}
            <section className="px-6 max-w-[1000px] mx-auto mb-32 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                <div className="bg-white rounded-[32px] border border-gray-200 shadow-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-6 text-left text-gray-500 font-bold uppercase tracking-wider text-sm w-1/3">Feature</th>
                                <th className="px-8 py-6 text-center font-[850] text-xl w-1/3 bg-black text-white">Verality</th>
                                <th className="px-8 py-6 text-center font-bold text-gray-500 text-xl w-1/3 border-l border-gray-200">{competitorName}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {comparisonRows.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-5 font-bold text-gray-800">{row.feature}</td>
                                    <td className="px-8 py-5 text-center bg-black/5 font-bold text-black border-x border-dashed border-gray-200">
                                        {typeof row.verality === "boolean" ? (
                                            row.verality ? <Check className="w-6 h-6 text-green-600 mx-auto" /> : <X className="w-6 h-6 text-gray-300 mx-auto" />
                                        ) : (
                                            row.verality
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-center font-medium text-gray-500 border-l border-gray-200">
                                        {typeof row.competitor === "boolean" ? (
                                            row.competitor ? <Check className="w-6 h-6 text-green-600 mx-auto" /> : <X className="w-6 h-6 text-red-300 mx-auto" />
                                        ) : (
                                            row.competitor
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 bg-gray-50 border-y border-gray-200">
                <div className="max-w-3xl px-6 mx-auto">
                    <h2 className="text-4xl font-[850] text-[#1A1A1A] mb-12 text-center">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        {faq.map((item, i) => (
                            <div key={i} className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                                <h3 className="text-xl font-bold mb-3">{item.question}</h3>
                                <p className="text-gray-500 leading-relaxed font-medium">{item.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="px-6 max-w-[1440px] mx-auto py-20">
                <div className="bg-black rounded-[48px] p-12 md:p-24 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-20 pointer-events-none mix-blend-overlay" />
                    <div className="relative z-10 max-w-3xl mx-auto">
                        <h2 className="text-5xl md:text-7xl font-[850] mb-8 tracking-tighter">Ready to upgrade?</h2>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/book" className="px-10 py-5 bg-white text-black rounded-full hover:bg-gray-100 font-bold text-xl shadow-xl hover:scale-105 transition-all">
                                Get Started Free
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

        </main>
    );
}
