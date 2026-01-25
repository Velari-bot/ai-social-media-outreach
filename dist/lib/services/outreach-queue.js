"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCreatorsToQueue = void 0;
exports.queueCreatorsForOutreach = queueCreatorsForOutreach;
exports.getUserEmailSettings = getUserEmailSettings;
exports.rescheduleUserQueue = rescheduleUserQueue;
const firebase_admin_1 = require("../firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
/**
 * Add creators to outreach queue with smart scheduling
 * Uses user's daily credit quota (credits = emails)
 */
/**
 * Add creators to outreach queue with smart scheduling
 */
async function queueCreatorsForOutreach(params) {
    const { userId, creators, campaignId, requestId } = params;
    // Get user account to check credits
    const userDoc = await firebase_admin_1.db.collection('user_accounts').doc(userId).get();
    if (!userDoc.exists) {
        throw new Error('User not found');
    }
    const userData = userDoc.data();
    const dailyCredits = userData.email_quota_daily || 0;
    const creditsUsedToday = userData.email_used_today || 0;
    const creditsAvailable = dailyCredits - creditsUsedToday;
    console.log(`[Queue] User ${userId}: ${creditsAvailable}/${dailyCredits} credits available`);
    if (creditsAvailable <= 0) {
        console.log(`[Queue] User ${userId} has no credits available today`);
        return { queued: 0, skipped: creators.length, creditsUsed: 0 };
    }
    // Get user's email settings
    const settingsDoc = await firebase_admin_1.db.collection('user_email_settings').doc(userId).get();
    const settings = settingsDoc.data() || {
        min_minutes_between_emails: 10,
        sending_hours_start: 9,
        sending_hours_end: 17
    };
    // Check for Business Hours Override (24/7 mode)
    // Default to strict business hours (true) if undefined
    const businessHoursOnly = userData.business_hours_only !== false;
    let startHour = settings.sending_hours_start;
    let endHour = settings.sending_hours_end;
    if (!businessHoursOnly) {
        console.log(`[Queue] User ${userId} enabled 24/7 sending. Overriding business hours.`);
        startHour = 0;
        endHour = 24;
    }
    let queued = 0;
    let skipped = 0;
    // Limit to available credits (1 credit = 1 email)
    const creatorsToQueue = creators.slice(0, creditsAvailable);
    const exceededLimit = creators.length - creatorsToQueue.length;
    if (exceededLimit > 0) {
        console.log(`[Queue] ${exceededLimit} creators skipped due to credit limit`);
    }
    // Calculate send times distributed throughout the day
    const sendTimes = distributeEmailsOverDay(creatorsToQueue.length, settings.min_minutes_between_emails, startHour, endHour);
    const batch = firebase_admin_1.db.batch();
    for (let i = 0; i < creatorsToQueue.length; i++) {
        const creator = creatorsToQueue[i];
        // Check if already contacted
        const existingQuery = await firebase_admin_1.db.collection('outreach_queue')
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
        const queueRef = firebase_admin_1.db.collection('outreach_queue').doc();
        const queueItem = {
            user_id: userId,
            creator_id: creator.creator_id,
            creator_email: creator.email,
            creator_handle: creator.handle,
            creator_platform: creator.platform,
            creator_name: creator.name,
            status: 'scheduled',
            scheduled_send_time: firestore_1.Timestamp.fromDate(sendTime),
            campaign_id: campaignId,
            request_id: requestId,
            retry_count: 0,
            created_at: firestore_1.Timestamp.now(),
            updated_at: firestore_1.Timestamp.now()
        };
        batch.set(queueRef, queueItem);
        queued++;
    }
    // Reserve credits for queued emails (1 credit per email) - ATOMIC
    if (queued > 0) {
        batch.update(firebase_admin_1.db.collection('user_accounts').doc(userId), {
            email_used_today: firestore_1.FieldValue.increment(queued),
            email_used_this_month: firestore_1.FieldValue.increment(queued),
            updated_at: firestore_1.Timestamp.now()
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
function distributeEmailsOverDay(count, minMinutesBetween, startHour, endHour) {
    const now = new Date();
    const sendTimes = [];
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
    }
    else if (now.getHours() >= endHour) {
        // After business hours - start tomorrow at startHour
        currentTime.setDate(currentTime.getDate() + 1);
        currentTime.setHours(startHour, 0, 0, 0);
    }
    else {
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
        }
        else {
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
async function getUserEmailSettings(userId) {
    const doc = await firebase_admin_1.db.collection('user_email_settings').doc(userId).get();
    if (doc.exists) {
        return doc.data();
    }
    // Create default settings
    const defaultSettings = {
        user_id: userId,
        gmail_connected: false,
        min_minutes_between_emails: 10,
        sending_hours_start: 9,
        sending_hours_end: 17,
        ai_auto_reply_enabled: true,
        ai_persona: "Cory from Beyond Vision",
        total_emails_sent: 0,
        total_replies_received: 0,
        created_at: firestore_1.Timestamp.now(),
        updated_at: firestore_1.Timestamp.now()
    };
    await firebase_admin_1.db.collection('user_email_settings').doc(userId).set(defaultSettings);
    return defaultSettings;
}
const addCreatorsToQueue = async (creatorIds, userId, campaignId, campaignName) => {
    if (!creatorIds || creatorIds.length === 0)
        return;
    const creators = [];
    const chunks = [];
    for (let i = 0; i < creatorIds.length; i += 10) {
        chunks.push(creatorIds.slice(i, i + 10));
    }
    for (const chunk of chunks) {
        const snap = await firebase_admin_1.db.collection('creators').where(firestore_1.FieldPath.documentId(), 'in', chunk).get();
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
exports.addCreatorsToQueue = addCreatorsToQueue;
/**
 * Reschedule all PENDING/SCHEDULED emails for a user
 * Called when users change their sending settings (e.g. toggle 24/7 mode)
 */
async function rescheduleUserQueue(userId, businessHoursOnly) {
    console.log(`[Queue] Rescheduling for user ${userId} (Business Hours Only: ${businessHoursOnly})`);
    // 1. Get all scheduled items
    const snapshot = await firebase_admin_1.db.collection('outreach_queue')
        .where('user_id', '==', userId)
        .where('status', '==', 'scheduled')
        .get();
    if (snapshot.empty)
        return;
    // 2. Get Settings
    const settingsDoc = await firebase_admin_1.db.collection('user_email_settings').doc(userId).get();
    const settings = settingsDoc.data() || {
        min_minutes_between_emails: 10,
        sending_hours_start: 9,
        sending_hours_end: 17
    };
    let startHour = settings.sending_hours_start ?? 9;
    let endHour = settings.sending_hours_end ?? 17;
    if (!businessHoursOnly) {
        startHour = 0;
        endHour = 24;
    }
    // 3. Calculate new times
    // We treat this as "queueing them from scratch" starting NOW
    const items = snapshot.docs;
    const newTimes = distributeEmailsOverDay(items.length, settings.min_minutes_between_emails, startHour, endHour);
    // 4. Batch Update
    // Firestore batches limited to 500 ops.
    const batches = [];
    let currentBatch = firebase_admin_1.db.batch();
    let opCount = 0;
    items.forEach((doc, index) => {
        if (opCount >= 450) {
            batches.push(currentBatch);
            currentBatch = firebase_admin_1.db.batch();
            opCount = 0;
        }
        const newTime = newTimes[index];
        if (newTime) {
            currentBatch.update(doc.ref, {
                scheduled_send_time: firestore_1.Timestamp.fromDate(newTime),
                updated_at: firestore_1.Timestamp.now()
            });
            opCount++;
        }
    });
    batches.push(currentBatch);
    await Promise.all(batches.map(b => b.commit()));
    console.log(`[Queue] Rescheduled ${items.length} emails for user ${userId}`);
}
