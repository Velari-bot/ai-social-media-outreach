
import { db } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export interface AuditLogEntry {
    action: string;
    actor_id: string; // The admin/user who performed the action
    target_id?: string; // The ID of the object being acted upon (user_id, request_id, etc.)
    target_type?: string; // e.g. 'user', 'request', 'subscription'
    details: Record<string, any>;
    created_at: Timestamp;
}

/**
 * Log an administrative or sensitive action to the audit_logs collection.
 */
export async function logAudit(
    action: string,
    actorId: string,
    details: Record<string, any> = {},
    targetId?: string,
    targetType?: string
) {
    try {
        await db.collection('audit_logs').add({
            action,
            actor_id: actorId,
            target_id: targetId || null,
            target_type: targetType || null,
            details,
            created_at: Timestamp.now()
        });
        console.log(`[Audit] ${action} by ${actorId}`);
    } catch (error) {
        console.error(`[Audit] Failed to log action ${action}:`, error);
    }
}
