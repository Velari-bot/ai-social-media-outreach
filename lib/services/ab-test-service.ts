/**
 * A/B Testing Service
 * Handles variant assignment and performance tracking
 */

import { db } from '../firebase-admin';
import { ABTestConfig } from '../types';

/**
 * Randomly assign a variant (A or B) at send time
 */
export function assignVariant(): 'A' | 'B' {
    return Math.random() < 0.5 ? 'A' : 'B';
}

/**
 * Get variant content for email generation
 */
export function getVariantContent(
    abTest: ABTestConfig | undefined,
    variant: 'A' | 'B',
    defaultSubject?: string,
    defaultBody?: string
): {
    subject: string | undefined;
    cta: string | undefined;
    body: string | undefined;
} {
    if (!abTest || !abTest.enabled) {
        return {
            subject: defaultSubject,
            cta: undefined,
            body: defaultBody
        };
    }

    const variantConfig = variant === 'A' ? abTest.variant_a : abTest.variant_b;

    return {
        subject: variantConfig.subject_line || defaultSubject,
        cta: variantConfig.cta_text,
        body: variantConfig.email_body || defaultBody
    };
}

/**
 * Calculate A/B test results for a campaign
 */
export async function calculateABTestResults(campaignId: string): Promise<ABTestConfig | null> {
    try {
        // Get campaign
        const campaignDoc = await db.collection('creator_requests').doc(campaignId).get();
        if (!campaignDoc.exists) {
            return null;
        }

        const campaignData = campaignDoc.data();
        const abTest = campaignData?.ab_test as ABTestConfig | undefined;

        if (!abTest || !abTest.enabled) {
            return null;
        }

        // Get all emails sent for this campaign
        const queueSnapshot = await db.collection('outreach_queue')
            .where('campaign_id', '==', campaignId)
            .where('status', '==', 'sent')
            .get();

        let variantASent = 0;
        let variantBSent = 0;

        const threadIds: { A: string[], B: string[] } = { A: [], B: [] };

        queueSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const variant = data.ab_test_variant as 'A' | 'B' | undefined;

            if (variant === 'A') {
                variantASent++;
                if (data.gmail_thread_id) threadIds.A.push(data.gmail_thread_id);
            } else if (variant === 'B') {
                variantBSent++;
                if (data.gmail_thread_id) threadIds.B.push(data.gmail_thread_id);
            }
        });

        // Get reply and interest counts
        let variantAReplies = 0;
        let variantBReplies = 0;
        let variantAInterested = 0;
        let variantBInterested = 0;

        // Check threads for replies and interest
        if (threadIds.A.length > 0) {
            const threadsA = await db.collection('email_threads')
                .where('__name__', 'in', threadIds.A.slice(0, 10)) // Firestore limit
                .get();

            threadsA.docs.forEach(doc => {
                const data = doc.data();
                if (data.ai_reply_count > 0 || data.last_message_from === 'creator') {
                    variantAReplies++;
                }
                if (data.status === 'interested' || data.deal_started) {
                    variantAInterested++;
                }
            });
        }

        if (threadIds.B.length > 0) {
            const threadsB = await db.collection('email_threads')
                .where('__name__', 'in', threadIds.B.slice(0, 10)) // Firestore limit
                .get();

            threadsB.docs.forEach(doc => {
                const data = doc.data();
                if (data.ai_reply_count > 0 || data.last_message_from === 'creator') {
                    variantBReplies++;
                }
                if (data.status === 'interested' || data.deal_started) {
                    variantBInterested++;
                }
            });
        }

        // Return updated config with results
        return {
            ...abTest,
            variant_a_sent: variantASent,
            variant_b_sent: variantBSent,
            variant_a_replies: variantAReplies,
            variant_b_replies: variantBReplies,
            variant_a_interested: variantAInterested,
            variant_b_interested: variantBInterested
        };
    } catch (error) {
        console.error('[A/B Test] Error calculating results:', error);
        return null;
    }
}

/**
 * Update campaign with A/B test results
 */
export async function updateCampaignABTestResults(campaignId: string): Promise<boolean> {
    try {
        const results = await calculateABTestResults(campaignId);
        if (!results) {
            return false;
        }

        await db.collection('creator_requests').doc(campaignId).update({
            ab_test: results,
            updated_at: new Date().toISOString()
        });

        return true;
    } catch (error) {
        console.error('[A/B Test] Error updating results:', error);
        return false;
    }
}
