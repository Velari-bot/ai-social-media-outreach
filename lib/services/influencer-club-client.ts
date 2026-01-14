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
 * Updated to use the NESTED Schema required by the API
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
            throw new Error('Influencer Club API key is required. Please check your environment variables.');
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

        // Attempt 1: Strict Niche + Category
        let results = await this.fetchCreators(params);
        if (results.length > 0) return results;

        console.log(`[InfluencerClub:${requestId}] Attempt A failed. Trying Attempt B: Broad Keyword...`);

        // Attempt 2: Keyword Broad
        const { niche: cleanNiche } = this.parseNiche(params.filters.niche || "");
        const broadFilters = { ...params.filters };
        const keywordInput = broadFilters.keywords || broadFilters.keyword || "";
        let keywordList = Array.isArray(keywordInput) ? [...keywordInput] : [keywordInput];
        if (cleanNiche && !keywordList.includes(cleanNiche)) keywordList.push(cleanNiche);

        broadFilters.keyword = keywordList.filter(Boolean).join(" ");
        delete broadFilters.niche;
        delete broadFilters.category;

        results = await this.fetchCreators({ ...params, filters: broadFilters });
        if (results.length > 0) return results;

        console.log(`[InfluencerClub:${requestId}] All attempts failed.`);
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
        if (!this.apiKey) {
            console.error("[InfluencerClub] CRITICAL: API Key is missing.");
            return [];
        }

        const requestId = Math.random().toString(36).substring(7);
        const f = params.filters;

        // 1. Prepare NESTED Payload
        const body: any = {
            platform: params.platform.toLowerCase(),
            paging: {
                limit: params.limit || 50,
                offset: params.offset || 0,
                page: Math.floor((params.offset || 0) / (params.limit || 50))
            },
            filters: {
                // Followers (Using both aliases for safety)
                min_followers: Number(f.min_followers || f.minFollowers || f.followersMin || 1000),
                followers_min: String(f.min_followers || f.minFollowers || f.followersMin || 1000),
            },
            sort_by: "relevancy",
            sort_order: "desc"
        };

        if (f.max_followers || f.maxFollowers || f.followersMax) {
            const maxF = f.max_followers || f.maxFollowers || f.followersMax;
            body.filters.max_followers = Number(maxF);
            body.filters.followers_max = String(maxF);
        }

        // Niche/Category/Keyword
        const { niche: cleanNiche, category: cleanCategory } = this.parseNiche(f.niche || "");
        if (f.category || cleanCategory) body.filters.category = f.category || cleanCategory;
        if (f.niche || cleanNiche) body.filters.niche = cleanNiche;

        const keywordInput = f.keyword || f.keywords || "";
        let keywords = Array.isArray(keywordInput) ? keywordInput.join(" ") : String(keywordInput);
        if (!keywords && cleanNiche) keywords = cleanNiche;
        body.filters.keyword = keywords || "influencer";

        // Location
        const countryCode = this.getCountryCode(f.location || f.country);
        if (countryCode) body.filters.location = [countryCode];

        console.log(`[InfluencerClub:${requestId}] API Request:`, JSON.stringify(body));

        try {
            await logApiCall({
                api_provider: 'influencer_club' as any,
                api_action: 'discovery',
                reason: `Discovery for ${body.filters.keyword}`,
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
                console.error(`[InfluencerClub:${requestId}] API Error (${response.status}):`, text);
                if (response.status === 401) throw new Error("Invalid Influencer Club API Key.");
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
        } catch (error: any) {
            console.error(`[InfluencerClub:${requestId}] Exception:`, error.message);
            return [];
        }
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
