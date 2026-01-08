import { db } from '../firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Log an API call for tracking and debugging
 */
export async function logApiCall(params: {
  api_provider: 'modash' | 'clay';
  api_action: string;
  reason: string;
  creator_id?: number | null;
  user_id?: string | null;
}): Promise<void> {
  try {
    await db.collection('api_call_logs').add({
      api_provider: params.api_provider,
      api_action: params.api_action,
      reason: params.reason,
      creator_id: params.creator_id || null,
      user_id: params.user_id || null,
      created_at: Timestamp.now(),
    });
  } catch (error) {
    console.error('Failed to log API call:', error);
    // Don't throw - logging failures shouldn't break the flow
  }
}
