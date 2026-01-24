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
        const { platform: rawPlatform, filters: rawFilters, limit, offset = 0 } = params;
        const platform = rawPlatform.toLowerCase();

        const { niche: cleanNiche, category: cleanCategory } = this.parseTopics(rawFilters.niche || "");
        const minFollowers = Number(rawFilters.min_followers || rawFilters.minFollowers || 1000);
        const maxFollowers = Number(rawFilters.max_followers || rawFilters.maxFollowers || 1000000);
        const minAvgViews = Number(rawFilters.min_avg_views || 0);

        const page = Math.floor(offset / limit);

        const locationFilter = rawFilters.location || rawFilters.country || null;

        // --- STAGE 1: Strict niche + category search ---
        console.log(`[InfluencerClub:${requestId}] Stage 1: Strict Search for "${cleanNiche}"`);
        let body = this.buildPayload(platform, page, limit, minFollowers, maxFollowers, cleanNiche, cleanCategory, locationFilter, minAvgViews);
        let accounts = await this.executeRequest(body, requestId);

        // --- STAGE 2: Keyword-only fallback (if no results or API error) ---
        if (accounts.length === 0 && cleanNiche) {
            console.log(`[InfluencerClub:${requestId}] Stage 2: Relaxing to keyword-only search...`);
            body = this.buildPayload(platform, page, limit, minFollowers, maxFollowers, cleanNiche, undefined, locationFilter, minAvgViews);
            accounts = await this.executeRequest(body, requestId);
        }

        // --- STAGE 3: Broad fallback (Relax followers) ---
        if (accounts.length === 0) {
            console.log(`[InfluencerClub:${requestId}] Stage 3: Relaxing follower counts...`);
            body = this.buildPayload(platform, page, limit, 0, 10000000, cleanNiche, undefined, locationFilter, minAvgViews);
            accounts = await this.executeRequest(body, requestId);
        }

        // --- STAGE 4: Relax Avg Views (Metadata is often missing, so we relax this and verify later) ---
        if (accounts.length === 0 && minAvgViews > 0) {
            console.log(`[InfluencerClub:${requestId}] Stage 4: Relaxing View Count filter (Metadata fallback)...`);
            body = this.buildPayload(platform, page, limit, minFollowers, maxFollowers, cleanNiche, cleanCategory, locationFilter, 0);
            accounts = await this.executeRequest(body, requestId);
        }

        // --- STAGE 5: Relax Location (Location data can be sparse) ---
        if (accounts.length === 0 && locationFilter) {
            console.log(`[InfluencerClub:${requestId}] Stage 5: Relaxing Location filter...`);
            body = this.buildPayload(platform, page, limit, minFollowers, maxFollowers, cleanNiche, cleanCategory, null, minAvgViews);
            accounts = await this.executeRequest(body, requestId);
        }

        // --- STAGE 6: Relax Both Views & Location ---
        if (accounts.length === 0) {
            console.log(`[InfluencerClub:${requestId}] Stage 6: Relaxing Both Views & Location...`);
            body = this.buildPayload(platform, page, limit, minFollowers, maxFollowers, cleanNiche, cleanCategory, null, 0);
            accounts = await this.executeRequest(body, requestId);
        }

        // --- STAGE 7: Ultimate Fallback (Broad Followers + No Location + No Views) ---
        if (accounts.length === 0) {
            console.log(`[InfluencerClub:${requestId}] Stage 7: Ultimate Fallback (Broad search)...`);
            body = this.buildPayload(platform, page, limit, 0, 10000000, cleanNiche, undefined, null, 0);
            accounts = await this.executeRequest(body, requestId);
        }

        if (accounts.length === 0) {
            console.log(`[InfluencerClub:${requestId}] All stages failed to find creators for: "${cleanNiche}"`);
            return [];
        }

        console.log(`[InfluencerClub:${requestId}] Success! Found ${accounts.length} candidates.`);

        // Map Results
        let mapped = this.mapResults(accounts, params.platform);

        // Post-filtering for views removed. 
        // We rely on the API's 'min_avg_views' filter where supported, 
        // and the rigorous implementation in DiscoveryPipeline to verify actual view counts.

        return mapped;
    }

    private buildPayload(
        platform: string,
        page: number,
        limit: number,
        minFollowers: number,
        maxFollowers: number,
        niche: string | undefined,
        category: string | undefined,
        location: string | string[] | null,
        minAvgViews: number
    ) {
        const body: any = {
            platform,
            paging: { limit, page },
            filters: {
                min_followers: minFollowers,
                max_followers: maxFollowers
            }
        };

        if (location) {
            body.filters.location = Array.isArray(location) ? location : [location];
        }

        // Only add min_avg_views if it's > 0 (IC API support varies)
        if (minAvgViews > 0) {
            body.filters.min_avg_views = minAvgViews;
        }

        if (niche && niche.trim().length > 0) {
            if (platform === 'instagram' || platform === 'tiktok') {
                body.filters.keywords_in_bio = [niche.toLowerCase()];
            } else if (platform === 'youtube') {
                // youtube logic: Topics must be sub-topics (e.g. "Fashion"), NOT categories (e.g. "Lifestyle").
                // Top-Level topics cause 400 errors.
                const INVALID_YT_TOPICS = new Set([
                    "Gaming", "Lifestyle", "Entertainment", "Sports", "Society", "Music",
                    "Fashion & Beauty", "Travel & Tourism", "Food & Drink", "Fitness & Health",
                    "Business & Finance", "Technology", "Family & Parenting", "Art & Design",
                    "Pets & Animals", "Automotive", "Home & Garden", "Tech", "Beauty", "Travel"
                ]);

                // 1. Try to find a valid topic source
                // 'niche' is usually the sub-topic (e.g. "Fashion"). 'category' is usually the main topic (e.g. "Lifestyle").
                // So we prefer 'niche' for the Topic filter.
                let validTopic: string | null = null;

                if (niche && !INVALID_YT_TOPICS.has(niche)) {
                    validTopic = niche;
                } else if (category && !INVALID_YT_TOPICS.has(category)) {
                    validTopic = category;
                }

                // 2. Apply Topic Filter if valid
                if (validTopic) {
                    body.filters.topics = [validTopic];
                }

                // 3. Always apply Keyword Filter as fallback/reinforcement
                // This ensures broad searches (like "Gaming") still work via keywords even if topic is invalid.
                body.filters.keywords = [niche];
            }
        }

        return body;
    }

    private async executeRequest(body: any, requestId: string): Promise<any[]> {
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
                // 400 errors are common if filters are invalid, we treat them as 0 results to trigger fallback
                console.warn(`[InfluencerClub:${requestId}] API Warning (${response.status}): ${text.substring(0, 100)}`);
                return [];
            }

            const data = await response.json();
            return data.accounts || data.results || data.data || [];
        } catch (error: any) {
            console.error(`[InfluencerClub:${requestId}] Fetch Error:`, error.message);
            return [];
        }
    }

    private mapResults(accounts: any[], platform: string): ModashDiscoveryResult[] {
        return accounts.map((p: any) => {
            const profile = p.profile || p;

            // Fix for YouTube ID mapping: Prioritize 'profile.id' if it looks like a Channel ID (UC...)
            // The API often returns internal 'user_id' (e.g. uc_12345) which fails verification.
            let correctId = p.user_id || profile.username || profile.id;

            if (platform === 'youtube' && profile.id && String(profile.id).startsWith('UC')) {
                correctId = profile.id;
            }

            return {
                creator_id: String(correctId || Math.random().toString(36).substring(7)),
                handle: String(profile.username || p.user_id || profile.id || "unknown"),
                platform: platform,
                followers: Number(profile.followers || profile.followers_count || p.followers || 0),
                engagement_rate: profile.engagement_percent ? (profile.engagement_percent / 100) : (profile.engagement_rate || 0),
                fullname: profile.full_name || profile.name || profile.username || "Creator",
                picture: profile.picture || profile.profile_pic_url || profile.avatar_url,
                emails: profile.emails || p.emails || [],
                avg_views: Number(profile.avg_views || profile.average_views || p.avg_views || p.average_views || 0)
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
