import { ClayEnrichmentResult } from '../types';
import { logApiCall } from './api-logger';

// These should be set as environment variables
const CLAY_WEBHOOK_URL = process.env.CLAY_WEBHOOK_URL || '';

interface ClayClientConfig {
  webhookUrl?: string;
  baseUrl?: string;
}

/**
 * Clay API Client for email enrichment
 * Uses Webhook "Fire and Forget" architecture
 */
export class ClayClient {
  private webhookUrl: string;

  constructor(config: ClayClientConfig) {
    this.webhookUrl = config.webhookUrl || CLAY_WEBHOOK_URL || '';

    // Warn if missing
    if (!this.webhookUrl && typeof window !== 'undefined') {
      console.warn('Clay Webhook URL is not set');
    }
  }

  private ensureWebhookUrl() {
    if (!this.webhookUrl) {
      throw new Error('Clay Webhook URL is required. Please set CLAY_WEBHOOK_URL environment variable.');
    }
  }

  /**
   * Pushes creator to Clay via Webhook
   * Step 4 in Discovery Pipeline
   */
  async enrichCreator(params: {
    handle: string;
    platform: string;
    profileUrl?: string; // New: we need the full URL for Clay
    creatorId?: number;
    userId?: string;
    name?: string; // Optional but helpful
  }): Promise<ClayEnrichmentResult> {
    this.ensureWebhookUrl();

    // Log the call
    await logApiCall({
      api_provider: 'clay',
      api_action: 'enrichment_push',
      reason: `Pushing ${params.handle} to Clay Webhook`,
      creator_id: params.creatorId || null,
      user_id: params.userId || null,
    });

    try {
      // Construct exact payload matching our Clay Table columns
      const payload = {
        "Creator Name": params.name || params.handle,
        "Profile URL": params.profileUrl || this.constructProfileUrl(params.platform, params.handle),
        "Platform": params.platform,
        "verality_id": params.creatorId?.toString() || "", // Critical for callback matching
        "user_id": params.userId || "",
        "timestamp": new Date().toISOString()
      };

      console.log('Pushing to Clay:', JSON.stringify(payload));

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Clay Webhook error: ${response.status} - ${errorText}`);
      }

      // We return a "pending" result because enrichment is asynchronous
      return {
        email: null,
        email_found: false, // Will be updated via callback later
        clay_enriched_at: new Date().toISOString(), // Mark as sent
        is_pending: true
      } as any;

    } catch (error) {
      console.error('Clay enrichment error:', error);
      throw error;
    }
  }

  private constructProfileUrl(platform: string, handle: string): string {
    const h = handle.replace(/^@/, '');
    switch (platform.toLowerCase()) {
      case 'youtube': return `https://www.youtube.com/@${h}`;
      case 'instagram': return `https://www.instagram.com/${h}`;
      case 'tiktok': return `https://www.tiktok.com/@${h}`;
      default: return `https://${platform}.com/${h}`;
    }
  }
}

// Export singleton instance
let _clayClient: ClayClient | null = null;
export const clayClient = (() => {
  if (!_clayClient) {
    _clayClient = new ClayClient({
      webhookUrl: CLAY_WEBHOOK_URL,
    });
  }
  return _clayClient;
})();

