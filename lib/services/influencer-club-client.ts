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

/**
 * Influencer Club API Client
 * Optimized for maximum compatibility and transparent error reporting.
 */
export class InfluencerClubClient {
    private apiKey: string;
    private baseUrl: string;

    constructor(config: InfluencerClubClientConfig) {
        this.apiKey = (config.apiKey || INFLUENCER_CLUB_API_KEY || '').trim();
        this.baseUrl = (config.baseUrl || INFLUENCER_CLUB_BASE_URL).replace(/\/$/, '');
    }

    private ensureApiKey() {
        if (!this.apiKey) {
            throw new Error('Influencer Club API Key is missing. Please set INFLUENCER_CLUB_API_KEY in your environment.');
        }
    }

    private getAuthHeader() {
        // Remove existing Bearer prefix if user accidentally included it in the env var
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
        this.ensureApiKey();
        const requestId = Math.random().toString(36).substring(7);
        const f = params.filters;
        const { niche: cleanNiche } = this.parseNiche(f.niche || "");

        // 1. ATTEMPT A: The "Production Style" Flat Payload (Matches User Example)
        // Try the base /discover endpoint first if supported
        const flatBody = {
            platform: params.platform.toLowerCase(),
            niche: cleanNiche || f.niche,
            minFollowers: Number(f.min_followers || f.minFollowers || f.followersMin || 1000),
            maxFollowers: Number(f.max_followers || f.maxFollowers || f.followersMax || 1000000),
            limit: params.limit || 50,
            offset: params.offset || 0
        };

        console.log(`[InfluencerClub:${requestId}] Attempting Discovery...`);
        console.log(`[InfluencerClub:${requestId}] Payload:`, JSON.stringify(flatBody));

        try {
            // We prioritize the endpoint structure that matches the user's latest snippet
            const results = await this.tryFetch(`${this.baseUrl}/public/v1/discovery/`, flatBody, requestId);
            if (results && results.length > 0) return results;

            // 2. ATTEMPT B: The Nested Schema (Fallback for legacy or platform-specific support)
            console.log(`[InfluencerClub:${requestId}] Attempt A returned 0. Trying Nested Schema...`);
            const nestedBody = {
                platform: params.platform.toLowerCase(),
                paging: { limit: params.limit, offset: params.offset },
                filters: {
                    min_followers: flatBody.minFollowers,
                    niche: flatBody.niche,
                    keyword: flatBody.niche
                }
            };
            const nestedResults = await this.tryFetch(`${this.baseUrl}/public/v1/discovery/`, nestedBody, requestId);
            return nestedResults || [];

        } catch (error: any) {
            console.error(`[InfluencerClub:${requestId}] Client Error:`, error.message);
            throw error; // Propagate to API route
        }
    }

    private async tryFetch(url: string, body: any, requestId: string): Promise<ModashDiscoveryResult[]> {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": this.getAuthHeader(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`[InfluencerClub:${requestId}] API Failure (${response.status}): ${text}`);

            // Critical: If it's a 401, we MUST stop and tell the user.
            if (response.status === 401) {
                throw new Error("Influencer Club API Key is unauthorized (401). Please check your credentials in the dashboard.");
            }
            return [];
        }

        const data = await response.json();
        const accounts = data.accounts || data.results || data.data || [];

        return accounts.map((p: any) => {
            const profile = p.profile || p;
            return {
                creator_id: p.user_id || profile.username || profile.id,
                handle: profile.username || p.user_id || profile.id,
                platform: profile.platform || p.platform || 'instagram',
                followers: profile.followers || profile.followers_count || p.followers || 0,
                engagement_rate: profile.engagement_percent ? (profile.engagement_percent / 100) : (profile.engagement_rate || 0),
                fullname: profile.full_name || profile.name || profile.username,
                picture: profile.picture || profile.profile_pic_url || profile.avatar_url,
                emails: profile.emails || p.emails || []
            };
        });
    }
}

// Singleton
let _influencerClubClient: InfluencerClubClient | null = null;
export const influencerClubClient = (() => {
    if (!_influencerClubClient) {
        _influencerClubClient = new InfluencerClubClient({
            apiKey: INFLUENCER_CLUB_API_KEY,
        });
    }
    return _influencerClubClient;
})();
