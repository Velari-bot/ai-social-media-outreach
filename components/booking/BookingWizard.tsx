
"use client";

import { useState, useEffect } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import { CheckCircle2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import SimpleCalendar from './SimpleCalendar';
import TimeSlotPicker from './TimeSlotPicker';
import BookingForm, { BookingFormData } from './BookingForm';
import { AvailabilitySlot } from '@/lib/types';

export default function BookingWizard() {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
    const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [userTimezone, setUserTimezone] = useState<string>("");

    useEffect(() => {
        // Get user's timezone
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            setUserTimezone(tz);
        } catch (e) {
            setUserTimezone("UTC");
        }
    }, []);

    // Fetch availability on mount (next 45 days)
    useEffect(() => {
        const fetchAvailability = async () => {
            setLoadingAvailability(true);
            try {
                const today = new Date();
                const end = addDays(today, 45);
                const startStr = format(today, 'yyyy-MM-dd');
                const endStr = format(end, 'yyyy-MM-dd');

                const res = await fetch(`/api/availability?startDate=${startStr}&endDate=${endStr}`);
                if (!res.ok) throw new Error('Failed to load availability');

                const data = await res.json();
                setAvailability(data.slots || []);
            } catch (error) {
                toast.error("Could not load available times. Please try again.");
            } finally {
                setLoadingAvailability(false);
            }
        };

        fetchAvailability();
    }, []);

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setStep(1); // Stay on step 1 view but expand/scroll to times? Can do split view.
    };

    const handleSlotSelect = (slot: AvailabilitySlot) => {
        setSelectedSlot(slot);
        setStep(2); // Move to form
    };

    const handleBook = async (formData: BookingFormData) => {
        if (!selectedSlot || !selectedDate) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/book-call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slotId: selectedSlot.id,
                    ...formData,
                    date: selectedSlot.date,
                    time: format(parseISO(selectedSlot.startTime), 'HH:mm'), // Send 24h format for simplicity
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Booking failed');

            setIsSuccess(true);
            toast.success('Booking confirmed!');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="max-w-xl mx-auto text-center py-20 px-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-4">Booking Confirmed!</h1>
                <p className="text-gray-600 text-lg mb-4">
                    We've scheduled your call for <strong>{selectedSlot?.date}</strong> at <strong>{format(parseISO(selectedSlot!.startTime), 'h:mm a')}</strong> ({userTimezone}).
                </p>
                <p className="text-gray-600 mb-8">
                    You'll receive an email from <strong>benderaiden826</strong> for confirmations and reminders automatically. This same system will be set up for your email sending with creators.
                </p>

                <button
                    onClick={() => window.location.href = '/'}
                    className="mt-8 px-8 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-all"
                >
                    Return Home
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                {/* Left Panel: Context or Calendar */}
                <div className="lg:col-span-4 space-y-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 mb-4">Book a Call</h1>
                        <p className="text-gray-600">
                            Schedule a 30-minute strategy session with our team. We'll discuss your goals and how Verality can accelerate your outreach.
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5" />
                            Select Date
                        </h3>
                        <SimpleCalendar
                            selectedDate={selectedDate}
                            onSelect={handleDateSelect}
                        />
                    </div>
                </div>

                {/* Right Panel: Times & Form */}
                <div className="lg:col-span-8">
                    {step === 1 && (
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                            {!selectedDate ? (
                                <div className="flex flex-col items-center justify-center h-[400px] text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                                    <CalendarIcon className="w-12 h-12 mb-4 opacity-20" />
                                    <p>Select a date to see available times</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-gray-400" />
                                            <h2 className="text-xl font-bold">Select a Time</h2>
                                        </div>
                                        {userTimezone && (
                                            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                                Times shown in {userTimezone}
                                            </div>
                                        )}
                                    </div>
                                    <TimeSlotPicker
                                        date={selectedDate}
                                        slots={availability}
                                        loading={loadingAvailability}
                                        onSelect={handleSlotSelect}
                                        selectedSlot={selectedSlot}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && selectedSlot && selectedDate && (
                        <BookingForm
                            onSubmit={handleBook}
                            isSubmitting={isSubmitting}
                            onBack={() => setStep(1)}
                            selectedDate={selectedDate}
                            selectedTime={format(parseISO(selectedSlot.startTime), 'h:mm a')}
                            userTimezone={userTimezone}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
