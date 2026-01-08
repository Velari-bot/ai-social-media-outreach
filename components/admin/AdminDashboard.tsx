
"use client";

import { useState } from "react";
import {
    Loader2,
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
    X
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

// Sub-components (we'll implement these next)
import AdminOverview from "./sections/AdminOverview";
import AdminCalls from "./sections/AdminCalls";
import AdminUsers from "./sections/AdminUsers";
import AdminPricing from "./sections/AdminPricing";
// ... other sections can be implemented incrementally

interface AdminLayoutProps {
    children?: React.ReactNode; // Flexible if we use it as a wrapper
    onLogout: () => void;
}

type AdminSection = 'overview' | 'calls' | 'users' | 'pricing' | 'payments' | 'affiliates' | 'creators' | 'emails' | 'demo' | 'settings' | 'logs';

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
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black font-bold text-lg rotate-3">
                            V
                        </div>
                        <span className="text-xl font-bold tracking-tight">Verality Admin</span>
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
            <main className="flex-1 min-w-0 bg-[#F3F1EB]">
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
            </main>
        </div>
    );
}
