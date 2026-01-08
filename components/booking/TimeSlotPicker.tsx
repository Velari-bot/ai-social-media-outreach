"use client";

import { format, parseISO } from 'date-fns';
import { Loader2, Clock } from 'lucide-react';
import { AvailabilitySlot } from '@/lib/types';
// Actually lib/booking-service imports firebase-admin which is NODE ONLY.
// Types need to be shared. I should have put types in types.ts.
// For now, I'll redefine the interface here for client safety.


interface TimeSlotPickerProps {
    date: Date;
    slots: AvailabilitySlot[];
    loading: boolean;
    onSelect: (slot: AvailabilitySlot) => void;
    selectedSlot: AvailabilitySlot | null;
}

export default function TimeSlotPicker({ date, slots, loading, onSelect, selectedSlot }: TimeSlotPickerProps) {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <span className="text-sm">Finding availability...</span>
            </div>
        );
    }

    // Filter slots for the specific date just in case, though parent acts as filter
    const dateStr = format(date, 'yyyy-MM-dd');
    const daySlots = slots.filter(s => s.date === dateStr && !s.isBooked);

    if (daySlots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Clock className="w-10 h-10 mb-2 opacity-20" />
                <p className="font-medium">No available slots</p>
                <p className="text-sm text-gray-400">Please try another date.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Available times for {format(date, 'EEEE, MMM d')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {daySlots.map((slot) => {
                    const startTime = parseISO(slot.startTime); // Expecting ISO string
                    const timeLabel = format(startTime, 'h:mm a');
                    const isSelected = selectedSlot?.id === slot.id;

                    return (
                        <button
                            key={slot.id}
                            onClick={() => onSelect(slot)}
                            className={`
                px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200
                ${isSelected
                                    ? 'border-black bg-black text-white shadow-lg scale-105'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-black hover:scale-[1.02]'}
              `}
                        >
                            {timeLabel}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
