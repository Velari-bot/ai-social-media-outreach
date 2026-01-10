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
    }): Promise<DiscoveryPipelineResponse> {
        const { userId, filters, requestedCount, platform } = params;

        // 1. Query Internal Database first
        const internalCreators = await this.queryInternalDb(platform, filters, requestedCount);
        let foundCount = internalCreators.length;

        let externalFetches = 0;
        let creditsConsumed = 0;
        let finalCreators: Creator[] = [...internalCreators];

        // 2. Fallback to Influencers.club if needed
        if (foundCount < requestedCount) {
            try {
                const remaining = requestedCount - foundCount;
                const externalResults = await influencerClubClient.discoverCreators({
                    platform,
                    filters,
                    limit: remaining,
                });

                externalFetches = externalResults.length;
                creditsConsumed = externalFetches * 0.01; // As per requirements

                // 3. Deduplication Logic
                const newCreators = await this.processExternalResults(externalResults, internalCreators, platform);

                // 4. database Insert (status = 'pending')
                const savedCreators = await this.bulkSaveCreators(newCreators);

                // 5. Clay Enrichment Pipeline
                // Only enrich the NEW creators we just found
                const enrichedCreators = await this.bulkEnrichWithClay(savedCreators, userId);

                finalCreators = [...finalCreators, ...enrichedCreators];
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

        // Apply basic filters if provided (Firestore has limitations with inequality on multiple fields)
        if (filters.minFollowers) {
            query = query.where('basic_profile_data.followers', '>=', filters.minFollowers);
        }

        // Note: In a production environment, you might use Algolia or ElasticSearch for complex filtering.
        // For now, we fetch and partial filter in memory if needed, but aim for DB filtering.
        const snapshot = await query.limit(limit).get();
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
                has_basic_profile: true,
                has_detailed_profile: false,
                enrichment_status: 'pending' as const,
                source: 'influencers_club',
                basic_profile_data: item,
                email_found: false,
                email: null,
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
        return {
            id: doc.id,
            ...data,
            created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
            updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
        } as Creator;
    }
}

export const discoveryPipeline = new DiscoveryPipeline();
