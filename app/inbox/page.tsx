"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import SubscriptionGuard from "@/components/SubscriptionGuard";

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
  campaignName?: string;
  thread?: EmailMessage[];
  isNew?: boolean;
  isUnread?: boolean;
  hasNewReply?: boolean; // New reply in existing thread
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
  const [filter, setFilter] = useState<"all" | "new" | "unread" | "interested" | "needs_followup" | "not_a_fit">("new");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [userId, setUserId] = useState<string | null>(null);
  const [showThread, setShowThread] = useState(false);

  useEffect(() => {
    // Check for demo mode
    const demoMode = searchParams?.demo === "true";

    async function loadUserAndReplies() {
      if (demoMode) {
        setUserId("demo-user");
        // Mock replies
        const mockReplies: Reply[] = [
          {
            id: "1",
            creatorName: "Sarah Jenkins",
            creatorEmail: "sarah.content@gmail.com",
            platform: "Instagram",
            subject: "Re: Collaboration Proposal",
            snippet: "Hi! I'd love to hear more about your product. It fits my audience perfectly...",
            fullBody: "Hi,\n\nThanks for reaching out! I've taken a look at your website and I think your product would be a great fit for my audience. I typically work with brands in the lifestyle space.\n\nCould you send over more details about the campaign requirements and budget?\n\nBest,\nSarah",
            tag: "interested",
            receivedAt: new Date().toISOString(),
            campaignName: "Lifestyle Q1",
            isNew: true,
            isUnread: true,
            thread: [
              {
                id: "msg1",
                from: "AI Assistant",
                fromEmail: "ai@verality.io",
                subject: "Collaboration Proposal",
                body: "Hi Sarah,\n\nI love the content you're creating on Instagram! Your recent post about sustainable living really resonated with what we're building at Verality.\n\nWe'd love to chat about a potential partnership for our upcoming launch. Are you open to collaborations right now?\n\nBest,\nVerality Team",
                timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
                isAI: true,
                isUser: false
              },
              {
                id: "msg2",
                from: "Sarah Jenkins",
                fromEmail: "sarah.content@gmail.com",
                subject: "Re: Collaboration Proposal",
                body: "Hi,\n\nThanks for reaching out! I've taken a look at your website and I think your product would be a great fit for my audience. I typically work with brands in the lifestyle space.\n\nCould you send over more details about the campaign requirements and budget?\n\nBest,\nSarah",
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                isAI: false,
                isUser: false
              },
              {
                id: "msg3",
                from: "AI Assistant",
                fromEmail: "ai@verality.io",
                subject: "Re: Collaboration Proposal",
                body: "Hi Sarah,\n\nThat's great to hear! We're looking for 1 Reel and 3 Stories highlighting the product's daily use.\n\nOur budget for this campaign is in the range of $1,500 - $2,000. Does that align with your rates?\n\nBest,\nVerality Team",
                timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
                isAI: true,
                isUser: false
              },
              {
                id: "msg4",
                from: "Sarah Jenkins",
                fromEmail: "sarah.content@gmail.com",
                subject: "Re: Collaboration Proposal",
                body: "Yes, that fits within my rate card! I can send over my media kit. When are you looking to start?",
                timestamp: new Date().toISOString(),
                isAI: false,
                isUser: false
              }
            ]
          },
          {
            id: "2",
            creatorName: "TechReviews Daily",
            creatorEmail: "contact@techreviews.com",
            platform: "YouTube",
            subject: "Re: Partnership Inquiry",
            snippet: "What are your rates for a dedicated video vs integration?",
            fullBody: "Hello,\n\nWe are interested. Do you have a budget in mind? We usually charge $1500 for a dedicated review.\n\nThanks,\nMike",
            tag: "needs_followup",
            receivedAt: new Date(Date.now() - 3600000).toISOString(),
            campaignName: "Tech Launch",
            isNew: false,
            isUnread: false,
            thread: [
              {
                id: "msg2",
                from: "TechReviews Daily",
                fromEmail: "contact@techreviews.com",
                subject: "Re: Partnership Inquiry",
                body: "Hello,\n\nWe are interested. Do you have a budget in mind? We usually charge $1500 for a dedicated review.\n\nThanks,\nMike",
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                isUser: false
              }
            ]
          }
        ];
        setReplies(mockReplies);
        setLoading(false);
        return;
      }

      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          toast.error("Please log in to continue");
          router.push("/login");
          return;
        }

        setUserId(user.id);
        setReplies([]);
      } catch (error: any) {
        console.error("Error loading inbox:", error);
        toast.error("Failed to load inbox");
      } finally {
        setLoading(false);
      }
    }

    loadUserAndReplies();
  }, [router, searchParams]);

  const filteredReplies = useMemo(() => {
    let result = [...replies];

    // Apply filters
    if (filter === "new") {
      result = result.filter(r => r.isNew || r.hasNewReply);
    } else if (filter === "unread") {
      result = result.filter(r => r.isUnread);
    } else if (filter !== "all") {
      result = result.filter(r => r.tag === filter);
    }

    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.receivedAt).getTime();
      const dateB = new Date(b.receivedAt).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [replies, filter, sortBy]);

  const getTagColor = (tag: string) => {
    switch (tag) {
      case "interested":
        return "text-green-800 bg-green-100 border-green-200";
      case "needs_followup":
        return "text-yellow-800 bg-yellow-100 border-yellow-200";
      case "not_a_fit":
        return "text-gray-800 bg-gray-100 border-gray-200";
      default:
        return "text-gray-800 bg-gray-100 border-gray-200";
    }
  };

  const getTagLabel = (tag: string) => {
    switch (tag) {
      case "interested":
        return "Interested";
      case "needs_followup":
        return "Needs Follow-up";
      case "not_a_fit":
        return "Not a Fit";
      default:
        return tag;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleEmailClick = (reply: Reply) => {
    setSelectedReply(reply);
    setShowThread(true);
  };

  const handleBackToList = () => {
    setShowThread(false);
    setSelectedReply(null);
  };

  if (loading) {
    return (
      <main className="h-screen bg-[#F5F3EF] flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inbox...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F3EF] font-sans flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col pt-20">
        <div className="w-full px-4 sm:px-6 py-6">
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="mb-6 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-4xl sm:text-5xl font-black text-black mb-2 tracking-tight">Inbox</h1>
                  <p className="text-lg text-gray-700">
                    Review and manage replies from creators
                  </p>
                </div>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-black"
                >
                  Back to Dashboard
                </Link>
              </div>

              {/* Filters */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setFilter("new")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === "new"
                      ? "bg-black text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    New ({replies.filter(r => r.isNew || r.hasNewReply).length})
                  </button>
                  <button
                    onClick={() => setFilter("unread")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === "unread"
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    Unread ({replies.filter(r => r.isUnread).length})
                  </button>
                  <button
                    onClick={() => setFilter("all")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === "all"
                      ? "bg-gray-700 text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    All ({replies.length})
                  </button>
                  <button
                    onClick={() => setFilter("interested")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === "interested"
                      ? "bg-green-600 text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    Interested ({replies.filter(r => r.tag === "interested").length})
                  </button>
                  <button
                    onClick={() => setFilter("needs_followup")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === "needs_followup"
                      ? "bg-yellow-600 text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    Needs Follow-up ({replies.filter(r => r.tag === "needs_followup").length})
                  </button>
                  <button
                    onClick={() => setFilter("not_a_fit")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === "not_a_fit"
                      ? "bg-gray-600 text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    Not a Fit ({replies.filter(r => r.tag === "not_a_fit").length})
                  </button>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-black bg-white hover:bg-gray-50 focus:outline-none focus:border-black"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>

            {/* Content Area - Fixed Height */}
            <div className="flex-1 min-h-0">
              {!showThread ? (
                /* Email List View */
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
                  {filteredReplies.length > 0 ? (
                    <div className="flex-1 overflow-y-auto divide-y divide-gray-100 custom-scrollbar">
                      {filteredReplies.map((reply) => (
                        <button
                          key={reply.id}
                          onClick={() => {
                            handleEmailClick(reply);
                            // Mark as read when clicked
                            if (reply.isUnread || reply.isNew) {
                              reply.isUnread = false;
                              reply.isNew = false;
                              setReplies([...replies]);
                            }
                          }}
                          className={`w-full text-left p-5 hover:bg-gray-50 transition-colors ${selectedReply?.id === reply.id ? "bg-gray-50 border-l-4 border-black" : ""
                            } ${(reply.isNew || reply.hasNewReply || reply.isUnread)
                              ? "bg-blue-50 border-l-4 border-blue-500 font-semibold"
                              : ""
                            }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-black">
                                  {reply.creatorName}
                                </span>
                                {(reply.isNew || reply.hasNewReply) && (
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                )}
                                <span className="text-xs text-gray-500">{reply.creatorEmail}</span>
                              </div>
                              <div className={`text-sm mb-1 ${(reply.isNew || reply.hasNewReply || reply.isUnread) ? "text-black font-medium" : "text-gray-600"}`}>
                                {reply.hasNewReply && <span className="text-blue-600 font-semibold mr-2">Re:</span>}
                                {reply.subject}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTagColor(reply.tag)}`}>
                                {getTagLabel(reply.tag)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{reply.snippet}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              {reply.platform}
                            </span>
                            <span>{formatTimeAgo(reply.receivedAt)}</span>
                            {reply.campaignName && (
                              <span className="text-gray-400">• {reply.campaignName}</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-12 text-center">
                      <div>
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-600">No replies yet. Check back soon!</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedReply && selectedReply.thread ? (
                /* Thread View */
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
                  {/* Thread Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-black">{selectedReply.creatorName}</h2>
                        <p className="text-sm text-gray-600">{selectedReply.creatorEmail}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTagColor(selectedReply.tag)}`}>
                        {getTagLabel(selectedReply.tag)}
                      </span>
                    </div>
                    <button
                      onClick={handleBackToList}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-black"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back
                    </button>
                  </div>

                  {/* Thread Messages - Scrollable */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {selectedReply.thread.map((message, index) => (
                      <div
                        key={message.id}
                        className={`p-4 rounded-xl ${message.isAI
                          ? "bg-purple-50 border border-purple-200"
                          : message.isUser
                            ? "bg-blue-50 border border-blue-200"
                            : "bg-gray-50 border border-gray-200"
                          }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${message.isAI
                              ? "bg-purple-600 text-white"
                              : message.isUser
                                ? "bg-blue-600 text-white"
                                : "bg-gray-600 text-white"
                              }`}>
                              {message.isAI ? "AI" : message.isUser ? "U" : message.from.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-black">{message.from}</div>
                              <div className="text-xs text-gray-500">{message.fromEmail}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</div>
                        </div>
                        <div className="text-sm font-medium text-black mb-2">{message.subject}</div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">{message.body}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
