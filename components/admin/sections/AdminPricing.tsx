
"use client";

import { Edit2 } from "lucide-react";

export default function AdminPricing() {
    const tiers = [
        { name: "Basic", price: 400, limit: 1500 },
        { name: "Pro", price: 600, limit: 3000 },
        { name: "Growth", price: 900, limit: 6000 },
        { name: "Scale", price: 1500, limit: 12000 },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-[#1A1A1A]">Pricing Configuration</h1>
                <p className="text-gray-500 mt-1">Adjust tier limits and pricing without code changes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {tiers.map((tier) => (
                    <div key={tier.name} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group">
                        <button className="absolute top-4 right-4 p-2 bg-gray-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-black hover:text-white">
                            <Edit2 className="w-4 h-4" />
                        </button>

                        <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">{tier.name}</div>
                        <div className="text-3xl font-black text-[#1A1A1A] mb-1">${tier.price}</div>
                        <div className="text-sm text-gray-500 mb-6">per month</div>

                        <div className="space-y-2 pt-4 border-t border-gray-100">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Creator Limit</span>
                                <span className="font-bold">{tier.limit.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Daily Cap</span>
                                <span className="font-bold">{(tier.limit / 30).toFixed(0)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                <strong>Note:</strong> Pricing changes here calculate new prorations immediately. Ensure you update Stripe product IDs if changing billing intervals.
            </div>
        </div>
    );
}
