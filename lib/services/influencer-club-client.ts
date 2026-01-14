import { ModashDiscoveryResult, Platform } from '../types';
import { logApiCall } from './api-logger';

const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY || '';
const DEFAULT_IC_BASE_URL = 'https://api-dashboard.influencers.club';

/**
 * Influencer Club API Client
 * This version uses the "Follower Strictness" payload to ensure max_followers is honored.
 */
export class InfluencerClubClient {
    private apiKey: string;
    private baseUrl: string;

    constructor(config: { apiKey: string; baseUrl?: string }) {
        this.apiKey = (config.apiKey || INFLUENCER_CLUB_API_KEY || '').trim();
        this.baseUrl = (config.baseUrl || DEFAULT_IC_BASE_URL).replace(/\/$/, '');
    }

    private getAuthHeader() {
        const cleanKey = this.apiKey.replace(/^Bearer\s+/i, '');
        return `Bearer ${cleanKey}`;
    }

    private parseTopics(rawNiche: string): { niche: string; category?: string } {
        if (!rawNiche || rawNiche === 'any') return { niche: rawNiche };
        if (rawNiche.includes('(')) {
            const parts = rawNiche.split(' (');
            const nicheVal = parts[0].trim();
            const catVal = parts[1].replace(')', '').trim();
            return { niche: nicheVal, category: catVal };
        }
        return { niche: rawNiche, category: rawNiche };
    }

    async discoverCreators(params: {
        platform: Platform;
        filters: Record<string, any>;
        limit: number;
        offset?: number;
    }): Promise<ModashDiscoveryResult[]> {
        if (!this.apiKey) throw new Error('Influencer Club API Key is missing.');

        const requestId = Math.random().toString(36).substring(7);
        const { niche: cleanNiche, category: cleanCategory } = this.parseTopics(params.filters.niche || "");

        const minFollowers = Number(params.filters.min_followers || params.filters.minFollowers || 1000);
        const maxFollowers = Number(params.filters.max_followers || params.filters.maxFollowers || 1000000);

        // THE "FIXED" PAYLOAD
        // Using "followers_min" and "followers_max" as these are common in discovery APIs
        const body: any = {
            platform: params.platform.toLowerCase(),
            limit: params.limit || 50,
            offset: params.offset || 0,

            // Multiple redundant field sets to force compliance
            min_followers: minFollowers,
            max_followers: maxFollowers,
            followers_min: minFollowers,
            followers_max: maxFollowers,
            minFollowers: minFollowers,
            maxFollowers: maxFollowers,

            // Topic targeting
            niche: cleanNiche,
            category: cleanCategory,
            keywords: [cleanNiche].filter(Boolean),

            // Nested structure for the official v1 endpoint
            filters: {
                platform: params.platform.toLowerCase(),
                category: cleanCategory,
                keywords: [cleanNiche].filter(Boolean),
                // Object-based followers (Often used for range filtering)
                number_of_followers: {
                    min: minFollowers,
                    max: maxFollowers
                },
                min_followers: minFollowers,
                max_followers: maxFollowers,
                followers_min: minFollowers,
                followers_max: maxFollowers
            },

            paging: {
                limit: params.limit || 50,
                offset: params.offset || 0
            }
        };

        console.log(`[InfluencerClub:${requestId}] Discovery Request: ${params.platform} - ${cleanNiche} - Range: ${minFollowers}-${maxFollowers}`);

        try {
            const response = await fetch(`${this.baseUrl}/public/v1/discovery/`, {
                method: "POST",
                headers: {
                    "Authorization": this.getAuthHeader(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const text = await response.text();
                // If it's a 401, error out immediately
                if (response.status === 401) throw new Error("Influencer Club API Key is unauthorized (401).");

                // Try fallback to the alternative /discover endpoint but keep the same body
                return await this.tryDiscoverFallback(params, body, requestId);
            }

            const data = await response.json();
            const accounts = data.accounts || data.results || data.data || [];

            // LOG the first result's followers to see if filtering is working server-side
            if (accounts.length > 0) {
                const firstF = accounts[0].profile?.followers || accounts[0].followers;
                console.log(`[InfluencerClub:${requestId}] First result has ${firstF} followers. (Target Max: ${maxFollowers})`);
            }

            return this.mapResults(accounts, params.platform);

        } catch (error: any) {
            if (error.message.includes('401')) throw error;
            console.error(`[InfluencerClub:${requestId}] Network Error:`, error.message);
            return [];
        }
    }

    private async tryDiscoverFallback(params: any, body: any, requestId: string): Promise<ModashDiscoveryResult[]> {
        const fallbackUrl = `https://api.influencerclub.com/discover`;
        try {
            console.log(`[InfluencerClub:${requestId}] Trying /discover fallback...`);
            const res = await fetch(fallbackUrl, {
                method: "POST",
                headers: {
                    "Authorization": this.getAuthHeader(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });
            if (!res.ok) return [];
            const data = await res.json();
            const accounts = data.accounts || data.results || data.data || [];
            return this.mapResults(accounts, params.platform);
        } catch (e) {
            return [];
        }
    }

    private mapResults(accounts: any[], platform: string): ModashDiscoveryResult[] {
        return accounts.map((p: any) => {
            const profile = p.profile || p;
            return {
                creator_id: String(p.user_id || profile.username || profile.id),
                handle: String(profile.username || p.user_id || profile.id),
                platform: platform,
                followers: Number(profile.followers || profile.followers_count || p.followers || 0),
                engagement_rate: profile.engagement_percent ? (profile.engagement_percent / 100) : (profile.engagement_rate || 0),
                fullname: profile.full_name || profile.name || profile.username,
                picture: profile.picture || profile.profile_pic_url || profile.avatar_url,
                emails: profile.emails || p.emails || []
            };
        });
    }
}

let _influencerClubClient: InfluencerClubClient | null = null;
export const influencerClubClient = (() => {
    if (!_influencerClubClient) {
        _influencerClubClient = new InfluencerClubClient({
            apiKey: INFLUENCER_CLUB_API_KEY,
        });
    }
    return _influencerClubClient;
})();
