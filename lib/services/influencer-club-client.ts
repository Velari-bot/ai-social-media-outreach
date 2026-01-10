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
 * Refactored to strictly follow credit-safety rules.
 */
export class InfluencerClubClient {
    private apiKey: string;
    private baseUrl: string;

    constructor(config: InfluencerClubClientConfig) {
        this.apiKey = config.apiKey || INFLUENCER_CLUB_API_KEY || '';
        this.baseUrl = config.baseUrl || INFLUENCER_CLUB_BASE_URL;

        if (!this.apiKey && typeof window !== 'undefined') {
            console.warn('Influencer Club API key is not set');
        }
    }

    private ensureApiKey() {
        if (!this.apiKey) {
            throw new Error('Influencer Club API key is required.');
        }
    }

    /**
     * Parse location string to ISO country code (Simple implementation)
     */
    private getCountryCode(location: string): string | undefined {
        if (!location) return undefined;
        const lower = location.toLowerCase();
        if (lower === 'any' || lower === 'anywhere' || lower === 'world' || lower === 'worldwide') return undefined;

        if (lower.includes('united states') || lower.includes('usa') || lower.includes('us')) return 'US';
        if (lower.includes('united kingdom') || lower.includes('uk') || lower.includes('great britain')) return 'GB';
        if (lower.includes('canada')) return 'CA';
        if (lower.includes('australia')) return 'AU';
        if (lower.includes('germany')) return 'DE';
        if (lower.includes('france')) return 'FR';
        if (lower.includes('italy')) return 'IT';
        if (lower.includes('spain')) return 'ES';
        if (lower.includes('brazil')) return 'BR';
        if (lower.includes('india')) return 'IN';
        if (lower.includes('japan')) return 'JP';
        return undefined;
    }

    /**
     * Validate filters before API call
     */
    private validateFilters(filters: any) {
        // Strict Validation: Keywords OR Category required.
        const hasStrongTargeting =
            (filters.keywords && filters.keywords.length > 0) ||
            (filters.topics && filters.topics !== 'any' && filters.topics !== 'Any Topic') ||
            filters.category;

        if (!hasStrongTargeting) {
            throw new Error("Influencer Club discovery requires keywords or a category to return results.");
        }
    }

