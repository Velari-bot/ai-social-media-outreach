"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import { RefreshCcw, Search, Trash2, StopCircle, PlayCircle, Mail } from "lucide-react";

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
  const filteredReplies = useMemo(() => {
    let result = [...replies];
    if (activeTab === "inbox") {
      result = result.filter(r => {
        const lastMsg = r.thread && r.thread.length > 0 ? r.thread[r.thread.length - 1] : null;
        if (!lastMsg) return true;
        return !lastMsg.isUser;
      });
    } else {
      result = result.filter(r => {
        const lastMsg = r.thread && r.thread.length > 0 ? r.thread[r.thread.length - 1] : null;
        if (!lastMsg) return false;
        return lastMsg.isUser;
      });
    }
    result.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
    return result;
  }, [replies, activeTab]);

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
    if (!selectedReply || !confirm("Delete this thread?")) return;

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
    <main className="h-screen bg-white font-sans flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex-1 flex pt-20 h-full">
        {/* Sidebar (List) */}
        <div className="w-[350px] md:w-[400px] border-r border-gray-200 flex flex-col bg-gray-50 flex-shrink-0 z-20">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 bg-white shadow-sm z-10">
            <h1 className="text-2xl font-bold mb-4 tracking-tight">Inbox</h1>
            <div className="flex bg-gray-100 p-1 rounded-lg mb-2">
              <button
                onClick={() => setActiveTab('inbox')}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'inbox' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
              >
                Inbox
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'sent' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
              >
                Sent
              </button>
            </div>
            <button
              onClick={loadInbox}
              className="w-full py-2 flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm border border-transparent hover:border-gray-200 transition-all font-medium"
            >
              {loading ? <div className="w-4 h-4 border-2 border-gray-400 border-t-black rounded-full animate-spin" /> : <RefreshCcw size={14} />}
              <span>Sync Emails</span>
            </button>
          </div>

          {/* List Items */}
          <div className="flex-1 overflow-y-auto">
            {loading && replies.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">Loading conversations...</div>
            ) : filteredReplies.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center">
                <Mail className="w-8 h-8 opacity-20 mb-2" />
                No emails found in {activeTab}.
              </div>
            ) : (
              filteredReplies.map(reply => (
                <div
                  key={reply.id}
                  onClick={() => setSelectedReply(reply)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-white transition-all ${selectedReply?.id === reply.id ? 'bg-white border-l-4 border-l-black shadow-sm z-10 relative' : 'bg-transparent border-l-4 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-semibold text-sm truncate pr-2 ${reply.isUnread ? 'text-black' : 'text-gray-700'}`}>{reply.creatorName}</h3>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{formatTimestamp(reply.receivedAt).split(',')[0]}</span>
                  </div>
                  <p className={`text-xs truncate mb-1 ${reply.isUnread ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>{reply.subject}</p>
                  <p className="text-xs text-gray-400 line-clamp-2">{reply.snippet}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content (Detail) */}
        <div className="flex-1 bg-white flex flex-col min-w-0 z-10 relative">
          {selectedReply ? (
            <>
              {/* Conversation Header */}
              <div className="h-20 border-b border-gray-100 flex items-center justify-between px-8 bg-white shrink-0">
                <div>
                  <h2 className="font-bold text-xl tracking-tight">{selectedReply.creatorName}</h2>
                  <p className="text-xs text-gray-500 font-mono tracking-wide">{selectedReply.creatorEmail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleAIStatus}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all ${aiStatus === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                  >
                    {aiStatus === 'active' ? <StopCircle size={14} /> : <PlayCircle size={14} />}
                    {aiStatus === 'active' ? 'AI ACTIVE' : 'AI PAUSED'}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-lg transition-colors"
                    title="Delete Thread"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Thread View */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white custom-scrollbar">
                {selectedReply.thread && selectedReply.thread.length > 0 ? selectedReply.thread.map((msg, i) => (
                  <div key={i} className={`flex flex-col max-w-[85%] ${msg.isUser || msg.isAI ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                    <div className={`p-5 rounded-2xl shadow-sm text-sm border ${msg.isAI ? 'bg-purple-50 text-gray-900 border-purple-100 rounded-br-none' :
                        msg.isUser ? 'bg-gray-100 text-gray-900 border-gray-200 rounded-br-none' :
                          'bg-white border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                      }`}>
                      {msg.isAI && <div className="text-[10px] uppercase font-bold text-purple-600 mb-2 flex items-center gap-1 tracking-widest">✨ AI Generated</div>}
                      <div className="whitespace-pre-wrap leading-relaxed">{cleanBody(msg.body)}</div>
                    </div>
                    <span className="text-[10px] text-gray-300 mt-2 px-1 font-medium">{formatTimestamp(msg.timestamp)} • {msg.from}</span>
                  </div>
                )) : (
                  <div className="text-center text-gray-400 mt-20">Loading messages...</div>
                )}
              </div>

              {/* Reply Box Placeholder */}
              <div className="p-6 border-t border-gray-100 bg-white">
                <div className="relative">
                  <input
                    disabled
                    type="text"
                    placeholder="Manual typing disabled (AI Auto-Pilot Active)"
                    className="w-full pl-5 pr-12 py-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-gray-100 disabled:opacity-70 disabled:cursor-not-allowed font-medium text-gray-500"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300 px-2 py-1 border border-gray-200 rounded bg-white">
                    AUTO
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-gray-50/50">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                <Search size={32} className="opacity-20 text-gray-900" />
              </div>
              <p className="text-gray-400 font-medium">Select a conversation to view details</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
