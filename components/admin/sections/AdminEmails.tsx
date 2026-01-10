
"use client";

import { useState, useEffect, useRef } from 'react';
import {
    Mail,
    Play,
    Square,
    RefreshCcw,
    Bot,
    MessageSquare,
    Settings,
    Activity,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LogEntry {
    time: string;
    type: 'info' | 'success' | 'error';
    message: string;
}

export default function AdminEmails() {
    const [isRunning, setIsRunning] = useState(false);
    const [lastRun, setLastRun] = useState<string | null>(null);
    const [stats, setStats] = useState({ checked: 0, replied: 0 });
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [intervalSeconds, setIntervalSeconds] = useState(30);
    const [targetEmail, setTargetEmail] = useState('benderaiden826@gmail.com');

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
        const entry = {
            time: new Date().toLocaleTimeString(),
            type,
            message
        };
        setLogs(prev => [entry, ...prev].slice(0, 50));
    };

    const runProcessor = async (bypassDelay?: boolean) => {
        addLog(`Running auto-responder for ${targetEmail}${bypassDelay ? ' (No Delay)' : ''}...`);
        try {
            const res = await fetch('/api/admin/auto-responder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'process', targetEmail, skipDelay: !!bypassDelay })
            });
            const data = await res.json();

            if (data.success) {
                setStats(prev => ({
                    checked: prev.checked + (data.threadsChecked || 0),
                    replied: prev.replied + (data.replied || 0)
                }));
                setLastRun(new Date().toLocaleTimeString());

                if (data.replied > 0) {
                    addLog(`Success: Replied to ${data.replied} message(s).`, 'success');
                    toast.success(`Sent ${data.replied} AI replies`);
                } else if (data.pending > 0) {
                    addLog(`Check complete. ${data.pending} messages pending (waiting for human-like delay).`);
                } else {
                    addLog(`Check complete. No new messages needing AI reply.`);
                }
            } else {
                addLog(`Error: ${data.error || 'Unknown error'}`, 'error');
            }
        } catch (err: any) {
            addLog(`Failed to connect: ${err.message}`, 'error');
        }
    };

    const toggleResponder = () => {
        if (isRunning) {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsRunning(false);
            addLog("Auto-responder STOPPED", "error");
            toast.error("Auto responder stopped");
        } else {
            setIsRunning(true);
            addLog(`Auto-responder STARTED (Interval: ${intervalSeconds}s)`, "success");
            toast.success("Auto responder started");

            // Run immediately
            runProcessor();

            // Set interval
            timerRef.current = setInterval(runProcessor, intervalSeconds * 1000);
        }
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const handleSimulate = async () => {
        const email = prompt("Enter test creator email:", "jlbender2005@gmail.com");
        if (!email) return;

        addLog(`Simulating outreach to ${email}...`);
        try {
            const res = await fetch('/api/admin/auto-responder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'simulate', targetEmail, creatorEmail: email })
            });
            const data = await res.json();
            if (data.success) {
                addLog(`Simulate SUCCESS: Message sent to ${email}`, 'success');
                toast.success("Test outreach sent!");
            } else {
                addLog(`Simulate FAILED: ${data.error}`, 'error');
            }
        } catch (err: any) {
            addLog(`Error: ${err.message}`, 'error');
        }
    };

    const handleReset = async () => {
        if (!confirm("Are you sure you want to mark all VERALITY_AI threads as unread?")) return;

        addLog(`Resetting thread statuses...`);
        try {
            const res = await fetch('/api/admin/auto-responder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset', targetEmail })
            });
            const data = await res.json();
            if (data.success) {
                addLog(`Reset SUCCESS: ${data.reset} messages marked as unread`, 'success');
                toast.success(`Reset ${data.reset} messages`);
            } else {
                addLog(`Reset FAILED: ${data.error}`, 'error');
            }
        } catch (err: any) {
            addLog(`Error: ${err.message}`, 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-black mb-1">Email Automation</h2>
                    <p className="text-gray-500">Manage 24/7 AI Auto-Responder and Test Flows</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => runProcessor(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-bold text-black"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Run Once
                    </button>
                    <button
                        onClick={toggleResponder}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg ${isRunning
                            ? "bg-red-500 text-white shadow-red-500/20 hover:bg-red-600"
                            : "bg-black text-white shadow-black/20 hover:bg-gray-800"
                            }`}
                    >
                        {isRunning ? (
                            <><Square className="w-4 h-4 fill-current" /> Stop Responder</>
                        ) : (
                            <><Play className="w-4 h-4 fill-current" /> Start Responder</>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4 text-gray-400">
                            <Activity className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">System Status</span>
                        </div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`w-3 h-3 rounded-full ${isRunning ? "bg-green-500 animate-pulse" : "bg-gray-300"}`}></div>
                            <span className="text-2xl font-black text-black">{isRunning ? "LIVE & ACTIVE" : "INACTIVE"}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Threads Checked</span>
                            <span className="font-bold text-black">{stats.checked}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">AI Replies Sent</span>
                            <span className="font-bold text-green-600">{stats.replied}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Last Pulse</span>
                            <span className="font-mono text-black">{lastRun || "Never"}</span>
                        </div>
                    </div>
                </div>

                {/* Configuration Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6 text-gray-400">
                        <Settings className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Configuration</span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Target Inbox Email</label>
                            <input
                                type="email"
                                value={targetEmail}
                                onChange={(e) => setTargetEmail(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black font-medium focus:outline-none focus:ring-2 focus:ring-black/5"
                                placeholder="e.g. admin@verality.io"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Polling Interval (Seconds)</label>
                            <input
                                type="number"
                                value={intervalSeconds}
                                onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                                disabled={isRunning}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black font-medium focus:outline-none focus:ring-2 focus:ring-black/5"
                                min="10"
                            />
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mt-4">
                            <div className="flex gap-2">
                                <Bot className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                                    <strong className="text-blue-900">AI Mode:</strong> Responder will only reply to threads with the <code className="bg-blue-100 px-1 rounded">VERALITY_AI</code> label and where the last message is from a creator.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tools Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6 text-gray-400">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Test Utilities</span>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleSimulate}
                            className="w-full text-left p-4 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group"
                        >
                            <div className="font-bold text-sm mb-1 text-black group-hover:text-blue-600">Simulate Outreach Email</div>
                            <p className="text-xs text-gray-600">Send a fresh AI email to a test creator to start a thread.</p>
                        </button>
                        <button
                            onClick={handleReset}
                            className="w-full text-left p-4 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group"
                        >
                            <div className="font-bold text-sm mb-1 text-black group-hover:text-blue-600">Reset Label Status</div>
                            <p className="text-xs text-gray-600">Mark all threads with VERALITY_AI label as unread for testing.</p>
                        </button>
                    </div>
                </div>
            </div>

            {/* Console / Logs */}
            <div className="bg-[#1A1A1A] rounded-3xl shadow-xl overflow-hidden border border-white/5">
                <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-black text-white uppercase tracking-widest">Automation Logs</span>
                    </div>
                    <button
                        onClick={() => setLogs([])}
                        className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors"
                    >
                        CLEAR CONSOLE
                    </button>
                </div>
                <div className="p-6 h-[300px] overflow-y-auto font-mono text-sm space-y-2 custom-scrollbar">
                    {logs.length > 0 ? (
                        logs.map((log, i) => (
                            <div key={i} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                <span className="text-gray-600 flex-shrink-0">[{log.time}]</span>
                                <span className={
                                    log.type === 'success' ? 'text-green-400' :
                                        log.type === 'error' ? 'text-red-400' :
                                            'text-blue-300'
                                }>
                                    {log.type === 'info' ? '➜' : log.type === 'success' ? '✔' : '✘'}
                                </span>
                                <span className="text-gray-300 whitespace-pre-wrap">{log.message}</span>
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-3">
                            <Bot className="w-8 h-8 opacity-20" />
                            <p className="text-xs">Waiting for system start...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
