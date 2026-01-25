/**
 * A/B Test Toggle Component
 * Simple UI for enabling A/B tests on campaigns
 */

"use client";

import { useState } from "react";
import { FlaskConical, Sparkles } from "lucide-react";
import { ABTestConfig } from "@/lib/types";

interface ABTestToggleProps {
    value: ABTestConfig | undefined;
    onChange: (config: ABTestConfig | undefined) => void;
}

export default function ABTestToggle({ value, onChange }: ABTestToggleProps) {
    const [enabled, setEnabled] = useState(value?.enabled || false);

    const handleToggle = () => {
        const newEnabled = !enabled;
        setEnabled(newEnabled);

        if (newEnabled) {
            onChange({
                enabled: true,
                variant_a: {
                    subject_line: '',
                    cta_text: ''
                },
                variant_b: {
                    subject_line: '',
                    cta_text: ''
                }
            });
        } else {
            onChange(undefined);
        }
    };

    const handleVariantChange = (variant: 'A' | 'B', field: 'subject_line' | 'cta_text', newValue: string) => {
        if (!value) return;

        const updated = { ...value };
        if (variant === 'A') {
            updated.variant_a = { ...updated.variant_a, [field]: newValue };
        } else {
            updated.variant_b = { ...updated.variant_b, [field]: newValue };
        }
        onChange(updated);
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-100 p-6">
            {/* Toggle Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <FlaskConical className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-black">A/B Testing</h3>
                        <p className="text-xs text-gray-600">Test different subject lines and CTAs</p>
                    </div>
                </div>
                <button
                    onClick={handleToggle}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out relative ${enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>

            {/* Variant Inputs */}
            {enabled && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Variant A */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-sm font-black text-blue-600">A</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900">Variant A</span>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Subject Line
                                </label>
                                <input
                                    type="text"
                                    value={value?.variant_a.subject_line || ''}
                                    onChange={(e) => handleVariantChange('A', 'subject_line', e.target.value)}
                                    placeholder="e.g., Quick collaboration opportunity"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    CTA Text (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={value?.variant_a.cta_text || ''}
                                    onChange={(e) => handleVariantChange('A', 'cta_text', e.target.value)}
                                    placeholder="e.g., Let me know your rate"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Variant B */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-sm font-black text-purple-600">B</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900">Variant B</span>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Subject Line
                                </label>
                                <input
                                    type="text"
                                    value={value?.variant_b.subject_line || ''}
                                    onChange={(e) => handleVariantChange('B', 'subject_line', e.target.value)}
                                    placeholder="e.g., Partnership with [Brand]"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    CTA Text (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={value?.variant_b.cta_text || ''}
                                    onChange={(e) => handleVariantChange('B', 'cta_text', e.target.value)}
                                    placeholder="e.g., Are you available for a campaign?"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-indigo-600 rounded-lg p-4 flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-white">
                            <p className="font-bold mb-1">AI will learn your best outreach</p>
                            <p className="text-indigo-100 text-xs leading-relaxed">
                                Emails will be randomly split 50/50 between variants.
                                We&apos;ll show you which performs better so you can optimize over time.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
