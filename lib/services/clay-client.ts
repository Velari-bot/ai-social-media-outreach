import { ClayEnrichmentResult } from '../types';
import { logApiCall } from './api-logger';

// These should be set as environment variables
const CLAY_API_KEY = process.env.CLAY_API_KEY || '';
const CLAY_BASE_URL = 'https://api.clay.com/v1';

interface ClayClientConfig {
  apiKey: string;
  baseUrl?: string;
}

/**
 * Clay API Client for email enrichment
 * Only used after detailed profile is fetched
 */
export class ClayClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ClayClientConfig) {
    this.apiKey = config.apiKey || CLAY_API_KEY || '';
    this.baseUrl = config.baseUrl || CLAY_BASE_URL;

    // Don't throw during build - will throw when actually used
    if (!this.apiKey && typeof window !== 'undefined') {
      console.warn('Clay API key is not set');
    }
  }

  private ensureApiKey() {
    if (!this.apiKey) {
      throw new Error('Clay API key is required. Please set CLAY_API_KEY environment variable.');
    }
  }

  /**
   * Make authenticated request to Clay API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Clay API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Enrich creator with email/contact data
   * Only call this after detailed profile is available
   */
  async enrichCreator(params: {
    handle: string;
    platform: string;
    creatorId?: number;
    userId?: string;
  }): Promise<ClayEnrichmentResult> {
    this.ensureApiKey();
    
    // Log the call
    await logApiCall({
      api_provider: 'clay',
      api_action: 'enrichment',
      reason: `Enriching contact data for ${params.handle} on ${params.platform}`,
      creator_id: params.creatorId || null,
      user_id: params.userId || null,
    });

    try {
      const result = await this.request<ClayEnrichmentResult>(
        '/people/enrich',
        {
          method: 'POST',
          body: JSON.stringify({
            handle: params.handle,
            platform: params.platform,
          }),
        }
      );

      return result;
    } catch (error) {
      console.error('Clay enrichment error:', error);
      throw error;
    }
  }
}

// Export singleton instance (lazy initialization to avoid build errors)
let _clayClient: ClayClient | null = null;
export const clayClient = (() => {
  if (!_clayClient) {
    _clayClient = new ClayClient({
      apiKey: CLAY_API_KEY,
    });
  }
  return _clayClient;
})();

