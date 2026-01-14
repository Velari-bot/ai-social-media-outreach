import { ModashDiscoveryResult, Platform } from '../types';

const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY || '';
const DEFAULT_IC_BASE_URL = 'https://api-dashboard.influencers.club';

/**
 * Influencer Club API Client
 * Optimized for Niche and Follower strictness.
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

        // Build platform-specific payload based on Influencer Club's documentation
        // Instagram: uses "niche" filter
        // YouTube: uses "topics" filter
        // TikTok: uses "keywords_in_bio" filter
        const body: any = {
            platform: params.platform.toLowerCase(),
            limit: params.limit || 50,
            offset: params.offset || 0,
            filters: {
                min_followers: minFollowers,
                max_followers: maxFollowers
            }
        };

        // Add platform-specific niche filter
        const platform = params.platform.toLowerCase();
        if (platform === 'instagram' || platform === 'tiktok') {
            // Instagram & TikTok: Use "keywords_in_bio" filter (most reliable)
            body.filters.keywords_in_bio = cleanNiche.toLowerCase();
        } else if (platform === 'youtube') {
            // YouTube: Use "topics" filter
            body.filters.topics = [cleanNiche];
        }

        console.log(`[InfluencerClub:${requestId}] ${platform.toUpperCase()} - Targeting: "${cleanNiche}" | Followers: ${minFollowers}-${maxFollowers}`);

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
                console.error(`[InfluencerClub:${requestId}] Discovery API Failed (${response.status}): ${text.substring(0, 100)}`);
                return [];
            }

            const data = await response.json();
            const accounts = data.accounts || data.results || data.data || [];

            if (accounts.length > 0) {
                const first = accounts[0].profile || accounts[0];
                const handle = first.username || first.handle;
                const followers = first.followers || first.followers_count;
                console.log(`[InfluencerClub:${requestId}] Success! Got ${accounts.length} results. First: @${handle} (${followers} followers)`);
            } else {
                console.log(`[InfluencerClub:${requestId}] No results found for niche: "${cleanNiche}"`);
            }

            return this.mapResults(accounts, params.platform);

        } catch (error: any) {
            console.error(`[InfluencerClub:${requestId}] Discovery Error:`, error.message);
            return [];
        }
    }

    private mapResults(accounts: any[], platform: string): ModashDiscoveryResult[] {
        return accounts.map((p: any) => {
            const profile = p.profile || p;
            return {
                creator_id: String(p.user_id || profile.username || profile.id || Math.random().toString(36).substring(7)),
                handle: String(profile.username || p.user_id || profile.id || "unknown"),
                platform: platform,
                followers: Number(profile.followers || profile.followers_count || p.followers || 0),
                engagement_rate: profile.engagement_percent ? (profile.engagement_percent / 100) : (profile.engagement_rate || 0),
                fullname: profile.full_name || profile.name || profile.username || "Creator",
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
