import { db } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Types for database collections
export interface UserAccount {
  id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  plan: 'free' | 'basic' | 'pro' | 'growth' | 'scale' | 'enterprise' | 'custom_no_email' | 'testing';
  role?: 'user' | 'admin' | 'affiliate';
  outreach_intent?: string; // What are they asking for?
  ai_autopilot_enabled?: boolean; // If true, auto-finds creators daily
  email_quota_daily: number;
  email_quota_monthly: number;
  email_used_today: number;
  email_used_this_month: number;
  quota_reset_date: Timestamp | string;
  last_daily_reset_at?: Timestamp | string;
  created_at: Timestamp | string;
  updated_at: Timestamp | string;
}

export interface CreatorRequest {
  id: string;
  user_id: string;
  name: string;
  platforms: string[];
  status: 'pending' | 'in_progress' | 'delivered' | 'failed';
  date_submitted: Timestamp | string;
  results_count?: number;
  creator_ids?: string[];
  criteria: Record<string, any>;

  // Recurring Campaign Fields
  is_recurring?: boolean; // If true, runs daily for max_runs days
  is_active?: boolean; // Can be paused/stopped
  last_run_at?: Timestamp | string;
  frequency?: 'daily'; // Default daily
  run_count?: number; // How many times it has run
  max_runs?: number; // Default 30 days
  contacted_creator_ids?: string[]; // Track contacted creators to avoid duplicates

  created_at: Timestamp | string;
  updated_at: Timestamp | string;
}

export interface UserStats {
  requestsThisWeek: number;
  emailsSentThisWeek: number;
  creatorsContacted: number;
  averageReplyRate: number;
  totalRequests: number;
  totalEmailsSent: number;
  totalCreatorsContacted: number;
  totalCreatorsFound: number;
  repliesReceived: number;
  activeConversations: number;
  meetingsInterested: number;
  emailUsedToday: number;
  remainingQuota: number;
}

export interface AffiliateAccount {
  id: string; // Same as user_id
  referral_code: string;
  commission_rate: number; // 0.25 (25%)
  commission_type: 'recurring' | 'one_time';
  total_earnings: number;
  pending_earnings: number;
  clicks: number;
  conversions: number;
  payout_details?: string;
  created_at: Timestamp | string;
  updated_at: Timestamp | string;
}

export interface AffiliateReferral {
  id: string;
  affiliate_id: string;
  referred_user_id?: string;
  visitor_ip?: string; // Hashed for privacy
  status: 'click' | 'signup' | 'conversion' | 'paid';
  commission_amount: number;
  created_at: Timestamp | string;
}

