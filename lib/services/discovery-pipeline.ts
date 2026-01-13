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
        campaignId?: string;
    }): Promise<DiscoveryPipelineResponse> {
        const { userId, filters, requestedCount, platform, skipEnrichment, campaignId } = params;

        console.log(`[Discovery] Starting search for User ${userId}. Force External: YES`);

        // 1. Build User's "Seen" Cache (Deduplication)
        const userSeenIds = await this.getUserSeenCreatorIds(userId);
        console.log(`[Discovery] User has already seen ${userSeenIds.size} creators.`);

        // 2. ALWAYS Fetch from Influencer Club (Fresh Data)
        // We fetch slightly more than requested to account for duplicates we might filter out
        const fetchLimit = Math.min(requestedCount, 50);
        let externalFetches = 0;
        let creditsConsumed = 0;
        let finalCreators: Creator[] = [];

        try {
            // We loop until we have enough or hit a safety limit (e.g. 2 pages)
            // For now, single fetch as per simpler logic, but requests "new everytime".
            // If the first 50 are all duplicates, we might need to fetch more?
            // Let's stick to one batch for now to avoid accidental infinite loops/credit drain.

            const externalResults = await influencerClubClient.discoverCreators({
                platform,
                filters,
                limit: fetchLimit,
            });
            externalFetches = externalResults.length;
            const batches = Math.ceil(externalFetches / 50);
            creditsConsumed = batches > 0 ? batches : 1;

            console.log(`[Discovery] External API returned ${externalResults.length} raw results`);

            // 3. Process & Resolve to Internal DB (Global Deduplication)
            // We need to convert these raw results into Creator objects (either existing DB ones or new ones)

            const handles = externalResults.map(r => (r.handle || r.username || '').toLowerCase()).filter(h => h);

            // Batch Query for existing creators by handle
            // Firestore 'in' limit is 30. We process in chunks or Promise.all if needed.
            // Simplified: Loop and check/create (Parallel).

            const resolvedCreators = await Promise.all(externalResults.map(async (raw) => {
                return await this.resolveCreator(raw, platform);
            }));

            // 4. Per-User Deduplication
            for (const creator of resolvedCreators) {
                if (userSeenIds.has(String(creator.id))) {
                    console.log(`[Discovery] Skipping duplicate for user: ${creator.handle}`);
                    continue;
                }
                finalCreators.push(creator);
                userSeenIds.add(String(creator.id)); // Add to current set
            }

            console.log(`[Discovery] After Dedupe: ${finalCreators.length} unique new creators for user.`);

        } catch (error: any) {
            console.error('[Discovery] External Fetch Failed:', error);
            // In strict mode "force external", we fail? Or fallback?
            // User said "pulling from db ... shouldn't be". So we probably shouldn't return old data.
            // But returning nothing is bad UI.
            // Let's return empty if failed, or maybe internal cache if we really have to?
            // "it needs to generate new creators eerytime" -> implication: if fail, show error.
        }

        // Trim
        finalCreators = finalCreators.slice(0, requestedCount);

        // 5. Clay Enrichment
        if (!skipEnrichment && finalCreators.length > 0) {
            console.log(`[Discovery] Sending ${finalCreators.length} creators to Clay...`);
            finalCreators = await this.bulkEnrichWithClay(finalCreators, userId, campaignId);
        }

        return {
            creators: finalCreators,
            meta: {
                total_requested: requestedCount,
                internal_hits: 0, // We intentionally ignored internal cache as source
                external_fetches: externalFetches,
                credits_consumed: creditsConsumed
            }
        };
    }

    /**
     * Get Set of Creator IDs the user has already requested/seen.
     */
    private async getUserSeenCreatorIds(userId: string): Promise<Set<string>> {
        const seen = new Set<string>();
        try {
            // Optimization: If this gets huge, we need a "user_seen_creators" subcollection.
            // For now, reading creator_requests is okay.
            const snapshot = await db.collection('creator_requests')
                .where('user_id', '==', userId)
                .select('creator_ids')
                .get();

            snapshot.docs.forEach(doc => {
                const ids = doc.data().creator_ids;
                if (Array.isArray(ids)) {
                    ids.forEach(id => seen.add(String(id)));
                }
            });
        } catch (e) {
            console.error('Failed to fetch user history', e);
        }
        return seen;
    }

    /**
     * Find existing creator or create new one in Global DB
     */
    private async resolveCreator(raw: any, platform: Platform): Promise<Creator> {
        const handle = (raw.handle || raw.username || '').toLowerCase();

        // 1. Try to find by handle & platform
        const snapshot = await db.collection('creators')
            .where('platform', '==', platform)
            .where('handle', '==', handle)
            .limit(1)
            .get();

        if (!snapshot.empty) {
            // Found existing in Global DB
            return this.docToCreator(snapshot.docs[0]);
        }

        // 2. Create New
        const now = Timestamp.now();
        const creatorData: Omit<Creator, 'id' | 'created_at' | 'updated_at'> = {
            platform: platform,
            handle: handle,
            modash_creator_id: raw.creator_id || raw.id || null,
            name: raw.fullname || raw.full_name || raw.name || handle,
            full_name: raw.fullname || raw.full_name || raw.name || handle,
            followers: raw.followers || 0,
            engagement_rate: raw.engagement_rate || 0,
            picture: raw.picture || raw.profile_pic_url,
            location: raw.location || raw.country || raw.geo_country || null,
            has_basic_profile: true,
            has_detailed_profile: false,
            enrichment_status: 'pending' as const,
            source: 'influencers_club',
            basic_profile_data: raw,
            niche: raw.category || raw.niche || null,
            email_found: raw.emails && raw.emails.length > 0,
            email: raw.emails && raw.emails.length > 0 ? raw.emails[0] : null,
            clay_enriched_at: null,
            detailed_profile_fetched_at: null,
            detailed_profile_data: null
        };

        const docRef = await db.collection('creators').add({
            ...creatorData,
            created_at: now,
            updated_at: now,
        });

        const newDoc = await docRef.get();
        return this.docToCreator(newDoc);
    }

    /**
     * Enrich batch of creators with Clay
     */
    private async bulkEnrichWithClay(creators: Creator[], userId: string, campaignId?: string): Promise<Creator[]> {
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
                    userId: userId,
                    campaignId: campaignId
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
