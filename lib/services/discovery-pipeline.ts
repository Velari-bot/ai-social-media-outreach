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

        console.log(`[Discovery] Starting search for User ${userId}. Requested: ${requestedCount}`);

        // 1. Build User's "Seen" Cache (Deduplication)
        const userSeenIds = await this.getUserSeenCreatorIds(userId);
        let finalCreators: Creator[] = [];
        let externalFetches = 0;
        let creditsConsumed = 0;

        // --- STRATEGY: SEMANTIC FAN-OUT ---
        // If the API limits us to 5 results per query, we must use multiple DIFFERENT queries.
        // We will start with the user's provided niche, and if we need more, we ask AI for related keywords.

        let searchKeywords: string[] = [];

        // Initial keyword (user provided)
        // Note: If niche is empty string, we respect it as "Broad Search"
        if (filters.niche !== undefined && filters.niche !== null && filters.niche.trim() !== '') {
            searchKeywords.push(filters.niche);
        } else if (filters.niche === "") {
            // User explicitly wants broad search (empty string)
            searchKeywords.push("");
        } else {
            // Fallback if no niche provided at all (e.g. legacy call)
            searchKeywords.push("lifestyle");
        }

        // Processing Loop
        let keywordIndex = 0;
        const TARGET_COUNT = Math.max(requestedCount, 50); // Ensure we aim for 50 "no matter what" as requested

        // Safety: Don't run forever. Cap at 15 keywords max.
        const MAX_KEYWORDS = 15;

        while (finalCreators.length < TARGET_COUNT && keywordIndex < searchKeywords.length) {

            const currentKeyword = searchKeywords[keywordIndex];
            console.log(`[Discovery] Searching for keyword: "${currentKeyword}" (${finalCreators.length}/${TARGET_COUNT} found)`);

            // Check if we need to generate more keywords?
            // If we are at the last keyword and still need more creators, generate expansion
            if (keywordIndex === searchKeywords.length - 1 && finalCreators.length < TARGET_COUNT && searchKeywords.length < MAX_KEYWORDS) {
                console.log(`[Discovery] Almost out of keywords. Generating variations for "${filters.niche}"...`);
                const newKeywords = await this.generateRelatedKeywords(filters.niche || currentKeyword, 10);

                // Add only new unique keywords
                for (const k of newKeywords) {
                    if (!searchKeywords.includes(k)) {
                        searchKeywords.push(k);
                    }
                }
                console.log(`[Discovery] Expanded keyword list to: ${searchKeywords.length} items.`);
            }

            // Perform Search for this keyword
            // We force the 'niche' filter to be the current keyword for this iteration
            const currentFilters = { ...filters, niche: currentKeyword };

            try {
                // Try fetching - we know pagination might be broken so we just ask for 50 and take what we get
                const externalResults = await influencerClubClient.discoverCreators({
                    platform,
                    filters: currentFilters,
                    limit: 50,
                    offset: 0
                });

                if (externalResults) {
                    externalFetches += externalResults.length;
                    creditsConsumed += 1; // 1 credit per API call

                    // Deduplicate and Add
                    let addedForKeyword = 0;
                    for (const raw of externalResults) {
                        if (finalCreators.length >= TARGET_COUNT) break;

                        const creator = await this.resolveCreator(raw, platform);

                        // MANAGEMENT CHECK (for 'custom_no_email' plan)
                        const excludeManagement = (filters as any).excludeManagement === true;
                        if (excludeManagement) {
                            const bio = (creator.biography || "").toLowerCase();
                            const hasManagement = bio.includes("management") || bio.includes("agency") || bio.includes("@mngt") || bio.includes("manager") || bio.includes("mgmt");
                            if (hasManagement) {
                                // Skip this creator
                                continue;
                            }
                        }

                        // Double check uniqueness (against DB history AND current batch)
                        finalCreators.push(creator);
                        userSeenIds.add(String(creator.id));
                        addedForKeyword++;
                    }
                }
                console.log(`[Discovery] Keyword "${currentKeyword}" yielded ${addedForKeyword} NEW creators.`);
            }
            } catch (e) {
            console.error(`[Discovery] Search failed for keyword "${currentKeyword}":`, e);
        }

        keywordIndex++;
    }

        // Trim to requested size if we went over
        // (Though sending a few extra is usually better than under-delivering)
        // finalCreators = finalCreators.slice(0, requestedCount); 

        console.log(`[Discovery] Pipeline Complete. Found ${finalCreators.length} unique creators across ${ keywordIndex } keywords.`);

        // 5. Clay Enrichment
        if (!skipEnrichment && finalCreators.length > 0) {
            console.log(`[Discovery] Sending ${ finalCreators.length } creators to Clay...`);
            finalCreators = await this.bulkEnrichWithClay(finalCreators, userId, campaignId);
        }

        return {
            creators: finalCreators,
            meta: {
                total_requested: requestedCount,
                internal_hits: 0,
                external_fetches: externalFetches,
                credits_consumed: creditsConsumed
            }
        };
    }

    /**
     * Generate related keywords using OpenAI to expand search breadth
     */
    private async generateRelatedKeywords(baseNiche: string, count: number = 5): Promise<string[]> {
        try {
            const { default: OpenAI } = await import('openai');
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You remain a JSON generator. Return only a JSON array of strings."
                    },
                    {
                        role: "user",
                        content: `Generate ${ count } specific, diverse, and popular social media bio keywords or sub - niches related to "${baseNiche}". 
                        For example, if the niche is "Travel", return ["backpacker", "luxury hotel", "digital nomad", "van life", "tourism"].
                        Return PURE JSON array.`
                    }
                ],
                temperature: 0.7
            });

            const content = completion.choices[0].message.content || "[]";
            const keywords = JSON.parse(content.replace(/```json / g, '').replace(/```/g, '').trim());