// Helper to convert Firestore timestamps to ISO strings
function toISODate(value: any): string {
  if (value?.toDate) {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value || new Date().toISOString();
}

// Helper to convert Firestore document to plain object
function docToObject<T>(doc: any, id?: string): T {
  const data = doc.data ? doc.data() : doc;
  return {
    ...data,
    id: id || doc.id,
    created_at: toISODate(data.created_at),
    updated_at: toISODate(data.updated_at),
    date_submitted: toISODate(data.date_submitted),
    quota_reset_date: toISODate(data.quota_reset_date),
    last_daily_reset_at: toISODate(data.last_daily_reset_at),
  } as T;
}

// Fetch user account data
export async function getUserAccount(userId: string): Promise<UserAccount | null> {
  try {
    const doc = await db.collection('user_accounts').doc(userId).get();
    if (!doc.exists) {
      return null;
    }
    const data = docToObject<UserAccount>(doc, userId);

    // DAILY QUOTA RESET LOGIC
    const now = new Date();

    const getDate = (d: any) => {
      if (!d) return new Date(0);
      if (typeof d === 'string') return new Date(d);
      if (d.toDate) return d.toDate();
      return new Date(d);
    };

    const lastReset = data.last_daily_reset_at
      ? getDate(data.last_daily_reset_at)
      : getDate(data.updated_at);

    // Compare YYYY-MM-DD
    const todayStr = now.toISOString().split('T')[0];
    const lastResetStr = lastReset.toISOString().split('T')[0];

    if (todayStr !== lastResetStr) {
      console.log(`[UserAccount] Resetting daily quota for ${userId}. Last: ${lastResetStr}, Today: ${todayStr}`);

      // Reset in DB
      const updateData = {
        email_used_today: 0,
        last_daily_reset_at: Timestamp.now(),
        updated_at: Timestamp.now()
      };

      // We run this async to not block the read too much
      try {
        await db.collection('user_accounts').doc(userId).update(updateData);
      } catch (e) {
        console.error("Quota reset update failed", e);
      }

      // Update local object to return correct state
      data.email_used_today = 0;
      data.last_daily_reset_at = now.toISOString();
    }

    // Admin Override (Enterprise access for all admins)
    if (data.role === 'admin') {
      data.plan = 'enterprise';
      data.email_quota_daily = 500;
      data.email_quota_monthly = 15000;
      // We use 500 as requested by the user
    }

    return data;
  } catch (error) {
    console.error('Error fetching user account:', error);
    return null;
  }
}

// Fetch user stats
export async function getUserStats(userId: string): Promise<UserStats> {
  // Default zero stats
  const stats: UserStats = {
    requestsThisWeek: 0,
    emailsSentThisWeek: 0,
    creatorsContacted: 0,
    averageReplyRate: 0,
    totalRequests: 0,
    totalEmailsSent: 0,
    totalCreatorsContacted: 0,
    totalCreatorsFound: 0,
    repliesReceived: 0,
    activeConversations: 0,
    meetingsInterested: 0,
    emailUsedToday: 0,
    remainingQuota: 0
  };

  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Queries
    const pSettings = db.collection('user_email_settings').doc(userId).get();
    const pAccount = db.collection('user_accounts').doc(userId).get();
    const pThreads = db.collection('email_threads')
      .where('user_id', '==', userId)
      .where('status', '==', 'active')
      .count()
      .get();
    // Fetch ALL requests
    const pRequests = db.collection('creator_requests')
      .where('user_id', '==', userId)
      .get();

    // Use allSettled to survive partial failures (e.g. missing indexes)
    const [rSettings, rAccount, rThreads, rRequests] = await Promise.allSettled([
      pSettings, pAccount, pThreads, pRequests
    ]);

    // Process Settings
    let emailSettings = {};
    if (rSettings.status === 'fulfilled') {
      emailSettings = rSettings.value.data() || {};
      const d = emailSettings as any;
      stats.repliesReceived = d.total_replies_received || 0;
      stats.totalEmailsSent = d.total_emails_sent || 0;
      stats.creatorsContacted = stats.totalEmailsSent;
    }

    // Process Account
    if (rAccount.status === 'fulfilled') {
      const d = rAccount.value.data() || {} as any;
      stats.emailUsedToday = d.email_used_today || 0;
      stats.remainingQuota = (d.email_quota_daily || 0) - (stats.emailUsedToday || 0);
      // Fallback if settings didn't have total
      if (!stats.totalEmailsSent) {
        stats.totalEmailsSent = d.email_used_today || 0; // Better than 0
        stats.creatorsContacted = stats.totalEmailsSent;
      }
    }

    // Process Threads (Active Convos)
    if (rThreads.status === 'fulfilled') {
      stats.activeConversations = rThreads.value.data().count;
    } else {
      console.warn('Failed to fetch active threads count (likely missing index):', rThreads.reason);
    }

    // Process Requests (Creators Found)
    if (rRequests.status === 'fulfilled') {
      const allRequests = rRequests.value.docs.map(doc => doc.data());
      stats.totalRequests = allRequests.length;

      // Filter for week
      const weekRequests = allRequests.filter(r => {
        const created = r.created_at?.toDate ? r.created_at.toDate() : new Date(r.created_at);
        return created >= weekAgo;
      });
      stats.requestsThisWeek = weekRequests.length;

      // Sum results
      stats.totalCreatorsFound = allRequests.reduce((acc, req) => acc + (Number(req.results_count) || 0), 0);
    } else {
      console.warn('Failed to fetch creator requests:', rRequests.reason);
    }

    // Interested
    try {
      const interestedSnapshot = await db.collection('email_threads')
        .where('user_id', '==', userId)
        .where('phone_number', '!=', null)
        .count()
        .get();
      stats.meetingsInterested = interestedSnapshot.data().count;
    } catch (e) {
      // Ignore
    }

    // Calculated fields
    if (stats.totalEmailsSent > 0 && stats.repliesReceived !== undefined) {
      stats.averageReplyRate = parseFloat(((stats.repliesReceived / stats.totalEmailsSent) * 100).toFixed(1));
    }

    return stats;

  } catch (error) {
    console.error('Critical error fetching user stats:', error);
    return stats; // Return whatever we have so far
  }
}

// Fetch recent requests
export async function getRecentRequests(userId: string, limit: number = 10): Promise<CreatorRequest[]> {
  try {
    // Query without orderBy to avoid composite index requirement
    const snapshot = await db.collection('creator_requests')
      .where('user_id', '==', userId)
      .get();

    let requests = snapshot.docs.map(doc => docToObject<CreatorRequest>(doc, doc.id));

    // Sort in memory
    requests.sort((a, b) => {
      const dateA = new Date(a.created_at as string);
      const dateB = new Date(b.created_at as string);
      return dateB.getTime() - dateA.getTime();
    });

    return requests.slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent requests:', error);
    return [];
  }
}

