"use client";

import { useEffect, useState } from "react";
import { Search, MoreVertical, Shield, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface User {
    id: string;
    email: string;
    role: string;
    status: string;
    plan: string;
    createdAt: string;
    displayName?: string;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function fetchUsers() {
            try {
                const res = await fetch('/api/admin/users');
                const data = await res.json();
                if (data.success) {
                    setUsers(data.users);
                }
            } catch (error) {
                console.error("Failed to fetch users", error);
            } finally {
                setLoading(false);
            }
        }
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(search.toLowerCase())
    );

    async function handleUpdateUser(userId: string, updates: { role?: string, plan?: string }) {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, ...updates }),
            });
            const data = await res.json();
            if (data.success) {
                // Refresh list
                const newRes = await fetch('/api/admin/users');
                const newData = await newRes.json();
                if (newData.success) setUsers(newData.users);
            } else {
                alert("Update failed: " + data.error);
            }
        } catch (e) {
            console.error(e);
            alert("Error updating user");
        } finally {
            setLoading(false);
        }
    }

    async function handleAddUser() {
        const email = prompt("Enter new user email:");
        if (!email) return;

        const displayName = prompt("Enter user display name:", "New User");
        if (!displayName) return;

        try {
            // For now, we simulate backend creation or use a real route if we made one.
            // Since we don't have a 'create user' route yet specifically for this, I'll assume we can make one quickly or just throw an error.
            // Actually, let's create the route.
            const res = await fetch('/api/admin/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, displayName, role: 'user', plan: 'pro' }),
                // Defaulting to pro plan as per "users must talk to sales" - presumably they bought it.
            });

            const data = await res.json();
            if (data.success) {
                alert("User created! Passwords are handled via passwordless or reset flow.");
                // Refresh list
                const newRes = await fetch('/api/admin/users');
                const newData = await newRes.json();
                if (newData.success) setUsers(newData.users);
            } else {
                alert("Failed to create user: " + data.error);
            }
        } catch (e) {
            console.error(e);
            alert("Error creating user");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#1A1A1A]">User Directory</h1>
                    <p className="text-gray-500 mt-1">Manage user access and roles.</p>
                </div>

                <div className="flex gap-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 min-w-[250px] text-black"
                    />
                    <button
                        onClick={handleAddUser}
                        className="px-4 py-2 bg-black text-white rounded-xl text-sm font-bold shadow-sm hover:bg-gray-900 transition-all flex items-center gap-2"
                    >
                        <span>+ Add User</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto relative scrollbar-thin scrollbar-thumb-gray-200">
                    <table className="w-full text-sm text-left border-separate border-spacing-0">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100 sticky top-0 z-20">
                            <tr>
                                <th className="px-6 py-4 bg-gray-50 border-b border-gray-100">User</th>
                                <th className="px-6 py-4 bg-gray-50 border-b border-gray-100">Role</th>
                                <th className="px-6 py-4 bg-gray-50 border-b border-gray-100">Status</th>
                                <th className="px-6 py-4 bg-gray-50 border-b border-gray-100">Plan</th>
                                <th className="px-6 py-4 bg-gray-50 border-b border-gray-100">Joined</th>
                                <th className="px-6 py-4 bg-gray-50 border-b border-gray-100">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading users...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-[#1A1A1A]">{user.displayName || 'No Name'}</div>
                                            <div className="text-xs text-gray-400">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                user.role === 'affiliate' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {user.role === 'admin' && <Shield className="w-3 h-3" />}
                                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 capitalize">{user.plan}</td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {format(new Date(user.createdAt), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {user.role !== 'admin' ? (
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <button
                                                            onClick={() => handleUpdateUser(user.id, { role: 'admin', plan: 'enterprise' })}
                                                            className="text-[10px] font-bold uppercase tracking-wider text-purple-600 hover:text-purple-800 bg-purple-50 px-2 py-1 rounded w-full text-center"
                                                        >
                                                            Make Admin
                                                        </button>
                                                        {user.plan !== 'custom_no_email' ? (
                                                            <button
                                                                onClick={() => handleUpdateUser(user.id, { plan: 'custom_no_email' })}
                                                                className="text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded w-full text-center"
                                                            >
                                                                Set DB Only
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleUpdateUser(user.id, { plan: 'pro' })}
                                                                className="text-[10px] font-bold uppercase tracking-wider text-green-600 hover:text-green-800 bg-green-50 px-2 py-1 rounded w-full text-center"
                                                            >
                                                                Set Pro
                                                            </button>
                                                        )}
                                                        {user.plan !== 'testing' && (
                                                            <button
                                                                onClick={() => handleUpdateUser(user.id, { plan: 'testing' })}
                                                                className="text-[10px] font-bold uppercase tracking-wider text-orange-600 hover:text-orange-800 bg-orange-50 px-2 py-1 rounded w-full text-center"
                                                            >
                                                                Set Testing (100)
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleUpdateUser(user.id, { role: 'user', plan: 'free' })}
                                                        className="text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:text-gray-800 bg-gray-50 px-2 py-1 rounded"
                                                    >
                                                        Demote
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
