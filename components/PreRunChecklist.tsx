
"use client";

import { useState, useEffect } from 'react';
import { CampaignContext, ValidationResult, ValidationStepResult } from '@/lib/services/campaign-validator';

interface PreRunChecklistProps {
    context: CampaignContext;
    onValidationComplete?: (result: ValidationResult) => void;
    onCancel: () => void;
}

export default function PreRunChecklist({ context, onValidationComplete, onCancel }: PreRunChecklistProps) {
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<ValidationResult | null>(null);
    const [dots, setDots] = useState(".");

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? "." : prev + ".");
        }, 500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        async function runValidation() {
            try {
                const res = await fetch('/api/campaign/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(context)
                });
                const data = await res.json();
                if (data.success) {
                    setResult(data.result);
                    // Simulate a small delay for "AI processing" feel if it was too fast
                    setTimeout(() => {
                        setLoading(false);
                        if (onValidationComplete) onValidationComplete(data.result);
                    }, 800);
                } else {
                    // Handle error
                    setLoading(false);
                }
            } catch (e) {
                console.error(e);
                setLoading(false);
            }
        }

        runValidation();
    }, [context]);

    const StatusIcon = ({ status }: { status: string }) => {
        if (status === 'pass') return <span className="text-green-500 text-xl">✅</span>;
        if (status === 'fail') return <span className="text-red-500 text-xl">❌</span>;
        if (status === 'warn') return <span className="text-amber-500 text-xl">⚠️</span>;
        return <span className="text-gray-300">○</span>;
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-100">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                        <div className="absolute inset-0 border-4 border-blue-100 rounded-full animate-ping opacity-20"></div>
                        <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h2 className="text-2xl font-black text-[#1A1A1A] mb-2">Validating Campaign</h2>
                    <p className="text-gray-500 font-medium">AI is checking {10} critical points{dots}</p>

                    <div className="mt-8 space-y-2">
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-[prog_1.5s_ease-in-out_infinite]"></div>
                        </div>
                        <p className="text-xs text-gray-400">Checking compliance, credits, and recipients...</p>
                    </div>
                    <style jsx>{`
            @keyframes prog {
                0% { width: 0%; transform: translateX(-100%); }
                50% { width: 100%; transform: translateX(0%); }
                100% { width: 100%; transform: translateX(100%); }
            }
          `}</style>
                </div>
            </div>
        );
    }

    if (!result) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#FAFAFA] rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200 my-8">

                {/* Header */}
                <div className="bg-white p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-black text-[#1A1A1A]">Pre-Run Validation</h2>
                        <p className="text-sm text-gray-500 font-medium">Readiness Check Results</p>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">

                    {/* Top Result Banner */}
                    <div className={`p-6 rounded-2xl flex items-start gap-4 ${result.passed ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${result.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                            {result.passed ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            )}
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold mb-1 ${result.passed ? "text-green-900" : "text-red-900"}`}>
                                {result.passed ? "READY TO LAUNCH" : "CAMPAIGN BLOCKED"}
                            </h3>
                            <p className={`text-sm ${result.passed ? "text-green-700" : "text-red-700"}`}>
                                {result.blockReason || "All system checks passed. Your campaign is safe to run."}
                            </p>
                        </div>
                    </div>

                    {/* Checklist Items */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {result.steps.map((step) => (
                                <div key={step.stepId} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                                    <div className="mt-0.5"><StatusIcon status={step.status} /></div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <h4 className="font-bold text-[#1A1A1A] text-sm">{step.name}</h4>
                                            {step.status === 'fail' && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded uppercase">Critical</span>}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-0.5">{step.message}</p>
                                        {step.details && (
                                            <div className="mt-2 text-xs bg-gray-50 p-2 rounded border border-gray-100 text-gray-600 font-mono">
                                                {JSON.stringify(step.details, null, 2)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-colors"
                    >
                        {result.passed ? "Cancel" : "Fix Issues"}
                    </button>

                    {result.passed && (
                        <button
                            onClick={() => onValidationComplete && onValidationComplete(result)}
                            className="px-8 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-transform hover:scale-105 shadow-lg shadow-black/20 flex items-center gap-2"
                        >
                            <span>Launch Campaign</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
