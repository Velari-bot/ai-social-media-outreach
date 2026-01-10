"use client";

import { useState } from "react";
import {
    LayoutDashboard,
    Phone,
    Users,
    CreditCard,
    DollarSign,
    Share2,
    Database,
    Mail,
    TestTube,
    Settings,
    FileText,
    LogOut,
    Menu,
    X,
    TrendingDown
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

// Sub-components
import AdminOverview from "./sections/AdminOverview";
import AdminCalls from "./sections/AdminCalls";
import AdminUsers from "./sections/AdminUsers";
import AdminPricing from "./sections/AdminPricing";
import AdminEmails from "./sections/AdminEmails";
import AdminStripe from "./sections/AdminStripe";
import AdminAffiliates from "./sections/AdminAffiliates";
import AdminCreators from "./sections/AdminCreators";
import AdminSettings from "./sections/AdminSettings";
import AdminLogs from "./sections/AdminLogs";
import AdminExpenses from "./AdminExpenses";

type AdminSection = 'overview' | 'calls' | 'users' | 'pricing' | 'payments' | 'affiliates' | 'creators' | 'emails' | 'demo' | 'settings' | 'logs' | 'expenses';

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
    const [activeSection, setActiveSection] = useState<AdminSection>('overview');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'calls', label: 'Calls & Bookings', icon: Phone },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'pricing', label: 'Pricing & Tiers', icon: DollarSign },
        { id: 'payments', label: 'Stripe & Billing', icon: CreditCard },
        { id: 'affiliates', label: 'Affiliates', icon: Share2 },
        { id: 'creators', label: 'Creator DB', icon: Database },
        { id: 'emails', label: 'Email System', icon: Mail },
        { id: 'expenses', label: 'Expenses & Profit', icon: TrendingDown },
        { id: 'demo', label: 'Demo Mode', icon: TestTube, href: '/admin/demo' },
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'logs', label: 'Logs & Audit', icon: FileText },
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'overview': return <AdminOverview />;
            case 'calls': return <AdminCalls />;
            case 'users': return <AdminUsers />;
            case 'pricing': return <AdminPricing />;
            case 'payments': return <AdminStripe />;
            case 'affiliates': return <AdminAffiliates />;
            case 'creators': return <AdminCreators />;
            case 'emails': return <AdminEmails />;
            case 'expenses': return <AdminExpenses />;
            case 'settings': return <AdminSettings />;
            case 'logs': return <AdminLogs />;
            default: return (
                <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400">
                    <Settings className="w-12 h-12 mb-4 opacity-20" />
                    <p>This module ({activeSection}) is under construction.</p>
                </div>
            );
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F1EB] flex font-sans">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex flex-col w-64 bg-[#1A1A1A] text-white border-r border-white/10 h-screen sticky top-0 overflow-y-auto">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center overflow-hidden transition-all duration-300 rotate-3 group-hover:rotate-6 group-hover:scale-110 border border-white/10">
                            <img src="/v-nav.png" alt="V" className="w-full h-full object-contain p-0.5" />
                        </div>
                        <span className="text-xl font-bold tracking-tight group-hover:text-white transition-colors">Verality Admin</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {menuItems.map((item) => {
                        const isLink = 'href' in item;
                        if (isLink) {
                            return (
                                <Link
                                    key={item.id}
                                    href={(item as any).href}
                                    target="_blank"
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                    <span className="ml-auto text-[10px] uppercase font-bold bg-white/10 px-1.5 py-0.5 rounded text-white/60">New</span>
                                </Link>
                            )
                        }

                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id as AdminSection)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === item.id
                                    ? "bg-white text-black shadow-lg shadow-white/10 translate-x-1"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 bg-[#F3F1EB] relative overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] bg-gradient-to-br from-purple-100 via-pink-100 to-transparent blur-[100px]" />
                    <div className="absolute top-[20%] right-[-10%] w-[40%] h-[50%] bg-gradient-to-bl from-blue-100 via-teal-50 to-transparent blur-[100px]" />
                </div>

                <div className="relative z-10">
                    {/* Mobile Header */}
                    <div className="lg:hidden bg-[#1A1A1A] text-white p-4 flex items-center justify-between sticky top-0 z-50">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black font-bold text-lg rotate-3">
                                V
                            </div>
                            <span className="text-xl font-bold tracking-tight">Verality Admin</span>
                        </div>
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            {mobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden bg-[#1A1A1A] text-white fixed inset-0 z-40 pt-20 px-4 space-y-2 overflow-y-auto">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveSection(item.id as AdminSection);
                                        setMobileMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === item.id
                                        ? "bg-white text-black"
                                        : "text-gray-400 hover:text-white"
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </button>
                            ))}
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors mt-8"
                            >
                                <LogOut className="w-5 h-5" />
                                Sign Out
                            </button>
                        </div>
                    )}

                    {/* Dynamic Content */}
                    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto min-h-screen">
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
