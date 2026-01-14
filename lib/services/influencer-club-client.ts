import { ModashDiscoveryResult, Platform } from '../types';
import { logApiCall } from './api-logger';

const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY || '';
const DEFAULT_IC_BASE_URL = 'https://api-dashboard.influencers.club';

/**
 * Influencer Club API Client
 * This version is designed to solve the "Filter Ignoring" and "Result Count" issues
 * by using an exhaustive schema that targets multiple API versions at once.
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

        // THE ULTIMATE "NO-GAMES" PAYLOAD
        // This payload provides filters in every possible format the IC API has ever used.
        // It covers both the Dashboard API and the Discovery API.
        const body: any = {
            // Root level params (Standard)
            platform: params.platform.toLowerCase(),
            limit: params.limit || 50,
            offset: params.offset || 0,

            // Follower filters (Multiple formats)
            min_followers: minFollowers,
            max_followers: maxFollowers,
            minFollowers: minFollowers,
            maxFollowers: maxFollowers,

            // Niche/Category filters (Multiple formats)
            niche: cleanNiche,
            category: cleanCategory,
            keyword: cleanNiche,
            keywords: [cleanNiche].filter(Boolean),

            // Nested Paging (V1 Schema)
            paging: {
                limit: params.limit || 50,
                offset: params.offset || 0,
                page: Math.floor((params.offset || 0) / (params.limit || 50))
            },

            // Nested Filters (High-Accuracy / Theneo Schema)
            filters: {
                platform: params.platform.toLowerCase(),
                category: params.filters.category || cleanCategory,
                niche: params.filters.niche || cleanNiche,
                keyword: cleanNiche,
                keywords: [cleanNiche].filter(Boolean),
                // The "Source [1]" special: Object-based followers
                number_of_followers: {
                    min: minFollowers,
                    max: maxFollowers
                },
                min_followers: minFollowers,
                max_followers: maxFollowers,
                minFollowers: minFollowers,
                maxFollowers: maxFollowers
            },

            sort_by: "relevancy",
            sort_order: "desc"
        };

        console.log(`[InfluencerClub:${requestId}] Searching ${params.platform} for "${cleanNiche}" in ${minFollowers}-${maxFollowers} range.`);

        try {
            // We prioritize the Dashboard URL as it is the most stable source of truth for discovery
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
                if (response.status === 401) throw new Error("Influencer Club API Key is unauthorized (401).");

                // If dashboard fails, try the newer discovery endpoint with the same payload
                return await this.tryNewDiscoveryEndpoint(params, body, requestId);
            }

            const data = await response.json();
            const accounts = data.accounts || data.results || data.data || [];

            console.log(`[InfluencerClub:${requestId}] Result check: First account followers: ${accounts[0]?.profile?.followers || accounts[0]?.followers}`);

            return this.mapResults(accounts, params.platform);

        } catch (error: any) {
            if (error.message.includes('401')) throw error;
            console.error(`[InfluencerClub:${requestId}] API Error:`, error.message);
            // Fallback attempt on any non-auth error
            return await this.tryNewDiscoveryEndpoint(params, body, requestId);
        }
    }

    private async tryNewDiscoveryEndpoint(params: any, body: any, requestId: string): Promise<ModashDiscoveryResult[]> {
        const newUrl = `https://api.influencerclub.com/discover`;
        try {
            console.log(`[InfluencerClub:${requestId}] Trying Discovery API Fallback...`);
            const res = await fetch(newUrl, {
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
