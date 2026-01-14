
"use client";

import { useState, useEffect } from "react";
import { FileText, Shield, Info, AlertTriangle, Search, Filter, Download, Loader2 } from "lucide-react";
import { getCurrentUser } from '@/lib/auth-helpers';

export default function AdminLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLogs() {
            setLoading(true);
            try {
                const user = await getCurrentUser();
                const token = await user?.getIdToken();
                const res = await fetch('/api/admin/audit-logs', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success && Array.isArray(data.logs)) {
                    setLogs(data.logs);
                } else {
                    console.error("Failed to load audit logs", data);
                }
            } catch (err) {
                console.error("Failed to fetch logs", err);
            } finally {
                setLoading(false);
            }
        }
        fetchLogs();
    }, []);

    const getTypeStyles = (action: string) => {
        const lower = action.toLowerCase();
        if (lower.includes('delete') || lower.includes('fail') || lower.includes('error'))
            return { bg: 'bg-red-50', text: 'text-red-600', icon: AlertTriangle };
        if (lower.includes('create') || lower.includes('success') || lower.includes('add'))
            return { bg: 'bg-green-50', text: 'text-green-600', icon: Shield };
        if (lower.includes('update') || lower.includes('edit'))
            return { bg: 'bg-amber-50', text: 'text-amber-600', icon: Info };
        return { bg: 'bg-gray-50', text: 'text-gray-600', icon: Info };
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-black">System Audit Logs</h1>
                    <p className="text-gray-500 mt-1">Track administrative actions and system events.</p>
                </div>
                <button className="bg-white border border-gray-200 text-black px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-all">
                    <Download className="w-5 h-5" />
                    Export CSV
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by event, user, or IP..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-black font-medium focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                </div>
                <button className="px-6 py-3 bg-white border border-gray-200 rounded-2xl text-black font-bold flex items-center gap-2 hover:bg-gray-50 transition-all">
                    <Filter className="w-4 h-4" />
                    All Types
                </button>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-6">Log Event</th>
                                <th className="px-6 py-6">Actor</th>
                                <th className="px-6 py-6 font-center">Details</th>
                                <th className="px-6 py-6 text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        Loading logs...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">No logs found.</td>
                                </tr>
                            ) : (
                                logs.map((log) => {
                                    const styles = getTypeStyles(log.action);
                                    return (
                                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-lg ${styles.bg} ${styles.text}`}>
                                                        <styles.icon className="w-4 h-4" />
                                                    </div>
                                                    <div className="font-bold text-black">{log.action}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-sm font-medium text-black">{log.actor_id}</div>
                                                {log.target_type && <div className="text-[10px] text-gray-400 uppercase">{log.target_type}</div>}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-xs text-gray-500 font-mono max-w-sm truncate">
                                                    {JSON.stringify(log.details)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right text-xs text-gray-400 font-bold uppercase tracking-wider">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
