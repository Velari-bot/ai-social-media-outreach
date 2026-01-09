"use client";

import { useEffect, useState } from "react";
import AvailabilityManager from "../AvailabilityManager"; // Re-using the component we built earlier
import { Calendar, CheckCircle2, XCircle, Clock, Loader2, Mail, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";

type Tab = "bookings" | "availability";

interface Booking {
    id: string;
    name: string;
    email: string;
    company: string;
    date: string;
    time: string;
    status?: string; // e.g. 'scheduled', 'completed'
}

export default function AdminCalls() {
    const [activeTab, setActiveTab] = useState<Tab>("bookings");
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === "bookings") {
            fetchBookings();
        }
    }, [activeTab]);

    async function fetchBookings() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/bookings');
            const data = await res.json();
            if (data.success) {
                setBookings(data.bookings);
            }
        } catch (error) {
            console.error("Failed to fetch bookings", error);
            toast.error("Failed to fetch bookings");
        } finally {
            setLoading(false);
        }
    }

    async function handleStatusUpdate(bookingId: string, newStatus: string) {
        if (!confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) return;

        try {
            const res = await fetch('/api/admin/bookings/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                // Optimistic update
                setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
                toast.success(`Booking marked as ${newStatus}`);
            } else {
                toast.error('Failed to update status');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error updating status');
        }
    }

    async function handleDelete(bookingId: string) {
        if (!confirm('Are you sure you want to PERMANENTLY delete this booking?')) return;

        try {
            const res = await fetch('/api/admin/bookings', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: bookingId }),
            });
            const data = await res.json();

            if (data.success) {
                setBookings(prev => prev.filter(b => b.id !== bookingId));
                toast.success('Booking deleted');
            } else {
                toast.error(data.error || 'Failed to delete booking');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error deleting booking');
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-[#1A1A1A]">Call Management</h1>
                    <p className="text-gray-500 mt-1">Manage scheduled demos and availability.</p>
                </div>
                <div className="bg-white p-1 rounded-xl border border-gray-200 flex gap-1">
                    <button
                        onClick={() => setActiveTab("bookings")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "bookings" ? "bg-[#1A1A1A] text-white shadow-sm" : "text-gray-500 hover:text-black"
                            }`}
                    >
                        Bookings
                    </button>
                    <button
                        onClick={() => setActiveTab("availability")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "availability" ? "bg-[#1A1A1A] text-white shadow-sm" : "text-gray-500 hover:text-black"
                            }`}
                    >
                        Availability
                    </button>
                </div>
            </div>

            {activeTab === "availability" && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <AvailabilityManager />
                </div>
            )}

            {activeTab === "bookings" && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Company</th>
                                    <th className="px-6 py-4">Date & Time</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                            Loading bookings...
                                        </td>
                                    </tr>
                                ) : bookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                            No bookings found.
                                        </td>
                                    </tr>
                                ) : (
                                    bookings.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-[#1A1A1A]">{booking.name}</div>
                                                <div className="flex items-center gap-1.5 text-xs text-blue-600">
                                                    <Mail className="w-3 h-3" />
                                                    {booking.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{booking.company}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Calendar className="w-4 h-4" />
                                                    {format(parseISO(booking.date), 'MMM d, yyyy')}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1 pl-6">
                                                    {booking.time} (30 min)
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                    booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    <Clock className="w-3 h-3" />
                                                    {booking.status || 'Scheduled'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate(booking.id, 'completed')}
                                                        title="Mark Completed"
                                                        className="p-2 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded-lg transition-colors"
                                                    >
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                                        title="Cancel / No Show"
                                                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(booking.id)}
                                                        title="Delete Booking"
                                                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-700 rounded-lg transition-colors border-l border-gray-100 ml-1"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
