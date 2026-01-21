import { db } from '../firebase-admin';
import { Timestamp, FieldPath, FieldValue } from 'firebase-admin/firestore';

/**
 * Outreach Queue Item
 * Represents a creator that needs to be contacted
 */
export interface OutreachQueueItem {
    id: string;
    user_id: string;
    creator_id: string;
    creator_email: string;
    creator_handle: string;
    creator_platform: string;
    creator_name?: string;

    // Scheduling
    status: 'pending' | 'scheduled' | 'sent' | 'replied' | 'failed' | 'bounced';
    scheduled_send_time: Timestamp | string;
    sent_at?: Timestamp | string;

    // Email tracking
    gmail_thread_id?: string;
    gmail_message_id?: string;
    email_subject?: string;
    email_body?: string;

    // Campaign tracking
    campaign_id?: string;
    request_id?: string;

    // Retry logic
    retry_count: number;
    last_error?: string;

    created_at: Timestamp | string;
    updated_at: Timestamp | string;
}

/**
 * Email Thread Tracking
 * Tracks conversation state with creators
 */
export interface EmailThread {
    id: string; // Gmail thread ID
    user_id: string;
    creator_id: string;
    creator_email: string;

    // Thread state
    status: 'active' | 'replied' | 'closed' | 'archived';
    last_message_from: 'user' | 'creator';
    last_message_at: Timestamp | string;

    // AI tracking
    ai_enabled: boolean;
    ai_reply_count: number;

    // Extracted data
    phone_number?: string;
    tiktok_rate?: number;
    sound_promo_rate?: number;

    // Labels
    gmail_labels: string[];

    created_at: Timestamp | string;
    updated_at: Timestamp | string;
}

/**
 * User Email Settings
 * Per-user configuration for automated outreach
 */
export interface UserEmailSettings {
    user_id: string;

    // Gmail OAuth
    gmail_connected: boolean;
    gmail_email?: string;

    // Pacing (distribute throughout day)
    min_minutes_between_emails: number; // Default: 5-10 minutes
    sending_hours_start: number; // Default: 9 (9 AM)
    sending_hours_end: number; // Default: 17 (5 PM)

    // AI settings
    ai_auto_reply_enabled: boolean;
    ai_persona?: string; // e.g., "Cory from Beyond Vision"

    // Tracking
    total_emails_sent: number;
    total_replies_received: number;

    created_at: Timestamp | string;
    updated_at: Timestamp | string;
}

/**
 * Add creators to outreach queue with smart scheduling
 * Uses user's daily credit quota (credits = emails)
 */


/**
 * Add creators to outreach queue with smart scheduling
 */
export async function queueCreatorsForOutreach(params: {
    userId: string;
    creators: Array<{
        creator_id: string;
        email: string;
        handle: string;
        platform: string;
        name?: string;
    }>;
    campaignId?: string;
    requestId?: string;
}): Promise<{ queued: number; skipped: number; creditsUsed: number }> {
    const { userId, creators, campaignId, requestId } = params;

    // Get user account to check credits
    const userDoc = await db.collection('user_accounts').doc(userId).get();
    if (!userDoc.exists) {
        throw new Error('User not found');
    }

    const userData = userDoc.data()!;
    const dailyCredits = userData.email_quota_daily || 0;
    const creditsUsedToday = userData.email_used_today || 0;
    const creditsAvailable = dailyCredits - creditsUsedToday;

    console.log(`[Queue] User ${userId}: ${creditsAvailable}/${dailyCredits} credits available`);

    if (creditsAvailable <= 0) {
        console.log(`[Queue] User ${userId} has no credits available today`);
        return { queued: 0, skipped: creators.length, creditsUsed: 0 };
    }

    // Get user's email settings
    const settingsDoc = await db.collection('user_email_settings').doc(userId).get();
    const settings = settingsDoc.data() as UserEmailSettings || {
        min_minutes_between_emails: 10,
        sending_hours_start: 9,
        sending_hours_end: 17
    };

    let queued = 0;
    let skipped = 0;

    // Limit to available credits (1 credit = 1 email)
    const creatorsToQueue = creators.slice(0, creditsAvailable);
    const exceededLimit = creators.length - creatorsToQueue.length;

    if (exceededLimit > 0) {
        console.log(`[Queue] ${exceededLimit} creators skipped due to credit limit`);
    }

    // Calculate send times distributed throughout the day
    const sendTimes = distributeEmailsOverDay(
        creatorsToQueue.length,
        settings.min_minutes_between_emails,
        settings.sending_hours_start,
        settings.sending_hours_end
    );

    const batch = db.batch();

    for (let i = 0; i < creatorsToQueue.length; i++) {
        const creator = creatorsToQueue[i];

        // Check if already contacted
        const existingQuery = await db.collection('outreach_queue')
            .where('user_id', '==', userId)
            .where('creator_email', '==', creator.email)
            .where('status', 'in', ['sent', 'replied'])
            .limit(1)
            .get();

        if (!existingQuery.empty) {
            skipped++;
            continue;
        }

        // Validate send time exists and is valid
        const sendTime = sendTimes[i];
        if (!sendTime || isNaN(sendTime.getTime())) {
            console.error(`[Queue] Invalid send time for creator ${i}: ${sendTime}`);
            skipped++;
            continue;
        }

        const queueRef = db.collection('outreach_queue').doc();
        const queueItem: Partial<OutreachQueueItem> = {
            user_id: userId,
            creator_id: creator.creator_id,
            creator_email: creator.email,
            creator_handle: creator.handle,
            creator_platform: creator.platform,
            creator_name: creator.name,
            status: 'scheduled',
            scheduled_send_time: Timestamp.fromDate(sendTime),
            campaign_id: campaignId,
            request_id: requestId,
            retry_count: 0,
            created_at: Timestamp.now(),
            updated_at: Timestamp.now()
        };

        batch.set(queueRef, queueItem);
        queued++;
    }

    // Reserve credits for queued emails (1 credit per email) - ATOMIC
    if (queued > 0) {
        batch.update(db.collection('user_accounts').doc(userId), {
            email_used_today: FieldValue.increment(queued),
            email_used_this_month: FieldValue.increment(queued),
            updated_at: Timestamp.now()
        });
    }

    await batch.commit();

    skipped += exceededLimit;

    console.log(`[Queue] Queued ${queued} emails, skipped ${skipped}, used ${queued} credits`);

    return { queued, skipped, creditsUsed: queued };
}

