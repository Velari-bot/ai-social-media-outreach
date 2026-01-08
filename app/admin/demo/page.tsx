
"use client";

import { useState } from 'react';
import DemoDashboard from '@/components/demo/DemoDashboard';
import AdminLogin from '@/components/admin/AdminLogin';

export default function AdminDemoPage() {
    // Simple protection: must log in as admin to see the demo.
    // In a real app, this would check a global auth context or session.
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#F3F1EB] flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <AdminLogin onLogin={() => setIsAuthenticated(true)} />
                    <p className="text-center mt-4 text-gray-500 text-sm">Log in to access Demo Mode</p>
                </div>
            </div>
        );
    }

    return <DemoDashboard />;
}
