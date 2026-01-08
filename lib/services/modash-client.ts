import { ModashDiscoveryResult, ModashDetailedProfile, Platform } from '../types';
import { canMakeDiscoveryCall, canMakeReportCall, incrementDiscoveryCounter, incrementReportCounter } from './usage-counter';
import { logApiCall } from './api-logger';

// These should be set as environment variables
const MODASH_API_KEY = process.env.MODASH_API_KEY || '';
const MODASH_BASE_URL = 'https://api.modash.io/v1';

interface ModashClientConfig {
  apiKey: string;
  baseUrl?: string;
}

/**
 * Modash API Client with rate limiting and safety guards
 */
export class ModashClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ModashClientConfig) {
    this.apiKey = config.apiKey || MODASH_API_KEY || '';
    this.baseUrl = config.baseUrl || MODASH_BASE_URL;

    // Don't throw during build - will throw when actually used
    if (!this.apiKey && typeof window !== 'undefined') {
      console.warn('Modash API key is not set');
    }
  }

  private ensureApiKey() {
    if (!this.apiKey) {
      throw new Error('Modash API key is required. Please set MODASH_API_KEY environment variable.');
    }
  }

  /**
   * Make authenticated request to Modash API
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
      throw new Error(`Modash API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Discovery API - High volume, limited monthly
   * Only call this after checking usage counters and cache
   */
  async discoverCreators(params: {
    platform: Platform;
    filters: Record<string, any>;
    limit: number;
    offset?: number;
  }): Promise<ModashDiscoveryResult[]> {
    this.ensureApiKey();
    
    // Safety guard: Check quota before making call
    const canCall = await canMakeDiscoveryCall();
    if (!canCall) {
      throw new Error('Monthly discovery quota exceeded. Cannot make discovery call.');
    }

    // Log the call
    await logApiCall({
      api_provider: 'modash',
      api_action: 'discovery',
      reason: `Searching for ${params.limit} creators on ${params.platform}`,
    });

    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        platform: params.platform,
        limit: params.limit.toString(),
        ...(params.offset && { offset: params.offset.toString() }),
      });

      // Add filters to query
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const results = await this.request<{ results: ModashDiscoveryResult[] }>(
        `/creators/discover?${queryParams.toString()}`
      );

      // Increment counter after successful call
      await incrementDiscoveryCounter();

      return results.results || [];
    } catch (error) {
      console.error('Modash discovery error:', error);
      throw error;
    }
  }

  /**
   * Detailed Profile Report API - Low volume, strictly limited monthly
   * Only call this when user explicitly selects a creator for outreach
   */
  async getDetailedProfile(modashCreatorId: string): Promise<ModashDetailedProfile> {
    this.ensureApiKey();
    
    // Safety guard: Check quota before making call
    const canCall = await canMakeReportCall();
    if (!canCall) {
      throw new Error('Monthly detailed report quota exceeded. Cannot fetch detailed profile.');
    }

    // Log the call
    await logApiCall({
      api_provider: 'modash',
      api_action: 'detailed_profile',
      reason: `Fetching detailed profile for creator ${modashCreatorId}`,
    });

    try {
      const profile = await this.request<ModashDetailedProfile>(
        `/creators/${modashCreatorId}/profile`
      );

      // Increment counter after successful call
      await incrementReportCounter();

      return profile;
    } catch (error) {
      console.error('Modash detailed profile error:', error);
      throw error;
    }
  }
}

// Export singleton instance (lazy initialization to avoid build errors)
let _modashClient: ModashClient | null = null;
export const modashClient = (() => {
  if (!_modashClient) {
    _modashClient = new ModashClient({
      apiKey: MODASH_API_KEY,
    });
  }
  return _modashClient;
})();

