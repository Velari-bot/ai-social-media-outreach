import { ModashDiscoveryResult, Platform } from '../types';
import { logApiCall } from './api-logger';

// These should be set as environment variables
const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY || '';
const INFLUENCER_CLUB_BASE_URL = 'https://api-dashboard.influencers.club';

interface InfluencerClubClientConfig {
    apiKey: string;
    baseUrl?: string;
}

/**
 * Influencer Club API Client
 * Refactored to strictly follow credit-safety rules.
 */
export class InfluencerClubClient {
    private apiKey: string;
    private baseUrl: string;

    constructor(config: InfluencerClubClientConfig) {
        this.apiKey = config.apiKey || INFLUENCER_CLUB_API_KEY || '';
        this.baseUrl = config.baseUrl || INFLUENCER_CLUB_BASE_URL;

        if (!this.apiKey && typeof window !== 'undefined') {
            console.warn('Influencer Club API key is not set');
        }
    }

    private ensureApiKey() {
        if (!this.apiKey) {
            throw new Error('Influencer Club API key is required.');
        }
    }

    /**
     * Parse location string to ISO country code (Simple implementation)
     */
    private getCountryCode(location: string): string | undefined {
        if (!location) return undefined;
        const lower = location.toLowerCase();
        if (lower === 'any' || lower === 'anywhere' || lower === 'world' || lower === 'worldwide') return undefined;

        if (lower.includes('united states') || lower.includes('usa') || lower.includes('us')) return 'US';
        if (lower.includes('united kingdom') || lower.includes('uk') || lower.includes('great britain')) return 'GB';
        if (lower.includes('canada')) return 'CA';
        if (lower.includes('australia')) return 'AU';
        if (lower.includes('germany')) return 'DE';
        if (lower.includes('france')) return 'FR';
        if (lower.includes('italy')) return 'IT';
        if (lower.includes('spain')) return 'ES';
        if (lower.includes('brazil')) return 'BR';
        if (lower.includes('india')) return 'IN';
        if (lower.includes('japan')) return 'JP';
        return undefined;
    }

    /**
     * Validate filters before API call
     */
    private validateFilters(filters: any) {
        // Strict Validation: Keywords OR Category required.
        const hasKeywords = filters.keywords &&
            (Array.isArray(filters.keywords) ? filters.keywords.length > 0 : filters.keywords.trim() !== '');

        const hasCategory = filters.category &&
            filters.category !== '' &&
            filters.category !== 'any';

        const hasTopics = filters.topics &&
            filters.topics !== 'any' &&
            filters.topics !== 'Any Topic' &&
            filters.topics !== '';

        const hasStrongTargeting = hasKeywords || hasCategory || hasTopics;

        if (!hasStrongTargeting) {
            throw new Error("Influencer Club discovery requires keywords or a category to return results.");
        }
    }

