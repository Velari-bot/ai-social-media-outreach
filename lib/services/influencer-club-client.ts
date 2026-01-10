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

        const authHeader = this.apiKey.startsWith('Bearer ') ? this.apiKey : `Bearer ${this.apiKey}`;

        // Debug logging for 401 troubleshooting (obfuscated)
        if (!this.apiKey) {
            console.error('Influencer Club API Key is EMPTY');
        } else {
            const maskedKey = `${this.apiKey.substring(0, 8)}...${this.apiKey.substring(this.apiKey.length - 4)}`;
            console.log(`Influencer Club Request: ${url} (Key: ${maskedKey})`);
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
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
            // Sanitize filters to match Influencer Club's expected format
            const sanitizedFilters: Record<string, any> = {};

            // Only include valid, non-'any' filters
            Object.keys(params.filters).forEach(key => {
                const value = params.filters[key];

                // Skip 'any', empty strings, null, undefined, and internal fields
                if (value === 'any' || value === '' || value == null || key === 'batchSize') {
                    return;
                }

                // Include location if it's a valid code
                if (key === 'location' && value) {
                    sanitizedFilters.location = value;
                    return;
                }

                // Include topics if it's a valid ID
                if (key === 'topics' && value) {
                    sanitizedFilters.topics = [value]; // API expects array
                    return;
                }

                // Include follower ranges
                if (key === 'followersMin' || key === 'followersMax') {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue)) {
                        sanitizedFilters[key] = numValue;
                    }
                }
            });

            // Map filters to query format
            const queryBody = {
                platform: params.platform,
                limit: params.limit,
                offset: params.offset || 0,
                // Only include filters if we have any valid ones
                ...(Object.keys(sanitizedFilters).length > 0 ? { filters: sanitizedFilters } : {})
            };

            console.log('[InfluencerClub] Sanitized query:', JSON.stringify(queryBody, null, 2));

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
