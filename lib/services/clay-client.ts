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
    creatorId?: number | string;
    userId?: string;
    name?: string; // Optional but helpful
    niche?: string;
    followers?: number;
    bio?: string;
    website?: string;
    campaignId?: string;
  }): Promise<ClayEnrichmentResult> {
    // specific URL provided by user
    const targetUrl = this.webhookUrl || 'https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-2f50d72c-37c4-4ef0-86e9-f36fd3897aac';

    // Log the call
    await logApiCall({
      api_provider: 'clay',
      api_action: 'enrichment_push',
      reason: `Pushing ${params.handle} to Clay Webhook`,
      creator_id: typeof params.creatorId === 'number' ? params.creatorId : null,
      user_id: params.userId || null,
    });

    try {
      // Construct exact payload matching the User's Schema from Step 35
      const payload = {
        "verality_id": params.creatorId?.toString() || "",
        "creator_name": params.name || params.handle,
        "platform": params.platform,
        "username": params.handle,
        "profile_url": params.profileUrl || this.constructProfileUrl(params.platform, params.handle),
        "niche": params.niche || "",
        "followers": params.followers || 0,
        "bio": params.bio || "",
        "website": params.website || "",
        "user_id": params.userId || "",
        "campaign_id": params.campaignId || ""
      };

      console.log('Pushing to Clay:', JSON.stringify(payload));

      // Fire and forget (don't await response to block UI, but we catch errors)
      // UDPATE: User requires ALL 50 to be sent. We must await this to ensure execution in serverless env.
      await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      // We return a "pending" result immediately
      return {
        email: null,
        email_found: false,
        clay_enriched_at: new Date().toISOString(),
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