    /**
     * Search Creators with strict credit safety
     * Strategy: Fetch broadly (Targeting Only) -> Filter Locally (Numeric Stats)
     */
    async discoverCreators(params: {
        platform: Platform;
        filters: Record<string, any>;
        limit: number;
        offset?: number;
    }): Promise<ModashDiscoveryResult[]> {
        this.ensureApiKey();

        // Debug: Log raw input filters
        console.log("[InfluencerClub] Raw input filters:", JSON.stringify(params.filters, null, 2));

        this.validateFilters(params.filters);

        // 1. Prepare Filters Object
        const filters: any = {};

        // Category (Primary targeting method)
        // Check for category first, then fall back to topics
        let category = params.filters.category;
        if (!category && params.filters.topics && params.filters.topics !== 'any' && params.filters.topics !== 'Any Topic') {
            category = Array.isArray(params.filters.topics) ? params.filters.topics[0] : params.filters.topics;
        }
        if (!category && params.filters.categories && params.filters.categories.length > 0) {
            category = params.filters.categories[0];
        }

        if (!category && params.filters.niche && params.filters.niche !== 'any') {
            category = params.filters.niche;
        }

        if (category && category !== '' && category !== 'any') {
            filters.category = category;
            console.log(`[InfluencerClub] Using category filter: ${category}`);
        }

        // Keywords (Alternative targeting method) -> keywords_in_bio
        // Accept keywords from multiple possible field names
        const keywordInput = params.filters.keywords || params.filters.keyword;
        let keywords = keywordInput ? (Array.isArray(keywordInput) ? keywordInput : [keywordInput]) : [];

        // IMPROVEMENT: If niche is provided but not keywords, use niche as a keyword too
        // This helps when "niche" is something specific like "Yoga" that might be a category OR a keyword.
        if (params.filters.niche && params.filters.niche !== 'any' && keywords.length === 0) {
            keywords = [params.filters.niche];
            console.log(`[InfluencerClub] Using niche '${params.filters.niche}' as keyword filter.`);
        }

        const cleanedKeywords = keywords.filter((k: any) => k && k.trim() !== '');
        if (cleanedKeywords.length > 0) {
            filters.keywords_in_bio = cleanedKeywords;
            console.log(`[InfluencerClub] Using keywords filter: ${cleanedKeywords.join(', ')}`);
        }

        // Location (Optional) -> location array
        const locationInput = params.filters.location || params.filters.country || params.filters.geo_country;
        const countryCode = this.getCountryCode(locationInput);
        if (countryCode) {
            filters.location = [countryCode];
        }

        // --- ADDED: Pass numeric filters to API to avoid "fetch and filter out everything" ---
        const minFollowersVal = params.filters.minFollowers || params.filters.followersMin;
        if (minFollowersVal) {
            filters.followers_min = String(minFollowersVal);
            filters.min_followers = Number(minFollowersVal);
            filters.followers = { min: Number(minFollowersVal) };
        }

        const maxFollowersVal = params.filters.maxFollowers || params.filters.followersMax;
        if (maxFollowersVal) {
            filters.followers_max = String(maxFollowersVal);
            filters.max_followers = Number(maxFollowersVal);
        }
        // ----------------------------------------------------------------------------------

        // 2. Prepare Payload (Official Structure)
        const body = {
            platform: params.platform.toLowerCase(),
            paging: {
                limit: params.limit || 50,
                page: params.offset ? Math.floor(params.offset / (params.limit || 50)) : 0
            },
            sort: {
                sort_by: "relevancy",
                sort_order: "desc"
            },
            filters: filters
        };

        // 3. Log Request
        console.log("[InfluencerClub] Official API Query:", JSON.stringify(body, null, 2));
        await logApiCall({
            api_provider: 'influencer_club' as any,
            api_action: 'discovery',
            reason: `Searching for ${params.limit} creators on ${params.platform}`,
        });

        try {
            const url = `${this.baseUrl}/public/v1/discovery/`;
            const authHeader = this.apiKey.startsWith('Bearer ') ? this.apiKey : `Bearer ${this.apiKey}`;

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": authHeader, // Per docs: Authorization: Bearer ...
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Influencer Club API error: ${text}`);
            }

            const data = await response.json();

            // Response Structure: { total, limit, credits_left, accounts: [...] }
            const accounts = data.accounts || [];

            if (accounts.length > 0 && accounts[0].profile) {
                const sp = accounts[0].profile;
                console.log(`[InfluencerClub] Debug Sample: ${sp.username} - followers: ${sp.followers}, ER: ${sp.engagement_percent}%`);
            }

            if (data.credits_left) {
                console.log(`[InfluencerClub] Credits Remaining: ${data.credits_left}`);
            }
            console.log(`[InfluencerClub] Raw Return: ${accounts.length} / Total Matches: ${data.total}`);

            // 4. Normalization & Local Filtering (Post-Fetch Strategy)
            const normalizedCreators = accounts.map((p: any) => {
                const profile = p.profile || {};
                return {
                    creator_id: p.user_id || profile.username,
                    handle: profile.username || p.user_id, // fallback
                    platform: params.platform,
                    followers: profile.followers || profile.followers_count || p.followers || 0,
                    engagement_rate: profile.engagement_percent ? (profile.engagement_percent / 100) : (profile.engagement_rate || p.engagement_rate || 0),
                    fullname: profile.full_name || profile.name || profile.fullname || profile.username,
                    picture: profile.picture || profile.profile_pic_url || profile.avatar_url,
                    emails: profile.emails || p.emails || []
                };
            });

            // Local Numeric Filtering
            const minFollowers = Number(params.filters.minFollowers || params.filters.followersMin || 1000);
            const maxFollowers = params.filters.maxFollowers || params.filters.followersMax ? Number(params.filters.maxFollowers || params.filters.followersMax) : undefined;
            const minEngagement = params.filters.minEngagementRate || params.filters.engagementRateMin ? Number(params.filters.minEngagementRate || params.filters.engagementRateMin) : undefined;

            console.log(`[InfluencerClub] Filtering locally: minFollowers=${minFollowers}, minEngagement=${minEngagement}%`);

            // Debug: Log first 3 creators before filtering
            if (normalizedCreators.length > 0) {
                console.log(`[InfluencerClub] Sample creators BEFORE filtering:`);
                normalizedCreators.slice(0, 3).forEach((c: any, i: number) => {
                    console.log(`  ${i + 1}. ${c.handle} - Followers: ${c.followers}, ER: ${(c.engagement_rate * 100).toFixed(2)}%`);
                });
            }

            const filteredCreators = normalizedCreators.filter((c: any) => {
                const followers = c.followers || 0;
                const er = c.engagement_rate || 0;

                // Debug logging for first 3 creators
                const debugIndex = normalizedCreators.indexOf(c);
                const shouldDebug = debugIndex < 3;

                // Leniency: If followers is 0, it often means 'missing data' in the API.
                // We allow these through so the user doesn't get 0 results.
                if (minFollowers && followers > 0 && followers < minFollowers) {
                    if (shouldDebug) console.log(`  ❌ ${c.handle}: Followers ${followers} < ${minFollowers}`);
                    return false;
                }
                if (maxFollowers && followers > maxFollowers) {
                    if (shouldDebug) console.log(`  ❌ ${c.handle}: Followers ${followers} > ${maxFollowers}`);
                    return false;
                }

                if (minEngagement) {
                    // Logic: If user enters '1', they mean 0.01 (1%). 
                    // If they enter '0.01', they also mean 0.01 (1%).
                    const threshold = minEngagement >= 1 ? minEngagement / 100 : minEngagement;

                    if (shouldDebug) {
                        console.log(`  🔍 ${c.handle}: ER=${(er * 100).toFixed(2)}% (${er}), threshold=${(threshold * 100).toFixed(2)}% (${threshold}), minEngagement=${minEngagement}`);
                    }

                    // Leniency: If engagement is 0, it often means 'missing data' in the API.
                    // We allow these through so the user doesn't get 0 results.
                    if (er > 0 && er < threshold) {
                        if (shouldDebug) console.log(`  ❌ ${c.handle}: ER ${(er * 100).toFixed(2)}% < ${(threshold * 100).toFixed(2)}%`);
                        return false;
                    }
                }

                if (shouldDebug) console.log(`  ✅ ${c.handle}: PASSED all filters`);
                return true;
            });

            console.log(`[InfluencerClub] Post-Filter Return: ${filteredCreators.length} (from ${accounts.length})`);

            return filteredCreators;

        } catch (error) {
            console.error('Influencer Club discovery error:', error);
            throw error;
        }
    }

    // Helper for direct request if needed, but discoverCreators is primary
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        return {} as T;
    }
}

// Export singleton instance (lazy initialization)
let _influencerClubClient: InfluencerClubClient | null = null;
export const influencerClubClient = (() => {
    if (!_influencerClubClient) {
        _influencerClubClient = new InfluencerClubClient({
            apiKey: INFLUENCER_CLUB_API_KEY,
        });
    }
    return _influencerClubClient;
})();
