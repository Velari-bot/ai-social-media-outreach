"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import { Download, Phone, DollarSign, User, Mail, Database } from "lucide-react";
import toast from "react-hot-toast";

interface Lead {
    id: string;
    creator_email: string;
    phone_number?: string;
    tiktok_rate?: number;
    sound_promo_rate?: number;
    status: string;
    updated_at: string;
}

export default function DataPage() {
    return (
        <SubscriptionGuard>
            <DataContent />
        </SubscriptionGuard>
    );
}

function DataContent() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLeads() {
            try {
                const { getCurrentUser } = await import("@/lib/auth-helpers");
                const user = await getCurrentUser();
                if (!user) return;

                const token = await user.getIdToken();
                const res = await fetch('/api/user/data-leads', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setLeads(data.leads || []);
                }
            } catch (e) {
                console.error("Failed to fetch leads", e);
                toast.error("Failed to load data");
            } finally {
                setLoading(false);
            }
        }
        fetchLeads();
    }, []);

    const handleExport = () => {
        if (leads.length === 0) return;

        // Create CSV
        const headers = ["Email", "Phone", "TikTok Rate ($)", "Sound Promo ($)", "Last Updated"];
        const rows = leads.map(l => [
            l.creator_email,
            l.phone_number || "",
            l.tiktok_rate || "",
            l.sound_promo_rate || "",
            new Date(l.updated_at).toLocaleDateString()
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `creator_data_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <main className="min-h-screen bg-[#F3F1EB] font-sans">
            <Navbar />

            <div className="pt-32 px-4 sm:px-6 pb-20 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-black tracking-tight mb-2">Data & Rates</h1>
                        <p className="text-gray-600 text-lg">
                            Automatically collected phone numbers and pricing from your conversations.
                        </p>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={leads.length === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <Database size={24} />
                        </div>
                        <div>
                            <div className="text-3xl font-black">{leads.length}</div>
                            <div className="text-sm text-gray-500 font-medium">Total Records</div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <div className="text-3xl font-black">
                                {leads.filter(l => l.tiktok_rate || l.sound_promo_rate).length}
                            </div>
                            <div className="text-sm text-gray-500 font-medium">Rates Collected</div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                            <Phone size={24} />
                        </div>
                        <div>
                            <div className="text-3xl font-black">
                                {leads.filter(l => l.phone_number).length}
                            </div>
                            <div className="text-sm text-gray-500 font-medium">Phone Numbers</div>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Creator</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">TikTok Rate</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Sound Promo</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Last Active</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex justify-center mb-2">
                                                <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                                            </div>
                                            Loading data...
                                        </td>
                                    </tr>
                                ) : leads.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            No data collected yet. As your AI negotiates, rates and phone numbers will appear here.
                                        </td>
                                    </tr>
                                ) : (
                                    leads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                                                        <User size={14} />
                                                    </div>
                                                    <span className="font-semibold text-gray-900">{lead.creator_email.split('@')[0]}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Mail size={12} className="text-gray-400" />
                                                        {lead.creator_email}
                                                    </div>
                                                    {lead.phone_number ? (
                                                        <div className="flex items-center gap-2 text-sm text-black font-medium bg-green-50 w-fit px-2 py-0.5 rounded">
                                                            <Phone size={12} className="text-green-600" />
                                                            {lead.phone_number}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">No phone</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {lead.tiktok_rate ? (
                                                    <span className="font-bold text-black">${lead.tiktok_rate}</span>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {lead.sound_promo_rate ? (
                                                    <span className="font-bold text-black">${lead.sound_promo_rate}</span>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(lead.updated_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