/**
 * Distribute emails evenly throughout TODAY ONLY (9 AM - 5 PM)
 * All emails must be sent same day - no multi-day spreading
 */
function distributeEmailsOverDay(
    count: number,
    minMinutesBetween: number,
    startHour: number,
    endHour: number
): Date[] {
    const now = new Date();
    const sendTimes: Date[] = [];

    // Calculate available sending window in minutes for TODAY
    const hoursPerDay = endHour - startHour;
    const minutesPerDay = hoursPerDay * 60;

    // Calculate interval to fit ALL emails in today's window
    // If we have 200 emails and 480 minutes (8 hours), interval = 2.4 minutes
    const interval = Math.max(2, Math.floor(minutesPerDay / count)); // Min 2 minutes between emails

    let currentTime = new Date(now);

    // Determine start time for today
    if (now.getHours() < startHour) {
        // Before business hours - start at startHour
        currentTime.setHours(startHour, 0, 0, 0);
    } else if (now.getHours() >= endHour) {
        // After business hours - start tomorrow at startHour
        currentTime.setDate(currentTime.getDate() + 1);
        currentTime.setHours(startHour, 0, 0, 0);
    } else {
        // During business hours - start ASAP (next minute)
        currentTime = new Date(now);
        currentTime.setMinutes(currentTime.getMinutes() + 1);
        currentTime.setSeconds(0, 0);
    }

    const startOfDay = new Date(currentTime);
    startOfDay.setHours(startHour, 0, 0, 0);
    const endOfDay = new Date(currentTime);
    endOfDay.setHours(endHour, 0, 0, 0);

    // Schedule all emails for TODAY only
    for (let i = 0; i < count; i++) {
        // If we've exceeded today's window, cap at end time
        if (currentTime >= endOfDay) {
            // All remaining emails get scheduled at the last possible moment
            sendTimes.push(new Date(endOfDay.getTime() - 60000)); // 1 minute before end
        } else {
            sendTimes.push(new Date(currentTime));
            currentTime.setMinutes(currentTime.getMinutes() + interval);
        }
    }

    console.log(`[Queue] Scheduled ${count} emails for today between ${startOfDay.toLocaleTimeString()} - ${endOfDay.toLocaleTimeString()}`);

    return sendTimes;
}

/**
 * Get user's email settings (create if doesn't exist)
 */
export async function getUserEmailSettings(userId: string): Promise<UserEmailSettings> {
    const doc = await db.collection('user_email_settings').doc(userId).get();

    if (doc.exists) {
        return doc.data() as UserEmailSettings;
    }

    // Create default settings
    const defaultSettings: UserEmailSettings = {
        user_id: userId,
        gmail_connected: false,
        min_minutes_between_emails: 10,
        sending_hours_start: 9,
        sending_hours_end: 17,
        ai_auto_reply_enabled: true,
        ai_persona: "Cory from Beyond Vision",
        total_emails_sent: 0,
        total_replies_received: 0,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
    };

    await db.collection('user_email_settings').doc(userId).set(defaultSettings);
    return defaultSettings;
}

export const addCreatorsToQueue = async (
    creatorIds: string[],
    userId: string,
    campaignId?: string,
    campaignName?: string
) => {
    if (!creatorIds || creatorIds.length === 0) return;

    const creators: any[] = [];
    const chunks = [];
    for (let i = 0; i < creatorIds.length; i += 10) {
        chunks.push(creatorIds.slice(i, i + 10));
    }

    for (const chunk of chunks) {
        const snap = await db.collection('creators').where(FieldPath.documentId(), 'in', chunk).get();
        snap.docs.forEach(doc => {
            const data = doc.data();
            creators.push({
                creator_id: data.id,
                email: data.email || data.contact_email,
                handle: data.handle || data.username,
                platform: data.platform || 'instagram',
                name: data.name || data.fullname
            });
        });
    }

    const validCreators = creators.filter(c => c.email && c.email.includes('@'));

    return queueCreatorsForOutreach({
        userId,
        creators: validCreators,
        campaignId,
        requestId: campaignId
    });
};
