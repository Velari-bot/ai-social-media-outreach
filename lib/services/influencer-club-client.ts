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
        this.apiKey = (config.apiKey || INFLUENCER_CLUB_API_KEY || '').trim();
        this.baseUrl = (config.baseUrl || INFLUENCER_CLUB_BASE_URL).replace(/\/$/, '');
    }

    private ensureApiKey() {
        if (!this.apiKey) {
            throw new Error('Influencer Club API Key is missing.');
        }
    }

    private getAuthHeader() {
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
        const { niche: cleanNiche, category: cleanCategory } = this.parseNiche(f.niche || "");

        // 1. PRIMARY ATTEMPT: "Standard V1" Payload (Snake_case + Nested Filters)
        // This structure is the most likely to be respected by the official discovery endpoint.
        const body: any = {
            platform: params.platform.toLowerCase(),
            limit: params.limit || 50,
            offset: params.offset || 0,
            min_followers: Number(f.min_followers || f.minFollowers || f.followersMin || 1000),
            max_followers: Number(f.max_followers || f.maxFollowers || f.followersMax || 1000000),
            sort_by: "relevancy",
            sort_order: "desc",
            filters: {
                category: f.category || cleanCategory,
                keyword: cleanNiche || f.keyword || f.niche,
                keywords: [cleanNiche || f.keyword || f.niche].filter(Boolean)
            }
        };

        // Redundant top-level fields for some API versions
        body.minFollowers = body.min_followers;
        body.maxFollowers = body.max_followers;

        console.log(`[InfluencerClub:${requestId}] Discovery Request:`, JSON.stringify(body));

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
                console.error(`[InfluencerClub:${requestId}] API Failure (${response.status}): ${text}`);
                if (response.status === 401) {
                    throw new Error("Influencer Club API Key is unauthorized (401).");
                }
                return [];
            }

            const data = await response.json();
            const accounts = data.accounts || data.results || data.data || [];

            console.log(`[InfluencerClub:${requestId}] API returned ${accounts.length} creators. Total matches reported: ${data.total || 'unknown'}`);

            return accounts.map((p: any) => {
                const profile = p.profile || p;
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

        } catch (error: any) {
            console.error(`[InfluencerClub:${requestId}] Client Error:`, error.message);
            throw error;
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
