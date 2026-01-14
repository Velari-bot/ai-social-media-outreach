import { ModashDiscoveryResult, Platform } from '../types';
import { logApiCall } from './api-logger';

const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY || '';
const DEFAULT_IC_BASE_URL = 'https://api-dashboard.influencers.club';

/**
 * Influencer Club API Client
 * Optimized for maximum filter compliance and result counts.
 */
export class InfluencerClubClient {
    private apiKey: string;
    private baseUrl: string;

    constructor(config: { apiKey: string; baseUrl?: string }) {
        this.apiKey = (config.apiKey || INFLUENCER_CLUB_API_KEY || '').trim();
        this.baseUrl = (config.baseUrl || DEFAULT_IC_BASE_URL).replace(/\/$/, '');
    }

    private getAuthHeader() {
        // Ensure clean Bearer token
        const cleanKey = this.apiKey.replace(/^Bearer\s+/i, '');
        return `Bearer ${cleanKey}`;
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

    async discoverCreators(params: {
        platform: Platform;
        filters: Record<string, any>;
        limit: number;
        offset?: number;
    }): Promise<ModashDiscoveryResult[]> {
        if (!this.apiKey) throw new Error('Influencer Club API Key is missing.');

        const requestId = Math.random().toString(36).substring(7);
        const { niche: cleanNiche, category: cleanCategory } = this.parseNiche(params.filters.niche || "");

        const minFollowers = Number(params.filters.min_followers || params.filters.minFollowers || 1000);
        const maxFollowers = Number(params.filters.max_followers || params.filters.maxFollowers || 1000000);

        // This is the "Ultra Schema" - combines all known required fields from documentation and user examples
        const body: any = {
            platform: params.platform.toLowerCase(),
            // Top level paging (Flat schema)
            limit: params.limit || 50,
            offset: params.offset || 0,
            // Top level filters (Flat schema fallback)
            min_followers: minFollowers,
            max_followers: maxFollowers,
            minFollowers: minFollowers,
            maxFollowers: maxFollowers,
            niche: cleanNiche,
            category: cleanCategory,

            // Nested Paging (V1 Schema Requirement)
            paging: {
                limit: params.limit || 50,
                offset: params.offset || 0,
                page: Math.floor((params.offset || 0) / (params.limit || 50))
            },

            // Nested Filters (High-Accuracy Schema)
            filters: {
                min_followers: minFollowers,
                max_followers: maxFollowers,
                platform: params.platform.toLowerCase(),
                category: params.filters.category || cleanCategory,
                niche: params.filters.niche || cleanNiche,
                keyword: cleanNiche,
                keywords: [cleanNiche].filter(Boolean)
            },

            sort_by: "relevancy",
            sort_order: "desc"
        };

        console.log(`[InfluencerClub:${requestId}] POST ${this.baseUrl}/public/v1/discovery/`);
        // console.log(`[InfluencerClub:${requestId}] Payload:`, JSON.stringify(body));

        try {
            // Priority 1: Reach the dashboard discovery endpoint
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
                // If the primary endpoint is failing but the key is good, try the alternate /discover endpoint
                if (response.status === 403 || response.status === 404) {
                    console.warn(`[InfluencerClub:${requestId}] Dashboard API failed (${response.status}), trying /discover fallback...`);
                    return await this.discoverFallback(params, body, requestId);
                }
                if (response.status === 401) throw new Error("Influencer Club API Key is unauthorized (401).");
                return [];
            }

            const data = await response.json();
            const accounts = data.accounts || data.results || data.data || [];

            console.log(`[InfluencerClub:${requestId}] Success! Got ${accounts.length} creators (Total matching: ${data.total || '?'})`);

            return this.mapResults(accounts, params.platform);

        } catch (error: any) {
            if (error.message.includes('401')) throw error;
            console.error(`[InfluencerClub:${requestId}] Error:`, error.message);
            return [];
        }
    }

    private async discoverFallback(params: any, body: any, requestId: string): Promise<ModashDiscoveryResult[]> {
        // Try the flatter /discover endpoint which some users prefer
        const fallbackUrl = `${this.baseUrl}/discover`;
        try {
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
