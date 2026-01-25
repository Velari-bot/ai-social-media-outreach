"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logApiCall = logApiCall;
const firebase_admin_1 = require("../firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
/**
 * Log an API call for tracking and debugging
 */
async function logApiCall(params) {
    try {
        await firebase_admin_1.db.collection('api_call_logs').add({
            api_provider: params.api_provider,
            api_action: params.api_action,
            reason: params.reason,
            creator_id: params.creator_id || null,
            user_id: params.user_id || null,
            created_at: firestore_1.Timestamp.now(),
        });
    }
    catch (error) {
        console.error('Failed to log API call:', error);
        // Don't throw - logging failures shouldn't break the flow
    }
}
