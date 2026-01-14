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

        // Use user-provided keywords if available, otherwise fallback to niche name
        const userKeywords = params.filters.keywords || "";
        const searchKeyword = userKeywords.trim() || cleanNiche;

        const minFollowers = Number(params.filters.min_followers || params.filters.minFollowers || 1000);
        const maxFollowers = Number(params.filters.max_followers || params.filters.maxFollowers || 1000000);

        // Attempt 1: The "Strict V1 Search" Payload
        // This uses the nested filters object with singular keyword and category.
        const bodyV1: any = {
            platform: params.platform.toLowerCase(),
            paging: {
                limit: params.limit || 50,
                offset: params.offset || 0
            },
            search: searchKeyword, // Root level search
            filters: {
                platform: params.platform.toLowerCase(),
                category: cleanCategory,
                keyword: searchKeyword, // Singular!
                number_of_followers: {
                    min: minFollowers,
                    max: maxFollowers
                },
                min_followers: minFollowers,
                max_followers: maxFollowers
            },
            sort_by: "relevancy",
            sort_order: "desc"
        };

        // Attempt 2: The "Flat Compatibility" Payload
        // This includes root-level niche and camelCase followers which often fixes "ignoring filters" issues.
        const bodyFlat: any = {
            platform: params.platform.toLowerCase(),
            niche: searchKeyword,
            category: cleanCategory,
            search: searchKeyword,
            minFollowers: minFollowers,
            maxFollowers: maxFollowers,
            limit: params.limit || 50,
            offset: params.offset || 0,
            // Re-include the nested filters just in case
            filters: bodyV1.filters
        };

        console.log(`[InfluencerClub:${requestId}] Targeting: "${searchKeyword}" (${cleanCategory}) | Followers: ${minFollowers}-${maxFollowers}`);

        try {
            // We prioritize the Dashboard V1 endpoint as it's been more responsive
            const response = await fetch(`${this.baseUrl}/public/v1/discovery/`, {
                method: "POST",
                headers: {
                    "Authorization": this.getAuthHeader(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(bodyFlat) // Sending the "Ultra-Flat" body first
            });

            if (!response.ok) {
                const text = await response.text();
                console.error(`[InfluencerClub:${requestId}] Discovery API Failed (${response.status}): ${text.substring(0, 100)}`);
                return [];
            }

            const data = await response.json();
            const accounts = data.accounts || data.results || data.data || [];

            // If we got 0 or very few results, maybe the niche was too strict?
            // BUT if we got lots of WRONG results (like user reported), it means the niche was ignored.

            // To prevent "Ignored Niche", we monitor the first result
            if (accounts.length > 0) {
                const first = accounts[0].profile || accounts[0];
                const handle = first.username || first.handle;
                const followers = first.followers || first.followers_count;
                console.log(`[InfluencerClub:${requestId}] Success! Got ${accounts.length} results. First: @${handle} (${followers} followers)`);
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
