import { ModashDiscoveryResult, Platform } from '../types';
import { logApiCall } from './api-logger';

const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY || '';
// Base URL for the Discovery API from user requirements
const INFLUENCER_CLUB_BASE_URL = 'https://api.influencerclub.com';

export class InfluencerClubClient {
    private apiKey: string;
    private baseUrl: string;

    constructor(config: { apiKey: string; baseUrl?: string }) {
        this.apiKey = (config.apiKey || INFLUENCER_CLUB_API_KEY || '').trim();
        this.baseUrl = (config.baseUrl || INFLUENCER_CLUB_BASE_URL).replace(/\/$/, '');
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

        // This is the EXACT flat structure the user provided in their clean minimal example
        // It uses camelCase for the follower keys and puts niche/category at the top level
        const body: any = {
            platform: params.platform.toLowerCase(),
            niche: cleanNiche || params.filters.niche,
            category: cleanCategory || params.filters.category,
            minFollowers: minFollowers,
            maxFollowers: maxFollowers,
            limit: params.limit || 50,
            offset: params.offset || 0,
            // Add keywords string just in case, some versions use it
            keywords: cleanNiche || params.filters.niche
        };

        console.log(`[InfluencerClub:${requestId}] POST ${this.baseUrl}/discover`);
        console.log(`[InfluencerClub:${requestId}] Searching for niche: "${body.niche}"`);

        try {
            // THE USER EXPLICITLY ASKED TO USE THE DISCOVERY API
            // AND the /discover endpoint on api.influencerclub.com
            const response = await fetch(`${this.baseUrl}/discover`, {
                method: "POST",
                headers: {
                    "Authorization": this.getAuthHeader(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const text = await response.text();
                // If the new domain is unreachable, fall back to the dashboard one but keep the FLAT schema
                if (response.status === 401) throw new Error("Influencer Club API Key is unauthorized (401).");

                console.warn(`[InfluencerClub:${requestId}] Primary discovery failed (${response.status}), trying fallback domain...`);
                return await this.discoverFallback(params, body, requestId);
            }

            const data = await response.json();
            const accounts = data.accounts || data.results || data.data || [];

            console.log(`[InfluencerClub:${requestId}] Success! Got ${accounts.length} creators.`);

            return this.mapResults(accounts, params.platform);

        } catch (error: any) {
            if (error.message.includes('401')) throw error;
            console.error(`[InfluencerClub:${requestId}] Primary error:`, error.message);
            // Even on network error, try the fallback domain
            return await this.discoverFallback(params, body, requestId);
        }
    }

    private async discoverFallback(params: any, body: any, requestId: string): Promise<ModashDiscoveryResult[]> {
        const fallbackUrl = `https://api-dashboard.influencers.club/public/v1/discovery/`;
        // When using the dashboard endpoint, we might need the nested schema for niches to work
        const nestedBody = {
            ...body,
            filters: {
                platform: params.platform.toLowerCase(),
                min_followers: body.minFollowers,
                max_followers: body.maxFollowers,
                category: body.category,
                keyword: body.niche,
                keywords: [body.niche].filter(Boolean)
            },
            paging: {
                limit: body.limit,
                offset: body.offset
            }
        };

        try {
            const res = await fetch(fallbackUrl, {
                method: "POST",
                headers: {
                    "Authorization": this.getAuthHeader(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(nestedBody)
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
