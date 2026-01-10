import { db } from '../firebase-admin';
import { Creator, CreatorSearchFilters, DiscoveryPipelineResponse, Platform } from '../types';
import { influencerClubClient } from './influencer-club-client';
import { clayClient } from './clay-client';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Discovery Pipeline Service
 * Implements the hybrid discovery + enrichment logic
 */
export class DiscoveryPipeline {

    /**
     * Main entry point for the discovery pipeline
     */
    async discover(params: {
        userId: string;
        filters: CreatorSearchFilters;
        requestedCount: number;
        platform: Platform;
        skipEnrichment?: boolean;
    }): Promise<DiscoveryPipelineResponse> {
        const { userId, filters, requestedCount, platform, skipEnrichment } = params;

        // 1. Query Internal Database first
        let internalCreators = await this.queryInternalDb(platform, filters, requestedCount);
        console.log(`[Discovery] Internal DB found ${internalCreators.length} potential matches`);

        // Post-filter internal results in memory for location/topic strictness
        internalCreators = internalCreators.filter(c => {
            // Filter by Location if specified
            if (filters.location && filters.location !== 'any') {
                const cLoc = (c.basic_profile_data?.location || c.basic_profile_data?.geo_country || c.location || '').toLowerCase();
                // Leniency: If location is missing, we let it pass through to avoid 0 results
                if (cLoc && !cLoc.includes(filters.location.toLowerCase())) return false;
            }
            // Filter by Topic if specified (basic check)
            if (filters.topics && filters.topics !== 'any' && c.basic_profile_data?.category) {
                // thorough topic check could be complex, simple string match for now
                // or skip if overly restrictive
            }
            return true;
        });
        console.log(`[Discovery] Internal DB filtered to ${internalCreators.length} matches`);

        let foundCount = internalCreators.length;

        let externalFetches = 0;
        let creditsConsumed = 0;
        let finalCreators: Creator[] = [...internalCreators];

        // 2. Fallback to Influencers.club if needed
        if (foundCount < requestedCount) {
            console.log(`[Discovery] Need ${requestedCount - foundCount} more creators. calling external API...`);
            try {
                const remaining = requestedCount - foundCount;
                // API has a hard limit of 50 per request
                const fetchLimit = Math.min(remaining, 50);

                const externalResults = await influencerClubClient.discoverCreators({
                    platform,
                    filters,
                    limit: fetchLimit,
                });

                console.log(`[Discovery] External API returned ${externalResults.length} creators`);

                externalFetches = externalResults.length;

                // Cost Calculation (Influencer Club charges 1 credit per batch of 50)
                // If we fetched 0, we still paid 1 credit for the attempt.
                // If we fetched 1-50, we paid 1 credit.
                // If we fetched 51-100, we paid 2 credits.
                const batches = Math.ceil(externalFetches / 50);
                creditsConsumed = batches > 0 ? batches : 1;

                // 3. Deduplication Logic
                const newCreators = await this.processExternalResults(externalResults, internalCreators, platform);
                console.log(`[Discovery] New unique creators to save: ${newCreators.length}`);

                // 4. database Insert (status = 'pending')
                const savedCreators = await this.bulkSaveCreators(newCreators);
                console.log(`[Discovery] Saved ${savedCreators.length} creators to DB`);

                // 5. Clay Enrichment Pipeline
                // Only enrich the NEW creators we just found
                if (!skipEnrichment) {
                    const enrichedCreators = await this.bulkEnrichWithClay(savedCreators, userId);
                    finalCreators = [...finalCreators, ...enrichedCreators];
                } else {
                    finalCreators = [...finalCreators, ...savedCreators];
                }
            } catch (externalError: any) {
                console.error('[DiscoveryPipeline] External discovery failed:', externalError.message);
                // Don't throw - return what we have from internal DB
                // Optionally mark the request as partially failed/limited
            }
        }

        // 6. Response to User (exactly N)
        return {
            creators: finalCreators.slice(0, requestedCount),
            meta: {
                total_requested: requestedCount,
                internal_hits: internalCreators.length,
                external_fetches: externalFetches,
                credits_consumed: creditsConsumed
            }
        };
    }

    /**
     * Query Firestore for existing creators matching filters
     */
    private async queryInternalDb(
        platform: Platform,
        filters: CreatorSearchFilters,
        limit: number
    ): Promise<Creator[]> {
        let query = db.collection('creators')
            .where('platform', '==', platform);

        // Note: We only filter by platform and min followers at DB level
        // Detailed filtering (Location, Niche) happens in memory in discover()
        // This is to avoid missing potential matches due to schema variations
        // and excessive composite index requirements.

        if (filters.minFollowers) {
            query = query.where('basic_profile_data.followers', '>=', filters.minFollowers);
        }

        const snapshot = await query.limit(limit * 5).get(); // Over-fetch to allow for in-memory filtering
        return snapshot.docs.map(doc => this.docToCreator(doc));
    }

