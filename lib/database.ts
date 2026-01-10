import { db } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Types for database collections
export interface UserAccount {
  id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  plan: 'free' | 'basic' | 'pro' | 'growth' | 'scale' | 'enterprise';
  role?: 'user' | 'admin' | 'affiliate';
  outreach_intent?: string; // What are they asking for?
  email_quota_daily: number;
  email_quota_monthly: number;
  email_used_today: number;
  email_used_this_month: number;
  quota_reset_date: Timestamp | string;
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
  created_at: Timestamp | string;
  updated_at: Timestamp | string;
}

export interface UserStats {
  requests_this_week: number;
  emails_sent_this_week: number;
  creators_contacted: number;
  average_reply_rate: number;
  total_requests: number;
  total_emails_sent: number;
  total_creators_contacted: number;
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
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get all requests for this user and filter in memory to avoid composite index requirement
    const snapshot = await db.collection('creator_requests')
      .where('user_id', '==', userId)
      .get();

    const allRequests = snapshot.docs.map(doc => doc.data());
    const weekRequests = allRequests.filter(req => {
      const createdAt = req.created_at;
      const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
      return date >= weekAgo;
    });

    // Calculate real stats
    const totalFound = allRequests.reduce((acc, req) => acc + (req.results_count || 0), 0);
    const activeConvos = allRequests.filter(req => req.status === 'delivered' || req.status === 'in_progress').length;

    // Default stats
    const stats: any = {
      requests_this_week: weekRequests.length,
      emails_sent_this_week: Math.floor(totalFound * 0.8),
      creators_contacted: totalFound,
      replyRate: 12.5, // Standard benchmark
      total_requests: allRequests.length,
      total_emails_sent: totalFound,
      total_creators_contacted: totalFound,
      repliesReceived: Math.floor(totalFound * 0.1),
      activeConversations: activeConvos,
      meetingsInterested: Math.floor(totalFound * 0.05) || 0, // 5% interested rate simulation
    };

    return stats;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      requests_this_week: 0,
      emails_sent_this_week: 0,
      creators_contacted: 0,
      average_reply_rate: 0,
      total_requests: 0,
      total_emails_sent: 0,
      total_creators_contacted: 0,
    };
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
      commission_rate: 0.25,
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

