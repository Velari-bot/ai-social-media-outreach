import { db } from '../firebase-admin';
import { UsageCounters } from '../types';
import { Timestamp } from 'firebase-admin/firestore';

const MONTHLY_DISCOVERY_LIMIT = 140000;
const MONTHLY_REPORT_LIMIT = 1400;

/**
 * Get current month string in YYYY-MM format
 */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get or create usage counter for current month
 */
export async function getUsageCounter(): Promise<UsageCounters> {
  const month = getCurrentMonth();
  
  try {
    // Try to get existing counter
    const doc = await db.collection('usage_counters').doc(month).get();

    if (!doc.exists) {
      // Counter doesn't exist, create it
      const now = Timestamp.now();
      await db.collection('usage_counters').doc(month).set({
        month,
        modash_discoveries_used: 0,
        modash_reports_used: 0,
        created_at: now,
        updated_at: now,
      });

      return {
        month,
        modash_discoveries_used: 0,
        modash_reports_used: 0,
        created_at: now.toDate().toISOString(),
        updated_at: now.toDate().toISOString(),
      };
    }

    const data = doc.data()!;
    return {
      month: data.month,
      modash_discoveries_used: data.modash_discoveries_used || 0,
      modash_reports_used: data.modash_reports_used || 0,
      created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Failed to get usage counter: ${error.message}`);
  }
}

/**
 * Check if discovery calls are allowed
 */
export async function canMakeDiscoveryCall(): Promise<boolean> {
  const counter = await getUsageCounter();
  return counter.modash_discoveries_used < MONTHLY_DISCOVERY_LIMIT;
}

/**
 * Check if detailed report calls are allowed
 */
export async function canMakeReportCall(): Promise<boolean> {
  const counter = await getUsageCounter();
  return counter.modash_reports_used < MONTHLY_REPORT_LIMIT;
}

/**
 * Increment discovery counter
 */
export async function incrementDiscoveryCounter(): Promise<void> {
  const month = getCurrentMonth();
  const counter = await getUsageCounter();

  try {
    await db.collection('usage_counters').doc(month).update({
      modash_discoveries_used: counter.modash_discoveries_used + 1,
      updated_at: Timestamp.now(),
    });
  } catch (error: any) {
    throw new Error(`Failed to increment discovery counter: ${error.message}`);
  }
}

/**
 * Increment report counter
 */
export async function incrementReportCounter(): Promise<void> {
  const month = getCurrentMonth();
  const counter = await getUsageCounter();

  try {
    await db.collection('usage_counters').doc(month).update({
      modash_reports_used: counter.modash_reports_used + 1,
      updated_at: Timestamp.now(),
    });
  } catch (error: any) {
    throw new Error(`Failed to increment report counter: ${error.message}`);
  }
}

/**
 * Get remaining discovery quota
 */
export async function getRemainingDiscoveryQuota(): Promise<number> {
  const counter = await getUsageCounter();
  return Math.max(0, MONTHLY_DISCOVERY_LIMIT - counter.modash_discoveries_used);
}

/**
 * Get remaining report quota
 */
export async function getRemainingReportQuota(): Promise<number> {
  const counter = await getUsageCounter();
  return Math.max(0, MONTHLY_REPORT_LIMIT - counter.modash_reports_used);
}
