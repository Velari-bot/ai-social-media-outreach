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

    private validateFilters(filters: any) {
        // Robust check for targeting criteria
        const niche = filters.niche || filters.category || filters.topic || filters.topics;
        const keywords = filters.keywords || filters.keyword || filters.keywords_in_bio;

        const hasNiche = niche && niche !== '' && niche !== 'any' && niche !== 'Any Topic';
        const hasKeywords = keywords && (Array.isArray(keywords) ? keywords.length > 0 : String(keywords).trim() !== '');

        if (!hasNiche && !hasKeywords) {
            throw new Error("Discovery requires at least a niche or keyword.");
        }
    }

    private parseNiche(rawNiche: string): { niche: string; category?: string } {
        if (!rawNiche || rawNiche === 'any') return { niche: rawNiche };
        if (rawNiche.includes('(')) {
            const parts = rawNiche.split(' (');
            const nicheVal = parts[0].trim();
            const catVal = parts[1].replace(')', '').trim();
            return { niche: nicheVal, category: catVal };
        }
        return { niche: rawNiche, category: rawNiche };
    }

    /**
     * Search Creators with Fallback Strategy
     */
    async discoverCreators(params: {
        platform: Platform;
        filters: Record<string, any>;
        limit: number;
        offset?: number;
    }): Promise<ModashDiscoveryResult[]> {
        const requestId = Math.random().toString(36).substring(7);
        console.log(`[InfluencerClub:${requestId}] Starting discovery for ${params.platform}...`);

        // 1. Attempt A: Strict (Taxonomy aligned)
        let results = await this.fetchCreators(params);
        if (results.length > 0) {
            console.log(`[InfluencerClub:${requestId}] Attempt A (Strict) Success: Found ${results.length} creators.`);
            return results;
        }

        console.log(`[InfluencerClub:${requestId}] Attempt A failed (0 results). Trying Attempt B: Keyword-Only...`);

        // 2. Attempt B: Keyword-Only
        const { niche: cleanNiche } = this.parseNiche(params.filters.niche || "");
        const attemptBFilters = { ...params.filters };

        // Move everything to keywords
        const existingKeywords = attemptBFilters.keywords || attemptBFilters.keyword || [];
        const keywordList = Array.isArray(existingKeywords) ? [...existingKeywords] : [existingKeywords];
        if (cleanNiche && !keywordList.includes(cleanNiche)) keywordList.push(cleanNiche);

        attemptBFilters.keyword = keywordList.join(" ").trim();
        delete attemptBFilters.niche;
        delete attemptBFilters.category;
        delete attemptBFilters.topics;

        results = await this.fetchCreators({ ...params, filters: attemptBFilters });
        if (results.length > 0) {
            console.log(`[InfluencerClub:${requestId}] Attempt B (Keyword-Only) Success: Found ${results.length} creators.`);
            return results;
        }

        console.log(`[InfluencerClub:${requestId}] Attempt B failed. Trying Attempt C: Broad Keyword + No Followers...`);

        // 3. Attempt C: Broad Keyword + Min Followers = 0
        const attemptCFilters = { ...attemptBFilters, minFollowers: 0, min_followers: 0, followersMin: 0 };
        results = await this.fetchCreators({ ...params, filters: attemptCFilters });
        if (results.length > 0) {
            console.log(`[InfluencerClub:${requestId}] Attempt C (Broad Keyword + No Followers) Success: Found ${results.length} creators.`);
            return results;
        }

        console.log(`[InfluencerClub:${requestId}] All discovery attempts failed.`);
        return [];
    }

    /**
     * Internal Fetch Implementation
     */
    private async fetchCreators(params: {
        platform: Platform;
        filters: Record<string, any>;
        limit: number;
        offset?: number;
    }): Promise<ModashDiscoveryResult[]> {
        this.ensureApiKey();
        const requestId = Math.random().toString(36).substring(7);

        try {
            this.validateFilters(params.filters);
        } catch (e) {
            console.warn(`[InfluencerClub:${requestId}] Validation failed, skipping fetch:`, e);
            return [];
        }

        // Normalize Filters (Handle snake_case vs camelCase)
        const f = params.filters;
        const minF = f.min_followers || f.minFollowers || f.followersMin || 1000;
        const maxF = f.max_followers || f.maxFollowers || f.followersMax || undefined;

        const { niche: cleanNiche, category: cleanCategory } = this.parseNiche(f.niche || "");

        // Prepare Payload for Official API
        const body: any = {
            platform: params.platform.toLowerCase(),
            limit: params.limit || 50,
            offset: params.offset || 0,
            min_followers: Number(minF),
            sort_by: "relevancy",
            sort_order: "desc"
        };

        if (maxF) body.max_followers = Number(maxF);

        // Niche/Category
        if (f.category || cleanCategory) body.category = f.category || cleanCategory;
        if (f.niche || cleanNiche) body.niche = cleanNiche;

        // Keywords
        const keywordInput = f.keyword || f.keywords || "";
        let keywords = Array.isArray(keywordInput) ? keywordInput.join(" ") : String(keywordInput);
        if (!keywords && cleanNiche) keywords = cleanNiche;
        body.keyword = keywords || "influencer";

        // Location
        const countryCode = this.getCountryCode(f.location || f.country);
        if (countryCode) body.location = [countryCode];

        console.log(`[InfluencerClub:${requestId}] Official API Query:`, JSON.stringify(body, null, 2));

        try {
            await logApiCall({
                api_provider: 'influencer_club' as any,
                api_action: 'discovery',
                reason: `Searching for ${body.keyword}`,
            });

            const url = `${this.baseUrl}/public/v1/discovery/`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const text = await response.text();
                console.error(`[InfluencerClub:${requestId}] API Error:`, text);
                return [];
            }

            const data = await response.json();
            const accounts = data.accounts || [];

            return accounts.map((p: any) => {
                const profile = p.profile || {};
                return {
                    creator_id: p.user_id || profile.username,
                    handle: profile.username || p.user_id,
                    platform: params.platform,
                    followers: profile.followers || profile.followers_count || p.followers || 0,
                    engagement_rate: profile.engagement_percent ? (profile.engagement_percent / 100) : (profile.engagement_rate || 0),
                    fullname: profile.full_name || profile.name || profile.username,
                    picture: profile.picture || profile.profile_pic_url,
                    emails: profile.emails || p.emails || []
                };
            });
        } catch (error) {
            console.error(`[InfluencerClub:${requestId}] Discovery exception:`, error);
            return [];
        }
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        return {} as T;
    }
}

// Export singleton
let _influencerClubClient: InfluencerClubClient | null = null;
export const influencerClubClient = (() => {
    if (!_influencerClubClient) {
        _influencerClubClient = new InfluencerClubClient({
            apiKey: INFLUENCER_CLUB_API_KEY,
        });
    }
    return _influencerClubClient;
})();
