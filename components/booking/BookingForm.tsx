
"use client";

import { useState } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';

export interface BookingFormData {
    name: string;
    email: string;
    company: string;
    selectedTierGuess: string;
}

interface BookingFormProps {
    onSubmit: (data: BookingFormData) => Promise<void>;
    isSubmitting: boolean;
    onBack: () => void;
    selectedDate: Date;
    selectedTime: string;
}

export default function BookingForm({ onSubmit, isSubmitting, onBack, selectedDate, selectedTime }: BookingFormProps) {
    const [formData, setFormData] = useState<BookingFormData>({
        name: '',
        email: '',
        company: '',
        selectedTierGuess: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="mb-6 pb-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Final Details</h3>
                <p className="text-gray-500 text-sm">You're booking a call for <strong>{selectedTime}</strong> on <strong>{selectedDate.toLocaleDateString()}</strong>.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-black"
                        placeholder="John Doe"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                    <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-black"
                        placeholder="john@example.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
                    <input
                        type="text"
                        name="company"
                        required
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-black"
                        placeholder="Acme Inc."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Estimated Monthly Budget (Optional)</label>
                    <select
                        name="selectedTierGuess"
                        value={formData.selectedTierGuess}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all bg-white text-black"
                    >
                        <option value="">Select a range...</option>
                        <option value="under_1k">Under $1k</option>
                        <option value="1k_3k">$1k - $3k</option>
                        <option value="3k_5k">$3k - $5k</option>
                        <option value="5k_plus">$5k+</option>
                    </select>
                </div>
            </div>

            <div className="flex gap-3 mt-8 pt-4 border-t border-gray-50">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                >
                    Back
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Booking...
                        </>
                    ) : (
                        <>
                            Confirm Booking
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
