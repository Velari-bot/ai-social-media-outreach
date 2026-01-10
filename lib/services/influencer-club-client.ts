import { ModashDiscoveryResult, Platform } from '../types';
import { logApiCall } from './api-logger';

// These should be set as environment variables
const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY || '';
const INFLUENCER_CLUB_BASE_URL = 'https://api-dashboard.influencers.club';

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

        // Header: 'Authorization' seems to be widely used. 
        // The key provided by user is a JWT, so 'Bearer' prefix is standard.
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': this.apiKey.includes('Bearer') ? this.apiKey : `Bearer ${this.apiKey}`,
            ...((options.headers as Record<string, string>) || {}),
        };

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Influencer Club API Error (${response.status}): ${errorText}`);
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
            api_provider: 'influencer_club' as any,
            api_action: 'discovery',
            reason: `Searching for ${params.limit} creators on ${params.platform} via Influencer Club`,
        });

        try {
            // Map filters to query format
            const queryBody = {
                platform: params.platform,
                limit: params.limit,
                offset: params.offset || 0,
                filters: params.filters,
            };

            // Using the api-dashboard domain and public discovery path
            const results = await this.request<{ profiles: any[] }>(
                '/public/v1/discovery/',
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
