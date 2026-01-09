import { ModashDiscoveryResult, Platform } from '../types';
import { logApiCall } from './api-logger';

// These should be set as environment variables
const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY || '';
const INFLUENCER_CLUB_BASE_URL = 'https://api.influencer.club/v1';

interface InfluencerClubClientConfig {
    apiKey: string;
    baseUrl?: string;
}

/**
 * Influencer Club API Client
 */
export class InfluencerClubClient {
    private apiKey: string;
    private baseUrl: string;

    constructor(config: InfluencerClubClientConfig) {
        this.apiKey = config.apiKey || INFLUENCER_CLUB_API_KEY || '';
        this.baseUrl = config.baseUrl || INFLUENCER_CLUB_BASE_URL;

        // Don't throw during build - will throw when actually used
        if (!this.apiKey && typeof window !== 'undefined') {
            console.warn('Influencer Club API key is not set');
        }
    }

    private ensureApiKey() {
        if (!this.apiKey) {
            throw new Error('Influencer Club API key is required. Please set INFLUENCER_CLUB_API_KEY environment variable.');
        }
    }

    /**
     * Make authenticated request to Influencer Club API
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        // Assuming API key via header 'x-api-key' or 'Authorization'. 
        // Usually 'x-api-key' for these types of services. I'll use that as default.
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            ...((options.headers as Record<string, string>) || {}),
        };

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Influencer Club API error: ${response.status} - ${errorText}`);
        }

        return response.json();
    }

    /**
     * Search Creators
     */
    async discoverCreators(params: {
        platform: Platform;
        filters: Record<string, any>;
        limit: number;
        offset?: number;
    }): Promise<ModashDiscoveryResult[]> {
        this.ensureApiKey();

        // Log the call
        await logApiCall({
            api_provider: 'influencer_club' as any, // Cast until type is updated
            api_action: 'discovery',
            reason: `Searching for ${params.limit} creators on ${params.platform} via Influencer Club`,
        });

        try {
            // Map filters to Influencer Club query format
            // Note: This mapping is hypothetical and should be adjusted based on real API docs
            const queryBody = {
                platform: params.platform,
                limit: params.limit,
                offset: params.offset || 0,
                filters: params.filters,
            };

            // Hypothetical endpoint
            // Adjust endpoint if needed (e.g., /search/creators or /profiles)
            const results = await this.request<{ profiles: any[] }>(
                '/search/profiles',
                {
                    method: 'POST',
                    body: JSON.stringify(queryBody),
                }
            );

            // Map results to standard ModashDiscoveryResult format to maintain compatibility
            return (results.profiles || []).map(p => ({
                creator_id: p.id || p.username,
                handle: p.username || p.handle,
                platform: params.platform,
                followers: p.followers_count,
                engagement_rate: p.engagement_rate,
                fullname: p.full_name,
                picture: p.profile_pic_url,
                // Add other fields as needed
            }));

        } catch (error) {
            console.error('Influencer Club discovery error:', error);
            throw error;
        }
    }
}

// Export singleton instance (lazy initialization)
let _influencerClubClient: InfluencerClubClient | null = null;
export const influencerClubClient = (() => {
    if (!_influencerClubClient) {
        _influencerClubClient = new InfluencerClubClient({
            apiKey: INFLUENCER_CLUB_API_KEY,
        });
    }
    return _influencerClubClient;
})();
