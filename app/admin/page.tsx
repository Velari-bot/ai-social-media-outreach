"use client";

import { useState } from 'react';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminLogin from '@/components/admin/AdminLogin';

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#F3F1EB] flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <AdminLogin onLogin={() => setIsAuthenticated(true)} />
                </div>
            </div>
        );
    }

    return <AdminDashboard onLogout={() => setIsAuthenticated(false)} />;
}
