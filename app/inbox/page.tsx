"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import { RefreshCcw, Search, Trash2, StopCircle, PlayCircle, Mail, Phone, DollarSign, Sparkles, Zap } from "lucide-react";

interface EmailMessage {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  body: string;
  timestamp: string;
  isAI?: boolean;
  isUser?: boolean;
}

interface Reply {
  id: string;
  creatorName: string;
  creatorEmail: string;
  platform: string;
  subject: string;
  snippet: string;
  fullBody: string;
  tag: "interested" | "needs_followup" | "not_a_fit";
  receivedAt: string;
  threadId?: string;
  thread?: EmailMessage[];
  isNew?: boolean;
  isUnread?: boolean;
  insights?: {
    phone?: string;
    tiktok_rate?: number;
    sound_promo_rate?: number;
    key_points?: string[];
    intent?: string; // One of IntentState
  };
  connectedAccount?: string;
}

export default function InboxPage({ searchParams }: { searchParams: { demo?: string } }) {
  return (
    <SubscriptionGuard>
      <InboxContent searchParams={searchParams} />
    </SubscriptionGuard>
  );
}

function InboxContent({ searchParams }: { searchParams: { demo?: string } }) {
  const router = useRouter();
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReply, setSelectedReply] = useState<Reply | null>(null);
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");
  const [userId, setUserId] = useState<string | null>(null);

  // AI Status
  const [aiStatus, setAiStatus] = useState<'active' | 'paused'>('active');

  // Load Data
  const loadInbox = useCallback(async () => {
    setLoading(true);
    try {
      const { getCurrentUser } = await import("@/lib/auth-helpers");
      const user = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.uid);
      const token = await user.getIdToken();

      const response = await fetch('/api/gmail/messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.messages)) {
          const mapped: Reply[] = data.messages.map((msg: any) => ({
            id: msg.id,
            creatorName: msg.from.split('<')[0].replace(/"/g, '').trim(),
            creatorEmail: msg.from.match(/<([^>]+)>/)?.[1] || msg.from,
            platform: "Gmail",
            subject: msg.subject,
            snippet: msg.snippet,
            fullBody: msg.snippet,
            tag: "needs_followup",
            receivedAt: msg.timestamp,
            isNew: msg.isUnread,
            isUnread: msg.isUnread,
            threadId: msg.threadId,
            connectedAccount: msg.connectedAccount,
            insights: {
              ...msg.insights,
              key_points: msg.insights?.key_points || [],
              intent: msg.insights?.intent || 'unknown'
            },
            thread: msg.fullThread?.map((bm: any) => ({
              id: bm.id,
              from: bm.from,
              fromEmail: bm.fromEmail,
              subject: bm.subject,
              body: bm.body,
              timestamp: bm.timestamp,
              isUser: bm.isUser,
              isAI: bm.isAI
            })) || []
          }));
          setReplies(mapped);
        }
      }
    } catch (e) {
      console.error("Inbox load error", e);
      toast.error("Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  // Filter Logic
  const { inboxReplies, sentReplies } = useMemo(() => {
    const sorted = [...replies].sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

    const inbox = sorted.filter(r => {
      const lastMsg = r.thread && r.thread.length > 0 ? r.thread[r.thread.length - 1] : null;
      if (!lastMsg) return true; // Default to inbox if confusing
      return !lastMsg.isUser; // Reply is from Creator
    });

    const sent = sorted.filter(r => {
      const lastMsg = r.thread && r.thread.length > 0 ? r.thread[r.thread.length - 1] : null;
      if (!lastMsg) return false;
      return lastMsg.isUser; // Last msg is from Us
    });

    return { inboxReplies: inbox, sentReplies: sent };
  }, [replies]);

  const visibleReplies = activeTab === 'inbox' ? inboxReplies : sentReplies;

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const cleanBody = (text: string) => {
    if (!text) return "";
    let lines = text.split(/\r?\n/);
    const cleanLines = [];
    const footerTriggers = [
      /^Sent from my/i, /^Get Outlook/i, /^Unsubscribe/i, /^Manage preferences/i, /^--\s*$/, /^__\s*$/,
      /^Beyond Vision Ltd/i, /Limited is a company registered/i
    ];
    for (let line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('>')) continue;
      if (line.includes('On ') && line.includes('wrote:')) continue;
      if (footerTriggers.some(regex => regex.test(trimmed))) continue;
      cleanLines.push(line);
    }
    return cleanLines.join('\n').trim();
  };

  const toggleAIStatus = async () => {
    if (!selectedReply) return;
    const newStatus = aiStatus === 'active' ? 'paused' : 'active';
    setAiStatus(newStatus);
    toast.success(`AI ${newStatus === 'active' ? 'Resumed' : 'Paused'}`);
  };

  const handleDelete = async () => {
    if (!selectedReply || !confirm("Delete this thread permanently?")) return;

    // Optimistic delete
    const idToDelete = selectedReply.id;
    setReplies(prev => prev.filter(r => r.id !== idToDelete));
    setSelectedReply(null);

    // Actual API Call (Fire and forget essentially for UI snappiness)
    try {
      const { getCurrentUser } = await import("@/lib/auth-helpers");
      const user = await getCurrentUser();
      const token = await user?.getIdToken();
      await fetch(`/api/gmail/messages?id=${selectedReply.threadId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success("Thread deleted");
    } catch (e) {
      toast.error("Failed to delete thread on server");
    }
  };

  return (
    <main className="h-screen bg-[#F3F1EB] font-sans flex flex-col overflow-hidden relative">
      <Navbar />

      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] bg-gradient-to-br from-purple-100 via-pink-50 to-transparent blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[50%] bg-gradient-to-bl from-blue-100 via-teal-50 to-transparent blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-gradient-to-t from-emerald-50 via-green-50 to-transparent blur-[100px]" />
      </div>

      {/* Adjusted spacing pt-32 to fix overlap */}
      <div className="flex-1 flex pt-32 h-full relative z-10 px-6 pb-6 gap-6">

        {/* Sidebar (List) */}
        <div className="w-[380px] flex flex-col bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm flex-shrink-0 overflow-hidden">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-100 bg-white/50">
            <h1 className="text-2xl font-black mb-4 tracking-tight flex items-center gap-2">
              Inbox
              <span className="text-xs font-normal text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                {visibleReplies.length}
              </span>
            </h1>
            <div className="flex bg-gray-100/50 p-1 rounded-xl mb-3">
              <button
                onClick={() => setActiveTab('inbox')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'inbox' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
              >
                Inbox <span className="text-[10px] opacity-60">({inboxReplies.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'sent' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
              >
                Sent <span className="text-[10px] opacity-60">({sentReplies.length})</span>
              </button>
            </div>
            <button
              onClick={loadInbox}
              className="w-full py-2.5 flex items-center justify-center gap-2 text-gray-600 hover:bg-white rounded-xl text-sm border border-transparent hover:border-gray-200 transition-all font-semibold"
            >
              {loading ? <div className="w-4 h-4 border-2 border-gray-400 border-t-black rounded-full animate-spin" /> : <RefreshCcw size={14} />}
              <span>Sync Emails</span>
            </button>
          </div>

          {/* List Items */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading && replies.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">Loading conversations...</div>
            ) : visibleReplies.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center">
                <Mail className="w-8 h-8 opacity-20 mb-2" />
                No emails found in {activeTab}.
              </div>
            ) : (
              visibleReplies.map(reply => (
                <div
                  key={reply.id}
                  onClick={() => setSelectedReply(reply)}
                  className={`p-4 border-b border-gray-100/50 cursor-pointer hover:bg-white/50 transition-all ${selectedReply?.id === reply.id ? 'bg-white border-l-4 border-l-black shadow-sm' : 'bg-transparent border-l-4 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <h3 className={`font-bold text-sm truncate pr-2 ${reply.isUnread ? 'text-black' : 'text-gray-700'}`}>{reply.creatorName}</h3>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatTimestamp(reply.receivedAt).split(',')[0]}</span>
                  </div>
                  <p className={`text-xs truncate mb-1.5 ${reply.isUnread ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>{reply.subject}</p>
                  <div className="flex items-center gap-2 mb-1.5">
                    {reply.connectedAccount && (
                      <span className="text-[9px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-wider truncate max-w-[120px]">
                        via {reply.connectedAccount.split('@')[0]}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{reply.snippet}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content (Detail) + Insights */}
        <div className="flex-1 flex gap-6 min-w-0">

          {/* Message Thread */}
          <div className="flex-1 bg-white/80 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm flex flex-col overflow-hidden">
            {selectedReply ? (
              <>
                {/* Conversation Header */}
                <div className="h-20 border-b border-gray-100 flex items-center justify-between px-8 bg-white/50 shrink-0">
                  <div>
                    <h2 className="font-bold text-xl tracking-tight text-gray-900">{selectedReply.creatorName}</h2>
                    <p className="text-xs text-gray-500 font-mono tracking-wide">{selectedReply.creatorEmail}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleAIStatus}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all ${aiStatus === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                    >
                      {aiStatus === 'active' ? <StopCircle size={14} /> : <PlayCircle size={14} />}
                      {aiStatus === 'active' ? 'AI ACTIVE' : 'AI PAUSED'}
                    </button>
                    <button
                      onClick={handleDelete}
                      className="p-2.5 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors border border-gray-100"
                      title="Delete Thread"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Thread View */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  {selectedReply.thread && selectedReply.thread.length > 0 ? selectedReply.thread.map((msg, i) => (
                    <div key={i} className={`flex flex-col max-w-[85%] ${msg.isUser || msg.isAI ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                      <div className={`p-6 rounded-3xl shadow-sm text-sm border relative ${msg.isAI ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white border-transparent rounded-br-sm' :
                        msg.isUser ? 'bg-white text-gray-900 border-gray-100 rounded-br-sm' :
                          'bg-white border-gray-100 text-gray-800 rounded-bl-sm shadow-md'
                        }`}>
                        {msg.isAI && (
                          <div className="absolute -top-3 left-6 bg-white text-purple-600 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 border border-purple-100">
                            <Sparkles size={10} /> AI
                          </div>
                        )}
                        <div className={`whitespace-pre-wrap leading-relaxed ${msg.isAI ? 'text-purple-50' : ''}`}>{cleanBody(msg.body)}</div>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-2 px-2 font-medium">{formatTimestamp(msg.timestamp)} • {msg.from}</span>
                    </div>
                  )) : (
                    <div className="text-center text-gray-400 mt-20">Loading messages...</div>
                  )}
                </div>

                {/* Reply Box Placeholder */}
                <div className="p-6 border-t border-gray-100 bg-white/50">
                  <div className="relative">
                    <input
                      disabled
                      type="text"
                      placeholder="AI is handling this conversation..."
                      className="w-full pl-6 pr-16 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 disabled:opacity-60 disabled:cursor-not-allowed font-medium text-gray-500 shadow-inner"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 px-2 py-1 border border-gray-200 rounded-lg bg-white uppercase tracking-wider">
                      Auto-Pilot
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-white/50">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                  <Search size={32} className="opacity-20 text-gray-900" />
                </div>
                <p className="text-gray-400 font-medium">Select a conversation to view details</p>
              </div>
            )}
          </div>

          {/* Insights Panel (Right Side) - ONLY show if a reply is selected */}
          {selectedReply && (
            <div className="w-[300px] flex flex-col gap-4">
              {/* AI Extraction Card */}
              <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl p-6 shadow-sm">
                <h3 className="font-black text-sm uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                  <Sparkles size={14} className="text-purple-500" />
                  AI Insights
                </h3>

                <div className="space-y-4">

                  {/* Detected Intent */}
                  <div className={`p-4 rounded-xl border-2 flex items-center justify-between shadow-sm transition-all ${selectedReply.insights?.intent === 'price_inquiry' ? 'bg-green-50 border-green-200' :
                      selectedReply.insights?.intent === 'interested' ? 'bg-yellow-50 border-yellow-200' :
                        selectedReply.insights?.intent === 'interested_but_busy' ? 'bg-orange-50 border-orange-200' :
                          selectedReply.insights?.intent === 'not_interested' ? 'bg-red-50 border-red-100' :
                            selectedReply.insights?.intent === 'agency_response' ? 'bg-purple-50 border-purple-200' :
                              'bg-white border-gray-100'
                    }`}>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5">
                        Detected Intent
                      </div>
                      <div className={`text-sm font-black ${selectedReply.insights?.intent === 'price_inquiry' ? 'text-green-700' :
                          selectedReply.insights?.intent === 'interested' ? 'text-yellow-700' :
                            selectedReply.insights?.intent === 'interested_but_busy' ? 'text-orange-700' :
                              selectedReply.insights?.intent === 'not_interested' ? 'text-red-500' :
                                selectedReply.insights?.intent === 'agency_response' ? 'text-purple-700' :
                                  'text-gray-700'
                        }`}>
                        {selectedReply.insights?.intent === 'price_inquiry' && '💰 Price Inquiry'}
                        {selectedReply.insights?.intent === 'interested' && '⭐ Interested'}
                        {selectedReply.insights?.intent === 'interested_but_busy' && '🕒 Interested (Busy)'}
                        {selectedReply.insights?.intent === 'needs_more_info' && '❓ Needs Info'}
                        {selectedReply.insights?.intent === 'agency_response' && '🏢 Agency'}
                        {selectedReply.insights?.intent === 'not_interested' && '❌ Not Interested'}
                        {selectedReply.insights?.intent === 'out_of_office' && '🌴 OOO'}
                        {(selectedReply.insights?.intent === 'unknown' || !selectedReply.insights?.intent) && '⚪ Analyzing...'}
                      </div>
                    </div>
                  </div>

                  {/* Key Points Section */}
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-all hover:scale-[1.02]">
                    <div className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
                      <Zap size={12} /> Key Points
                    </div>
                    {selectedReply.insights?.key_points && selectedReply.insights.key_points.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {selectedReply.insights.key_points.map((point, idx) => (
                          <li key={idx} className="text-xs font-medium text-gray-700 leading-relaxed">
                            {point}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-300 italic font-sans text-xs">AI analyzing conversation...</span>
                    )}
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-all hover:scale-[1.02]">
                    <div className="text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1">
                      <Phone size={12} /> Phone Number
                    </div>
                    <div className="font-mono text-sm font-bold text-gray-800 break-all">
                      {selectedReply.insights?.phone || (
                        <span className="text-gray-300 italic font-sans text-xs">Waiting for reply...</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-all hover:scale-[1.02]">
                    <div className="text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1">
                      <DollarSign size={12} /> TikTok Rate
                    </div>
                    <div className="font-bold text-gray-800">
                      {selectedReply.insights?.tiktok_rate ? `$${selectedReply.insights.tiktok_rate}` : (
                        <span className="text-gray-300 italic font-normal text-xs">Negotiating...</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-all hover:scale-[1.02]">
                    <div className="text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1">
                      <DollarSign size={12} /> Sound Promo Rate
                    </div>
                    <div className="font-bold text-gray-800">
                      {selectedReply.insights?.sound_promo_rate ? `$${selectedReply.insights.sound_promo_rate}` : (
                        <span className="text-gray-300 italic font-normal text-xs">Negotiating...</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Deal Tracking Actions */}
              <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-6 shadow-lg text-white space-y-3">
                <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <DollarSign size={16} />
                  Deal Tracking
                </h3>
                <p className="text-xs text-purple-100 mb-4">Mark this conversation&apos;s status for outcome metrics</p>

                <button
                  onClick={async () => {
                    if (!selectedReply?.threadId) return;
                    const toastId = toast.loading('Marking as deal...');
                    try {
                      const { getCurrentUser } = await import("@/lib/auth-helpers");
                      const user = await getCurrentUser();
                      const token = await user?.getIdToken();

                      const res = await fetch('/api/user/threads/mark-deal', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ threadId: selectedReply.threadId })
                      });

                      const data = await res.json();
                      if (data.success) {
                        toast.success('Marked as deal started! 🎉', { id: toastId });
                      } else {
                        toast.error('Failed to mark as deal', { id: toastId });
                      }
                    } catch (e) {
                      toast.error('Error marking as deal', { id: toastId });
                    }
                  }}
                  className="w-full py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
                >
                  <DollarSign size={16} />
                  Mark as Deal Started
                </button>

                <button
                  onClick={async () => {
                    if (!selectedReply?.threadId) return;
                    const toastId = toast.loading('Marking as interested...');
                    try {
                      const { getCurrentUser } = await import("@/lib/auth-helpers");
                      const user = await getCurrentUser();
                      const token = await user?.getIdToken();

                      const res = await fetch('/api/user/threads/mark-interested', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ threadId: selectedReply.threadId })
                      });

                      const data = await res.json();
                      if (data.success) {
                        toast.success('Marked as interested! ✨', { id: toastId });
                      } else {
                        toast.error('Failed to mark as interested', { id: toastId });
                      }
                    } catch (e) {
                      toast.error('Error marking as interested', { id: toastId });
                    }
                  }}
                  className="w-full py-3 bg-white/20 text-white border-2 border-white/30 rounded-xl font-bold hover:bg-white/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} />
                  Mark as Interested
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