    /**
     * Deduplicate external results against internal DB and current session
     */
    private async processExternalResults(
        externalResults: any[],
        internalCreators: Creator[],
        platform: Platform
    ): Promise<any[]> {
        const internalHandles = new Set(internalCreators.map(c => c.handle.toLowerCase()));
        const uniqueNewCreators: any[] = [];
        const seenHandlesInSession = new Set<string>();

        for (const item of externalResults) {
            const handle = (item.handle || item.username || '').toLowerCase();
            if (!handle) continue;

            // Deduplicate against internal DB and current session
            if (!internalHandles.has(handle) && !seenHandlesInSession.has(handle)) {
                seenHandlesInSession.add(handle);
                uniqueNewCreators.push(item);
            }
        }

        return uniqueNewCreators;
    }

    /**
     * Save creators to database with status 'pending'
     */
    private async bulkSaveCreators(creators: any[]): Promise<Creator[]> {
        const saved: Creator[] = [];
        const now = Timestamp.now();

        for (const item of creators) {
            const creatorData: Omit<Creator, 'id' | 'created_at' | 'updated_at'> = {
                platform: item.platform,
                handle: item.handle,
                modash_creator_id: item.creator_id || item.id || null,
                name: item.fullname || item.full_name || item.name,
                full_name: item.fullname || item.full_name || item.name,
                followers: item.followers,
                engagement_rate: item.engagement_rate,
                picture: item.picture || item.profile_pic_url,
                location: item.location || item.country || item.geo_country || null,
                has_basic_profile: true,
                has_detailed_profile: false,
                enrichment_status: 'pending' as const,
                source: 'influencers_club',
                basic_profile_data: item,
                email_found: item.emails && item.emails.length > 0,
                email: item.emails && item.emails.length > 0 ? item.emails[0] : null,
                clay_enriched_at: null,
                detailed_profile_fetched_at: null,
                detailed_profile_data: null
            };

            const docRef = await db.collection('creators').add({
                ...creatorData,
                created_at: now,
                updated_at: now,
            });
            const doc = await docRef.get();
            saved.push(this.docToCreator(doc));
        }

        return saved;
    }

    /**
     * Enrich batch of creators with Clay
     */
    private async bulkEnrichWithClay(creators: Creator[], userId: string): Promise<Creator[]> {
        const enriched: Creator[] = [];

        // Use Promise.all for parallel enrichment, but keep it robust
        const enrichmentPromises = creators.map(async (creator) => {
            try {
                // Update status to processing
                await db.collection('creators').doc(String(creator.id)).update({
                    enrichment_status: 'processing',
                    updated_at: Timestamp.now()
                });

                const clayResult = await clayClient.enrichCreator({
                    handle: creator.handle,
                    platform: creator.platform,
                    userId: userId
                });

                const updateData: Partial<Creator> = {
                    email: clayResult.email || null,
                    email_found: !!clayResult.email,
                    phone: clayResult.phone || null,
                    bio: clayResult.bio || null,
                    website: clayResult.website || null,
                    enrichment_status: 'enriched',
                    clay_enriched_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                // If Clay provides cross-platform profiles, we could store them too

                await db.collection('creators').doc(String(creator.id)).update(updateData as any);

                return { ...creator, ...updateData };
            } catch (error) {
                console.error(`Clay enrichment failed for ${creator.handle}:`, error);

                // Fail gracefully: update status but return the discovery data
                await db.collection('creators').doc(String(creator.id)).update({
                    enrichment_status: 'failed' as const,
                    updated_at: Timestamp.now()
                });

                return { ...creator, enrichment_status: 'failed' as const };
            }
        });

        return Promise.all(enrichmentPromises);
    }

    /**
     * Helper to convert Firestore doc to Creator type
     */
    private docToCreator(doc: any): Creator {
        const data = doc.data();
        const basic = data.basic_profile_data || {};
        const profile = basic.profile || {};

        return {
            id: doc.id,
            ...data,
            // Fallbacks for display fields (Legacy/Cache support)
            name: data.name || basic.fullname || basic.full_name || profile.full_name || data.handle,
            followers: data.followers || basic.followers || profile.followers || 0,
            engagement_rate: data.engagement_rate || basic.engagement_rate || (profile.engagement_percent ? profile.engagement_percent / 100 : 0),
            picture: data.picture || basic.picture || basic.profile_pic_url || profile.picture,
            location: data.location || basic.location || basic.country || basic.geo_country,
            email: data.email || basic.email || (basic.emails && basic.emails[0]) || null,

            created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
            updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
        } as Creator;
    }
}

export const discoveryPipeline = new DiscoveryPipeline();