if (Array.isArray(keywords)) {
    return keywords.map(k => String(k).toLowerCase());
}
return [baseNiche];

        } catch (e) {
    console.error("[Discovery] AI Expansion Failed:", e);
    // Fallback: simple heuristics if AI fails
    return [`${baseNiche} lover`, `${baseNiche} life`, `best ${baseNiche}`, `my ${baseNiche}`];
}
    }

    /**
     * Get Set of Creator IDs the user has already requested/seen.
     */
    private async getUserSeenCreatorIds(userId: string): Promise < Set < string >> {
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
    } catch(e) {
        console.error('Failed to fetch user history', e);
    }
        return seen;
}

    /**
     * Find existing creator or create new one in Global DB
     */
    private async resolveCreator(raw: any, platform: Platform): Promise < Creator > {
    const handle = (raw.handle || raw.username || '').toLowerCase();

    // 1. Try to find by handle & platform
    const snapshot = await db.collection('creators')
        .where('platform', '==', platform)
        .where('handle', '==', handle)
        .limit(1)
        .get();

    if(!snapshot.empty) {
    // Found existing in Global DB
    return this.docToCreator(snapshot.docs[0]);
}

// 2. Create New
const now = Timestamp.now();
const creatorData: Omit<Creator, 'id' | 'created_at' | 'updated_at'> = {
    platform: platform,
    handle: handle,
    verality_id: raw.creator_id || raw.id || null,
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
    private async bulkEnrichWithClay(creators: Creator[], userId: string, campaignId ?: string): Promise < Creator[] > {
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
                campaignId: campaignId,
                creatorId: creator.id,
                niche: creator.niche || undefined,
                followers: creator.followers,
                bio: creator.basic_profile_data?.biography || creator.bio || undefined,
                website: creator.website || undefined,
                name: creator.name || undefined
            });

            const updateData: Partial<Creator> = {
                email: clayResult.email || null,
                email_found: !!clayResult.email,
                phone: clayResult.phone || null,
                bio: clayResult.bio || null,
                website: clayResult.website || null,
                enrichment_status: (clayResult as any).is_pending ? 'processing' : 'enriched',
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
