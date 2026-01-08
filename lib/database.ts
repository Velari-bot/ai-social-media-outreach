import { db } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Types for database collections
export interface UserAccount {
  id: string;
  email: string;
  name?: string;
  plan: 'free' | 'pro' | 'enterprise';
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
    return docToObject<UserAccount>(doc, userId);
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

    // Default stats
    const stats: UserStats = {
      requests_this_week: weekRequests.length,
      emails_sent_this_week: 0,
      creators_contacted: 0,
      average_reply_rate: 0,
      total_requests: allRequests.length,
      total_emails_sent: 0,
      total_creators_contacted: 0,
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
export async function incrementEmailQuota(userId: string): Promise<boolean> {
  try {
    // Get current account
    const account = await getUserAccount(userId);
    if (!account) return false;

    // Update quota
    await db.collection('user_accounts').doc(userId).update({
      email_used_today: account.email_used_today + 1,
      email_used_this_month: account.email_used_this_month + 1,
      updated_at: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error('Error updating quota:', error);
    return false;
  }
}
