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

        // New Filters
        const locationFilter = params.filters.location || params.filters.country || null;
        const minAvgViews = Number(params.filters.min_avg_views || 0);

        // Build base payload
        const body: any = {
            platform: params.platform.toLowerCase(),
            limit: params.limit || 50,
            offset: params.offset || 0,
            filters: {
                min_followers: minFollowers,
                max_followers: maxFollowers
            }
        };

        // Add location if present (Attempting multiple keys to increase hit rate)
        if (locationFilter) {
            body.filters.location = locationFilter;
        }

        // Add platform-specific filters
        const platform = params.platform.toLowerCase();

        if (cleanNiche && cleanNiche.trim().length > 0) {
            if (platform === 'instagram' || platform === 'tiktok') {
                body.filters.keywords_in_bio = cleanNiche.toLowerCase();
            } else if (platform === 'youtube') {
                body.filters.topics = [cleanNiche];
            }
        } else {
            console.log(`[InfluencerClub:${requestId}] Broad Search (No Niche) - expecting higher volume.`);
        }

        console.log(`[InfluencerClub:${requestId}] ${platform.toUpperCase()} - Targeting: "${cleanNiche}" | Loc: ${locationFilter} | Views: ${minAvgViews}+`);

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
                console.log(`[InfluencerClub:${requestId}] Raw API returned ${accounts.length} candidates.`);
            } else {
                console.log(`[InfluencerClub:${requestId}] No results found for niche: "${cleanNiche}"`);
            }

            // Map Results
            let mapped = this.mapResults(accounts, params.platform);

            // --- CLIENT-SIDE POST-FILTERING ---
            // Because standardizing location filters is hard, we enforce it here if provided.

            /* 
            // CLIENT-SIDE LOCATION FILTERING REMOVED 
            // Relying on API to handle location filtering to avoid dropping valid results (e.g. "New York" vs "United States")
            if (locationFilter) {
                const targetLoc = locationFilter.toLowerCase();
                const beforeCount = mapped.length;
                mapped = mapped.filter(c => {
                    const cLoc = (c.location || "").toLowerCase();
                    // Loose matching: "United States" matches "US", "USA", "United States", "New York, US"
                    if (!cLoc) return false; // Strict: if they have no location, drop them? Or keep? Let's drop.
                    return cLoc.includes(targetLoc) ||
                        (targetLoc === 'united states' && (cLoc === 'us' || cLoc === 'usa')) ||
                        (targetLoc === 'united kingdom' && (cLoc === 'uk' || cLoc === 'gb'));
                });
                console.log(`[InfluencerClub:${requestId}] Location Filter ("${locationFilter}"): ${beforeCount} -> ${mapped.length}`);
            }
            */

            if (minAvgViews > 0) {
                const beforeCount = mapped.length;
                mapped = mapped.filter(c => {
                    // Estimate views = followers * engagement
                    // Or just pass if we don't have enough data
                    if (!c.followers || !c.engagement_rate) return true; // Give benefit of doubt
                    const estViews = c.followers * c.engagement_rate;
                    return estViews >= minAvgViews;
                });
                console.log(`[InfluencerClub:${requestId}] Avg Views Filter (${minAvgViews}+): ${beforeCount} -> ${mapped.length}`);
            }

            return mapped;

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
