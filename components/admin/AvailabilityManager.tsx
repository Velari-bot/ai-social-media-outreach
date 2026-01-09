
"use client";

import { useState, useEffect } from 'react';
import { format, addDays, startOfDay } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Calendar as CalendarIcon, Clock, Plus, Trash2 } from 'lucide-react';
import SimpleCalendar from '@/components/booking/SimpleCalendar';

export default function AvailabilityManager() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [startTime, setStartTime] = useState('09:00');
    const [loading, setLoading] = useState(false);
    const [slots, setSlots] = useState<any[]>([]);

    const fetchSlots = async () => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        try {
            // Add timestamp to prevent caching
            const res = await fetch(`/api/availability?startDate=${dateStr}&endDate=${dateStr}&t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setSlots(data.slots || []);
            }
        } catch (e) {
            console.error("Failed to fetch slots", e);
        }
    };

    useEffect(() => {
        fetchSlots();
    }, [selectedDate]); // Only refetch when date changes. Actions manually refetch.

    const handleAddSlot = async () => {
        setLoading(true);
        try {
            const dateTime = new Date(selectedDate);
            const [hours, minutes] = startTime.split(':').map(Number);
            dateTime.setHours(hours, minutes, 0, 0);

            const res = await fetch('/api/admin/slots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: format(selectedDate, 'yyyy-MM-dd'),
                    startTime: dateTime.toISOString(),
                    // Calculate end time (30 mins)
                    endTime: new Date(dateTime.getTime() + 30 * 60000).toISOString()
                }),
            });

            if (!res.ok) throw new Error('Failed to add slot');
            toast.success('Slot added successfully');
            fetchSlots();
        } catch (error) {
            toast.error('Error adding slot');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSlot = async (slotId: string) => {
        if (!confirm('Are you sure you want to delete this slot?')) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/slots', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slotId }),
            });

            if (!res.ok) throw new Error('Failed to delete slot');
            toast.success('Slot deleted successfully');
            fetchSlots();
        } catch (error) {
            toast.error('Error deleting slot');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ALL ${slots.length} slots for this day?`)) return;
        setLoading(true);
        try {
            const slotIds = slots.map(s => s.id);
            const res = await fetch('/api/admin/slots', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slotIds }),
            });

            if (!res.ok) throw new Error('Failed to delete slots');
            toast.success('All slots deleted');
            fetchSlots();
        } catch (error) {
            toast.error('Error deleting slots');
        } finally {
            setLoading(false);
        }
    };

    const handleSeed = async () => {
        if (!confirm('This will generate slots for the next 14 days. Continue?')) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/seed', { method: 'POST' });
            if (!res.ok) throw new Error('Failed to seed');
            toast.success('Availability seeded successfully');
        } catch (error) {
            toast.error('Error seeding availability');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold mb-4 text-black">Select Date</h2>
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <SimpleCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-black">Existing Slots</h2>
                        {slots.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 font-medium transition-colors"
                            >
                                Delete All ({slots.length})
                            </button>
                        )}
                    </div>

                    {slots.length === 0 ? (
                        <p className="text-gray-500 text-sm">No available slots for this date.</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                            {slots.map((slot) => {
                                const start = new Date(slot.startTime);
                                return (
                                    <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">
                                            {format(start, 'h:mm a')}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteSlot(slot.id)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                            title="Delete Slot"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold mb-4 text-black">Add Single Slot</h2>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 text-black"
                            />
                        </div>
                        <button
                            onClick={handleAddSlot}
                            disabled={loading}
                            className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Add
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        Adding slot for {format(selectedDate, 'MMMM d, yyyy')} at {startTime} (30 mins).
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold mb-4 text-black">Bulk Actions</h2>
                    <button
                        onClick={handleSeed}
                        disabled={loading}
                        className="w-full py-3 border border-gray-200 hover:bg-gray-50 rounded-lg font-bold text-black transition-colors"
                    >
                        Auto-Seed Next 14 Days (9-5 M-F)
                    </button>
                </div>
            </div>
        </div>
    );
}
