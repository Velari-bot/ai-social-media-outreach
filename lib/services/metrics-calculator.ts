/**
 * Outcome-Level Metrics Calculator
 * Calculates key business metrics for predictability
 */

import { db } from '../firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export interface OutcomeMetrics {
    // Core Conversion Metrics
    repliesPer100Emails: number;
    interestedPer100Replies: number;
    dealsStarted: number;
    avgTimeToFirstReply: number; // in hours

    // Raw Counts (for display)
    totalEmailsSent: number;
    totalRepliesReceived: number;
    totalInterested: number;

    // Additional Context
    conversionRate: number; // emails -> deals
    replyRate: number; // percentage
}

/**
 * Calculate outcome metrics for a user
 */
export async function calculateOutcomeMetrics(userId: string): Promise<OutcomeMetrics> {
    // Get all email threads for this user
    const threadsSnapshot = await db.collection('email_threads')
        .where('user_id', '==', userId)
        .get();

    const threads = threadsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    // Get all outreach queue items (sent emails)
    const queueSnapshot = await db.collection('outreach_queue')
        .where('user_id', '==', userId)
        .where('status', '==', 'sent')
        .get();

    const sentEmails = queueSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    // Calculate metrics
    const totalEmailsSent = sentEmails.length;

    // Count replies (threads where creator replied at least once)
    const repliedThreads = threads.filter((t: any) =>
        t.last_message_from === 'creator' || t.ai_reply_count > 0
    );
    const totalRepliesReceived = repliedThreads.length;

    // Count interested (threads marked as interested or deal_started)
    const interestedThreads = threads.filter((t: any) =>
        t.status === 'interested' || t.deal_started === true
    );
    const totalInterested = interestedThreads.length;

    // Count deals started
    const dealsStarted = threads.filter((t: any) => t.deal_started === true).length;

    // Calculate average time to first reply
    let totalReplyTime = 0;
    let replyTimeCount = 0;

    for (const thread of repliedThreads) {
        const threadData = thread as any;

        // Find the corresponding sent email
        const sentEmail = sentEmails.find((e: any) =>
            e.gmail_thread_id === threadData.id ||
            e.creator_email === threadData.creator_email
        );

        if (sentEmail && threadData.last_message_at) {
            const sentTime = (sentEmail as any).sent_at?.toDate?.() || new Date((sentEmail as any).sent_at);
            const replyTime = threadData.last_message_at?.toDate?.() || new Date(threadData.last_message_at);

            const diffMs = replyTime.getTime() - sentTime.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffHours > 0 && diffHours < 720) { // Ignore outliers (> 30 days)
                totalReplyTime += diffHours;
                replyTimeCount++;
            }
        }
    }

    const avgTimeToFirstReply = replyTimeCount > 0
        ? Math.round(totalReplyTime / replyTimeCount)
        : 0;

    // Calculate conversion rates
    const repliesPer100Emails = totalEmailsSent > 0
        ? (totalRepliesReceived / totalEmailsSent) * 100
        : 0;

    const interestedPer100Replies = totalRepliesReceived > 0
        ? (totalInterested / totalRepliesReceived) * 100
        : 0;

    const replyRate = totalEmailsSent > 0
        ? (totalRepliesReceived / totalEmailsSent) * 100
        : 0;

    const conversionRate = totalEmailsSent > 0
        ? (dealsStarted / totalEmailsSent) * 100
        : 0;

    return {
        repliesPer100Emails: Math.round(repliesPer100Emails * 10) / 10,
        interestedPer100Replies: Math.round(interestedPer100Replies * 10) / 10,
        dealsStarted,
        avgTimeToFirstReply,
        totalEmailsSent,
        totalRepliesReceived,
        totalInterested,
        conversionRate: Math.round(conversionRate * 10) / 10,
        replyRate: Math.round(replyRate * 10) / 10
    };
}

/**
 * Mark a thread as "deal started"
 */
export async function markThreadAsDeal(threadId: string, userId: string): Promise<boolean> {
    try {
        const threadRef = db.collection('email_threads').doc(threadId);
        const threadDoc = await threadRef.get();

        if (!threadDoc.exists) {
            throw new Error('Thread not found');
        }

        const threadData = threadDoc.data();
        if (threadData?.user_id !== userId) {
            throw new Error('Unauthorized');
        }

        await threadRef.update({
            deal_started: true,
            status: 'deal',
            deal_started_at: Timestamp.now(),
            updated_at: Timestamp.now()
        });

        return true;
    } catch (error) {
        console.error('[Metrics] Error marking thread as deal:', error);
        return false;
    }
}

/**
 * Mark a thread as "interested"
 */
export async function markThreadAsInterested(threadId: string, userId: string): Promise<boolean> {
    try {
        const threadRef = db.collection('email_threads').doc(threadId);
        const threadDoc = await threadRef.get();

        if (!threadDoc.exists) {
            throw new Error('Thread not found');
        }

        const threadData = threadDoc.data();
        if (threadData?.user_id !== userId) {
            throw new Error('Unauthorized');
        }

        await threadRef.update({
            status: 'interested',
            marked_interested_at: Timestamp.now(),
            updated_at: Timestamp.now()
        });

        return true;
    } catch (error) {
        console.error('[Metrics] Error marking thread as interested:', error);
        return false;
    }
}