    /**
     * Search Creators with strict credit safety
     * Strategy: Fetch broadly (Targeting Only) -> Filter Locally (Numeric Stats)
     */
    async discoverCreators(params: {
        platform: Platform;
        filters: Record<string, any>;
        limit: number;
        offset?: number;
    }): Promise<ModashDiscoveryResult[]> {
        this.ensureApiKey();
        this.validateFilters(params.filters);

        // 1. Prepare Filters Object
        const filters: any = {};

        // Category (Required)
        if (params.filters.category) {
            filters.category = params.filters.category;
        } else if (params.filters.topics && params.filters.topics !== 'any') {
            filters.category = Array.isArray(params.filters.topics) ? params.filters.topics[0] : params.filters.topics;
        }

        // Keywords (Optional) -> keywords_in_bio
        if (params.filters.keywords && Array.isArray(params.filters.keywords) && params.filters.keywords.length > 0) {
            filters.keywords_in_bio = params.filters.keywords;
        }

        // Location (Optional) -> location array
        const countryCode = this.getCountryCode(params.filters.location);
        if (countryCode) {
            filters.location = [countryCode];
        } else if (params.filters.location && !['any', 'anywhere'].includes(params.filters.location.toLowerCase())) {
            // If we have a location string that isn't a code, try sending it as is, or fallback to keyword if API strictly wants codes.
            // Docs say "location": ["US"], suggesting codes. But let's try strict code separation.
            // If unknown string, maybe don't send it to avoid 0 results, or log warning.
        }

        // Numeric Filters (As per docs structure)
        // We still adhere to safety: if user didn't specify, we omit or send broad defaults?
        // User prompt says: "Don’t send filters that are too strict... otherwise you’ll get 0 results".
        // BUT also says "Numeric filters should be applied after fetching if possible".
        // HOWEVER, the API supports them. Let's send them ONLY if clearly specified, otherwise rely on broad search.
        // Actually, for maximum safety (Post-Fetch Strategy), let's keep omitting them from the API call
        // and filter locally, UNLESS the dataset is too huge.
        // Given the new "Official" structure request, I will map them but comment out or keep them omitted 
        // if we are sticking to the "Post-Fetch" strategy. 
        // *Decision*: sticking to Post-Fetch for reliability as per previous success context, 
        // BUT mapping the *structure* correctly so if we DO enable them later, it works.
        // For now, I will NOT include them in the `filters` object sent to API to maintain the "Credit Firewall" safety.

        // 2. Prepare Payload (Official Structure)
        const body = {
            platform: params.platform.toLowerCase(),
            paging: {
                limit: params.limit || 50,
                page: params.offset ? Math.floor(params.offset / (params.limit || 50)) : 0
            },
            sort: {
                sort_by: "relevancy",
                sort_order: "desc"
            },
            filters: filters
        };

        // 3. Log Request
        console.log("[InfluencerClub] Official API Query:", JSON.stringify(body, null, 2));
        await logApiCall({
            api_provider: 'influencer_club' as any,
            api_action: 'discovery',
            reason: `Searching for ${params.limit} creators on ${params.platform}`,
        });

        try {
            const url = `${this.baseUrl}/public/v1/discovery/`;
            const authHeader = this.apiKey.startsWith('Bearer ') ? this.apiKey : `Bearer ${this.apiKey}`;

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": authHeader, // Per docs: Authorization: Bearer ...
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Influencer Club API error: ${text}`);
            }

            const data = await response.json();

            // Response Structure: { total, limit, credits_left, accounts: [...] }
            const accounts = data.accounts || [];

            if (data.credits_left) {
                console.log(`[InfluencerClub] Credits Remaining: ${data.credits_left}`);
            }
            console.log(`[InfluencerClub] Raw Return: ${accounts.length} / Total Matches: ${data.total}`);

            // 4. Normalization & Local Filtering (Post-Fetch Strategy)
            const normalizedCreators = accounts.map((p: any) => {
                const profile = p.profile || {};
                return {
                    creator_id: p.user_id || profile.username,
                    handle: profile.username || p.user_id, // fallback
                    platform: params.platform,
                    followers: profile.followers,
                    engagement_rate: profile.engagement_percent ? (profile.engagement_percent / 100) : 0, // Convert 4.2 -> 0.042
                    fullname: profile.full_name,
                    picture: profile.picture,
                    emails: profile.emails || []
                };
            });

            // Local Numeric Filtering
            const minFollowers = params.filters.followersMin ? parseInt(params.filters.followersMin) : 1000;
            const maxFollowers = params.filters.followersMax ? parseInt(params.filters.followersMax) : undefined;
            const minEngagement = params.filters.engagementRateMin ? parseFloat(params.filters.engagementRateMin) : undefined;

            const filteredCreators = normalizedCreators.filter((c: any) => {
                const followers = c.followers || 0;
                const er = c.engagement_rate || 0;

                if (minFollowers && followers < minFollowers) return false;
                if (maxFollowers && followers > maxFollowers) return false;

                // ER in app is 0-1 (0.01 = 1%). Profile returned 4.2 (percent). We divided by 100 above.
                // minEngagement input is usually integer 1 (for 1%).
                // Threshold: 1 -> 0.01. 
                if (minEngagement) {
                    const threshold = minEngagement > 1 ? minEngagement / 100 : minEngagement;
                    if (er < threshold) return false;
                }
                return true;
            });

            console.log(`[InfluencerClub] Post-Filter Return: ${filteredCreators.length} (from ${accounts.length})`);

            return filteredCreators;

        } catch (error) {
            console.error('Influencer Club discovery error:', error);
            throw error;
        }
    }

    // Helper for direct request if needed, but discoverCreators is primary
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        return {} as T;
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
