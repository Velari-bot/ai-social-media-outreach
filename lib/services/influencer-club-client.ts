import { ModashDiscoveryResult, Platform } from '../types';
import { logApiCall } from './api-logger';

// Default values, can be overridden by env
const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY || '';
const DEFAULT_IC_BASE_URL = 'https://api-dashboard.influencers.club';
const INFLUENCER_CLUB_BASE_URL = process.env.INFLUENCER_CLUB_BASE_URL || DEFAULT_IC_BASE_URL;

interface InfluencerClubClientConfig {
    apiKey: string;
    baseUrl?: string;
}

export class InfluencerClubClient {
    private apiKey: string;
    private baseUrl: string;

    constructor(config: InfluencerClubClientConfig) {
        this.apiKey = config.apiKey || INFLUENCER_CLUB_API_KEY || '';
        this.baseUrl = config.baseUrl || INFLUENCER_CLUB_BASE_URL;
    }

    private ensureApiKey() {
        if (!this.apiKey) {
            throw new Error('Influencer Club API key is required. Please check your environment variables.');
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

    async discoverCreators(params: {
        platform: Platform;
        filters: Record<string, any>;
        limit: number;
        offset?: number;
    }): Promise<ModashDiscoveryResult[]> {
        const requestId = Math.random().toString(36).substring(7);
        console.log(`[InfluencerClub:${requestId}] Discovery for ${params.platform}...`);

        try {
            // Attempt 1: The "Simple/Flat" Structure (Matches User's Clean Example)
            console.log(`[InfluencerClub:${requestId}] Attempt 1: Simple/Flat Payload...`);
            let results = await this.fetchWithPayload(params, 'flat');
            if (results && results.length > 0) return results;

            // Attempt 2: The "Nested" Structure (Verified in older debug scripts)
            console.log(`[InfluencerClub:${requestId}] Attempt 2: Nested Payload...`);
            results = await this.fetchWithPayload(params, 'nested');
            if (results && results.length > 0) return results;

            return [];
        } catch (error: any) {
            console.error(`[InfluencerClub:${requestId}] Fatal error:`, error.message);
            throw error; // Re-throw to allow API route to handle correctly
        }
    }

    private async fetchWithPayload(params: {
        platform: Platform;
        filters: Record<string, any>;
        limit: number;
        offset?: number;
    }, type: 'flat' | 'nested'): Promise<ModashDiscoveryResult[]> {
        this.ensureApiKey();
        const requestId = Math.random().toString(36).substring(7);
        const f = params.filters;
        const { niche: cleanNiche, category: cleanCategory } = this.parseNiche(f.niche || "");

        let body: any = {};

        if (type === 'flat') {
            // Matching the "User Clean Example" style
            body = {
                platform: params.platform.toLowerCase(),
                niche: f.niche || cleanNiche, // Try the original string first
                keyword: cleanNiche,
                minFollowers: Number(f.min_followers || f.minFollowers || f.followersMin || 1000),
                maxFollowers: f.max_followers || f.maxFollowers || f.followersMax ? Number(f.max_followers || f.maxFollowers || f.followersMax) : undefined,
                limit: params.limit || 50,
                offset: params.offset || 0,
                // Add snake_case aliases too for safety
                min_followers: Number(f.min_followers || f.minFollowers || f.followersMin || 1000),
                category: f.category || cleanCategory
            };
        } else {
            // Nested structure
            body = {
                platform: params.platform.toLowerCase(),
                paging: {
                    limit: params.limit || 50,
                    offset: params.offset || 0,
                    page: Math.floor((params.offset || 0) / (params.limit || 50))
                },
                filters: {
                    min_followers: Number(f.min_followers || f.minFollowers || f.followersMin || 1000),
                    followers_min: String(f.min_followers || f.minFollowers || f.followersMin || 1000),
                    category: f.category || cleanCategory,
                    niche: cleanNiche,
                    keyword: cleanNiche || "influencer"
                },
                sort_by: "relevancy",
                sort_order: "desc"
            };
        }

        const authHeader = this.apiKey.startsWith('Bearer ') ? this.apiKey : `Bearer ${this.apiKey}`;

        // Try discovery endpoint
        const finalUrl = `${this.baseUrl}/public/v1/discovery/`;

        try {
            const response = await fetch(finalUrl, {
                method: "POST",
                headers: {
                    "Authorization": authHeader,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const text = await response.text();
                if (response.status === 401) throw new Error("Influencer Club API Key is unauthorized (401).");
                console.warn(`[InfluencerClub:${requestId}] ${type} fetch failed (${response.status}): ${text.substring(0, 100)}`);
                return [];
            }

            const data = await response.json();
            const accounts = data.accounts || data.results || [];

            return accounts.map((p: any) => {
                const profile = p.profile || p || {};
                return {
                    creator_id: p.user_id || profile.username || profile.id,
                    handle: profile.username || p.user_id || profile.id,
                    platform: params.platform,
                    followers: profile.followers || profile.followers_count || p.followers || 0,
                    engagement_rate: profile.engagement_percent ? (profile.engagement_percent / 100) : (profile.engagement_rate || 0),
                    fullname: profile.full_name || profile.name || profile.username,
                    picture: profile.picture || profile.profile_pic_url || profile.avatar_url,
                    emails: profile.emails || p.emails || []
                };
            });
        } catch (e: any) {
            if (e.message.includes('401')) throw e;
            console.error(`[InfluencerClub:${requestId}] Error during ${type} fetch:`, e.message);
            return [];
        }
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