// Create a new creator request
export async function createCreatorRequest(
  userId: string,
  requestData: {
    name: string;
    platforms: string[];
    criteria: Record<string, any>;
  }
): Promise<CreatorRequest | null> {
  try {
    const now = Timestamp.now();
    const docRef = await db.collection('creator_requests').add({
      user_id: userId,
      name: requestData.name,
      platforms: requestData.platforms,
      criteria: requestData.criteria,
      status: 'pending',
      date_submitted: now,
      is_recurring: true, // Auto-run 24/7 feature
      is_active: true,
      last_run_at: now, // Mark created time as first "run"
      created_at: now,
      updated_at: now,
    });

    const doc = await docRef.get();
    return docToObject<CreatorRequest>(doc, doc.id);
  } catch (error) {
    console.error('Error creating creator request:', error);
    return null;
  }
}

// Update email quota usage
export async function incrementEmailQuota(userId: string, amount: number = 1): Promise<boolean> {
  if (amount <= 0) return true; // No charge needed
  try {
    // Get current account
    const account = await getUserAccount(userId);
    if (!account) return false;

    // Update quota
    await db.collection('user_accounts').doc(userId).update({
      email_used_today: account.email_used_today + amount,
      email_used_this_month: account.email_used_this_month + amount,
      updated_at: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error('Error updating quota:', error);
    return false;
  }
}

// --- Affiliate System Functions ---

export async function getAffiliateAccount(userId: string): Promise<AffiliateAccount | null> {
  try {
    const doc = await db.collection('affiliates').doc(userId).get();
    if (!doc.exists) return null;
    return docToObject<AffiliateAccount>(doc, userId);
  } catch (error) {
    console.error('Error fetching affiliate account:', error);
    return null;
  }
}

export async function createAffiliateAccount(userId: string, email: string): Promise<AffiliateAccount | null> {
  try {
    // Generate unique referral code (simplified)
    const referralCode = email.split('@')[0] + Math.floor(Math.random() * 1000);
    const now = Timestamp.now();

    const affiliateData = {
      referral_code: referralCode,
      commission_rate: 0.20,
      commission_type: 'recurring',
      total_earnings: 0,
      pending_earnings: 0,
      clicks: 0,
      conversions: 0,
      created_at: now,
      updated_at: now
    };

    await db.collection('affiliates').doc(userId).set(affiliateData);
    return { id: userId, ...affiliateData } as unknown as AffiliateAccount;
  } catch (error) {
    console.error('Error creating affiliate account:', error);
    return null;
  }
}

export async function trackAffiliateClick(referralCode: string, ipHash: string): Promise<void> {
  try {
    const affiliatesRef = db.collection('affiliates');
    const snapshot = await affiliatesRef.where('referral_code', '==', referralCode).limit(1).get();

    if (snapshot.empty) return;

    const affiliateDoc = snapshot.docs[0];
    const affiliateId = affiliateDoc.id;

    // Increment click count
    await affiliateDoc.ref.update({
      clicks: (affiliateDoc.data().clicks || 0) + 1,
      updated_at: Timestamp.now()
    });

    // Log referral click
    await db.collection('affiliate_referrals').add({
      affiliate_id: affiliateId,
      visitor_ip: ipHash, // Simple tracking
      status: 'click',
      commission_amount: 0,
      created_at: Timestamp.now()
    });
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
  }
}

export async function trackAffiliateConversion(referralCode: string, amountPaid: number, orderId: string): Promise<boolean> {
  try {
    const affiliatesRef = db.collection('affiliates');
    const snapshot = await affiliatesRef.where('referral_code', '==', referralCode).limit(1).get();

    if (snapshot.empty) {
      console.log(`Referral code not found: ${referralCode}`);
      return false;
    }

    const affiliateDoc = snapshot.docs[0];
    const affiliateData = affiliateDoc.data() as AffiliateAccount;
    const affiliateId = affiliateDoc.id;

    const commissionAmount = amountPaid * affiliateData.commission_rate;

    // Update Affiliate Account
    await affiliateDoc.ref.update({
      conversions: (affiliateData.conversions || 0) + 1,
      total_earnings: (affiliateData.total_earnings || 0) + commissionAmount,
      pending_earnings: (affiliateData.pending_earnings || 0) + commissionAmount,
      updated_at: Timestamp.now()
    });

    // Log Referral Conversion
    await db.collection('affiliate_referrals').add({
      affiliate_id: affiliateId,
      status: 'conversion',
      commission_amount: commissionAmount,
      order_id: orderId, // Store the stripe subscription ID or similar
      created_at: Timestamp.now()
    });

    console.log(`Recorded commission of ${commissionAmount} for affiliate ${affiliateId}`);
    return true;

  } catch (error) {
    console.error('Error tracking affiliate conversion:', error);
    return false;
  }
}
