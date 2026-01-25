"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.discoveryPipeline = exports.DiscoveryPipeline = void 0;
const firebase_admin_1 = require("../firebase-admin");
const influencer_club_client_1 = require("./influencer-club-client");
const clay_client_1 = require("./clay-client");
const outreach_queue_1 = require("./outreach-queue");
const firestore_1 = require("firebase-admin/firestore");
/**
 * Discovery Pipeline Service
 * Implements the hybrid discovery + enrichment logic
 */
class DiscoveryPipeline {
    /**
     * Main entry point for the discovery pipeline
     */
    async discover(params) {
        const { userId, filters, requestedCount, platform, skipEnrichment, campaignId, startingOffset, startingKeywordIndex, youtubePageToken: initialYoutubePageToken } = params;
        console.log(`[Discovery] Starting search for User ${userId}. Requested: ${requestedCount}. Offset: ${startingOffset || 0}`);
        // 1. Build User's "Seen" Cache (Deduplication)
        const userSeenIds = await this.getUserSeenCreatorIds(userId);
        let finalCreators = [];
        let externalFetches = 0;
        let creditsConsumed = 0;
        // --- STRATEGY: SEMANTIC FAN-OUT ---
        let searchKeywords = [];
        // Initial keyword (user provided)
        if (filters.niche !== undefined && filters.niche !== null && filters.niche.trim() !== '') {
            searchKeywords.push(filters.niche);
        }
        else if (filters.niche === "") {
            searchKeywords.push("");
        }
        else {
            searchKeywords.push("lifestyle");
        }
        // Processing Loop
        let keywordIndex = startingKeywordIndex || 0;
        const TARGET_COUNT = Math.max(requestedCount, 50); // Ensure we aim for 50
        const MAX_KEYWORDS = 15;
        // Progress Tracking
        let lastOffset = startingOffset || 0;
        let lastYoutubeToken = initialYoutubePageToken;
        let lastKeywordIndex = keywordIndex;
        while (finalCreators.length < TARGET_COUNT && keywordIndex < searchKeywords.length) {
            const currentKeyword = searchKeywords[keywordIndex];
            console.log(`[Discovery] Searching for keyword: "${currentKeyword}" (${finalCreators.length}/${TARGET_COUNT} found)`);
            // AI Keyword Expansion
            if (keywordIndex === searchKeywords.length - 1 && finalCreators.length < TARGET_COUNT && searchKeywords.length < MAX_KEYWORDS) {
                console.log(`[Discovery] Almost out of keywords. Generating variations...`);
                const baseForExpansion = (filters.niche && filters.niche.trim() !== '') ? filters.niche : currentKeyword;
                const newKeywords = await this.generateRelatedKeywords(baseForExpansion, 10);
                for (const k of newKeywords) {
                    if (!searchKeywords.includes(k)) {
                        searchKeywords.push(k);
                    }
                }
            }
            const currentFilters = { ...filters, niche: currentKeyword };
            let currentOffset = (keywordIndex === (startingKeywordIndex || 0) && startingOffset) ? startingOffset : 0;
            let keywordRetries = 0;
            const MAX_RETRIES_PER_KEYWORD = 20; // Allow skipping large backlogs
            let youtubePageToken = (keywordIndex === (startingKeywordIndex || 0)) ? initialYoutubePageToken : undefined;
            // Inner Loop: Paging through results for this keyword
            while (keywordRetries <= MAX_RETRIES_PER_KEYWORD && finalCreators.length < TARGET_COUNT) {
                try {
                    let externalResults = [];
                    // Per user instruction: Always use Influencer Club for website discovery, regardless of platform.
                    // YouTube API is reserved for the browser extension.
                    externalResults = await influencer_club_client_1.influencerClubClient.discoverCreators({
                        platform,
                        filters: currentFilters,
                        limit: 50,
                        offset: currentOffset,
                    });
                    if (externalResults && externalResults.length > 0) {
                        externalFetches += externalResults.length;
                        creditsConsumed += 1;
                        let addedThisPage = 0;
                        for (const raw of externalResults) {
                            if (finalCreators.length >= TARGET_COUNT)
                                break;
                            const creator = await this.resolveCreator(raw, platform);
                            // MANAGEMENT CHECK
                            const excludeManagement = filters.excludeManagement === true;
                            if (excludeManagement) {
                                const bio = (creator.bio || creator.basic_profile_data?.biography || "").toLowerCase();
                                if (bio.includes("management") || bio.includes("agency") || bio.includes("@mngt") || bio.includes("manager") || bio.includes("mgmt")) {
                                    continue;
                                }
                            }
                            if (finalCreators.some(c => c.id === creator.id))
                                continue;
                            if (!userSeenIds.has(String(creator.id))) {
                                finalCreators.push(creator);
                                userSeenIds.add(String(creator.id));
                                addedThisPage++;
                            }
                        }
                        console.log(`[Discovery] Keyword "${currentKeyword}" (Off: ${currentOffset}) found ${addedThisPage} NEW creators.`);
                    }
                    if (!externalResults || externalResults.length === 0 || (platform === 'youtube' && !youtubePageToken)) {
                        lastOffset = 0; // Reset offset for next keyword
                        lastYoutubeToken = undefined;
                        break;
                    }
                    currentOffset += 50;
                    lastOffset = currentOffset;
                    keywordRetries++;
                }
                catch (e) {
                    console.error(`[Discovery] Search failed for keyword "${currentKeyword}":`, e);
                    break;
                }
            }
            lastKeywordIndex = keywordIndex;
            keywordIndex++;
        }
        console.log(`[Discovery] Pipeline Complete. Found ${finalCreators.length} unique creators.`);
        // --- RIGOROUS YT VIEW VERIFICATION ---
        const minAvgViews = Number(filters.min_avg_views || 0);
        const hasYoutubeKey = !!process.env.YOUTUBE_API_KEY;
        if (platform === 'youtube' && minAvgViews > 0 && finalCreators.length > 0) {
            if (!hasYoutubeKey) {
                console.log(`[Discovery] YOUTUBE_API_KEY missing. Skipping rigorous verification and trusting Influencer Club results.`);
                // If we rely on IC, we assume the creators meet the criteria. 
                // We'll leave avg_views as-is (likely 0 or undefined from IC), or could patch it.
            }
            else {
                console.log(`[Discovery] Verifying actual views for ${finalCreators.length} YouTube creators...`);
                const { batchVerifyYoutubeViews } = await Promise.resolve().then(() => __importStar(require('./youtube-email-extractor')));
                const channelIds = finalCreators.map(c => c.verality_id || String(c.id));
                const realViews = await batchVerifyYoutubeViews(channelIds);
                // Update all creators with real view counts for accurate ranking
                finalCreators.forEach(c => {
                    const avg = realViews[c.verality_id || String(c.id)];
                    if (avg !== undefined)
                        c.avg_views = avg;
                });
                // Level 1: Strict Match
                let verifiedCreators = finalCreators.filter(c => (c.avg_views || 0) >= minAvgViews);
                console.log(`[Discovery] Strict View Check (>=${minAvgViews}): Found ${verifiedCreators.length}`);
                // Level 2: Soft Match (50% threshold) if strict failed to find enough
                if (verifiedCreators.length < 5) {
                    console.log(`[Discovery] Strict check yielded low results. Relaxing threshold to 50% (${minAvgViews * 0.5}+)...`);
                    verifiedCreators = finalCreators.filter(c => (c.avg_views || 0) >= (minAvgViews * 0.5));
                    console.log(`[Discovery] Soft Match Found: ${verifiedCreators.length}`);
                }
                // Level 3: "Best Effort" - If we still have 0, take top performers found locally
                if (verifiedCreators.length === 0) {
                    console.log(`[Discovery] View verification failed to match target. Returning top 10 available creators (Best Effort).`);
                    // Sort by views descending and take top 10
                    verifiedCreators = finalCreators
                        .sort((a, b) => (b.avg_views || 0) - (a.avg_views || 0))
                        .slice(0, 10);
                }
                finalCreators = verifiedCreators;
                console.log(`[Discovery] Final Verified Count: ${finalCreators.length}`);
            }
        }
        // --- ELITE RANKING LOGIC ---
        finalCreators = finalCreators.map(creator => {
            const followers = creator.followers || 1;
            const engagement = creator.engagement_rate || 0;
            const avgViews = creator.avg_views || 0;
            const sizeScore = Math.min(Math.log10(followers) / 9, 1) * 0.15; // Subs matter less
            const engagementScore = Math.min(engagement * 20, 1) * 0.45; // Real engagement matters most
            const viewScore = Math.min(Math.log10(avgViews || 1) / 6.5, 1.2) * 0.4; // Massively weight huge view counts
            // Quality Penalty: Penalize if subs are high but views are disproportionately low
            const performanceRatio = avgViews / Math.max(followers, 1000);
            const qualityMultiplier = performanceRatio < 0.02 ? 0.3 : performanceRatio > 0.5 ? 1.3 : 1.0;
            const totalScore = (engagementScore + sizeScore + viewScore) * qualityMultiplier;
            // Generate Insight Tag if missing
            let insightTag = creator.insight_tag || "Relevant Match";
            if (performanceRatio > 1.0)
                insightTag = "Viral Sensation";
            else if (followers > 100000 && performanceRatio > 0.2)
                insightTag = "Top Tier Creator";
            else if (followers > 100000)
                insightTag = "Established Authority";
            else if (performanceRatio > 0.5)
                insightTag = "High Engagement";
            return {
                ...creator,
                ranking_score: totalScore,
                insight_tag: insightTag
            };
        });
        finalCreators.sort((a, b) => (b.ranking_score || 0) - (a.ranking_score || 0));
        // 5. Enrichment
        if (!skipEnrichment && finalCreators.length > 0) {
            console.log(`[Discovery] Sending ${finalCreators.length} creators to Clay...`);
            finalCreators = await this.bulkEnrichWithClay(finalCreators, userId, campaignId);
            // Automatically queue found emails
            const enrichedIds = finalCreators
                .filter(c => c.email && c.email.includes('@') && (c.enrichment_status === 'enriched' || c.email_found))
                .map(c => String(c.id));
            if (enrichedIds.length > 0) {
                console.log(`[Discovery] Automatically queuing ${enrichedIds.length} creators for outreach...`);
                await (0, outreach_queue_1.addCreatorsToQueue)(enrichedIds, userId, campaignId);
            }
        }
        return {
            creators: finalCreators,
            meta: {
                total_requested: requestedCount,
                internal_hits: 0,
                external_fetches: externalFetches,
                credits_consumed: creditsConsumed,
                next_offset: lastOffset,
                next_youtube_page_token: lastYoutubeToken,
                next_keyword_index: lastKeywordIndex
            }
        };
    }
    /**
     * Generate related keywords using OpenAI to expand search breadth
     */
    async generateRelatedKeywords(baseNiche, count = 5) {
        try {
            const { default: OpenAI } = await Promise.resolve().then(() => __importStar(require('openai')));
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
                        content: `Generate ${count} specific, diverse, and popular social media bio keywords or sub - niches related to "${baseNiche}". 
                        For example, if the niche is "Travel", return ["backpacker", "luxury hotel", "digital nomad", "van life", "tourism"].
                        Return PURE JSON array.`
                    }
                ],
                temperature: 0.7
            });
            const content = completion.choices[0].message.content || "[]";
            const keywords = JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
            if (Array.isArray(keywords)) {
                return keywords.map(k => String(k).toLowerCase());
            }
            return [baseNiche];
        }
        catch (e) {
            console.error("[Discovery] AI Expansion Failed:", e);
            // Fallback: simple heuristics if AI fails
            return [`${baseNiche} lover`, `${baseNiche} life`, `best ${baseNiche}`, `my ${baseNiche}`];
        }
    }
    /**
     * Get Set of Creator IDs the user has already requested/seen.
     */
    async getUserSeenCreatorIds(userId) {
        const seen = new Set();
        try {
            // Optimization: If this gets huge, we need a "user_seen_creators" subcollection.
            // For now, reading creator_requests is okay.
            const snapshot = await firebase_admin_1.db.collection('creator_requests')
                .where('user_id', '==', userId)
                .select('creator_ids')
                .get();
            snapshot.docs.forEach(doc => {
                const ids = doc.data().creator_ids;
                if (Array.isArray(ids)) {
                    ids.forEach(id => seen.add(String(id)));
                }
            });
        }
        catch (e) {
            console.error('Failed to fetch user history', e);
        }
        return seen;
    }
    /**
     * Find existing creator or create new one in Global DB
     */
    async resolveCreator(raw, platform) {
        const handle = (raw.handle || raw.username || '').toLowerCase();
        // 1. Try to find by handle & platform
        const snapshot = await firebase_admin_1.db.collection('creators')
            .where('platform', '==', platform)
            .where('handle', '==', handle)
            .limit(1)
            .get();
        if (!snapshot.empty) {
            // Found existing in Global DB
            const doc = snapshot.docs[0];
            const existing = this.docToCreator(doc);
            // Self-healing: Update verality_id if incoming is better (e.g. UC vs uc_)
            // And update avg_views if incoming has data and existing does not
            const updates = {};
            let needsUpdate = false;
            if (platform === 'youtube' && raw.creator_id && String(raw.creator_id).startsWith('UC')) {
                if (!existing.verality_id || !existing.verality_id.startsWith('UC')) {
                    updates.verality_id = raw.creator_id;
                    existing.verality_id = raw.creator_id;
                    needsUpdate = true;
                }
            }
            // Update avg_views if we have new data and old is 0
            if ((raw.avg_views || 0) > 0 && (existing.avg_views || 0) === 0) {
                updates.avg_views = raw.avg_views;
                existing.avg_views = raw.avg_views;
                needsUpdate = true;
            }
            if (needsUpdate) {
                await doc.ref.update({ ...updates, updated_at: firestore_1.Timestamp.now() });
                console.log(`[Discovery] Self-healed creator ${handle}:`, updates);
            }
            return existing;
        }
        // 2. Create New
        const now = firestore_1.Timestamp.now();
        const creatorData = {
            platform: platform,
            handle: handle,
            verality_id: raw.creator_id || raw.id || null,
            name: raw.fullname || raw.full_name || raw.name || handle,
            full_name: raw.fullname || raw.full_name || raw.name || handle,
            followers: raw.followers || 0,
            engagement_rate: raw.engagement_rate || 0,
            avg_views: raw.avg_views || 0,
            picture: raw.picture || raw.profile_pic_url,
            location: raw.location || raw.country || raw.geo_country || null,
            has_basic_profile: true,
            has_detailed_profile: false,
            enrichment_status: 'pending',
            source: 'influencers_club',
            basic_profile_data: raw,
            niche: raw.category || raw.niche || null,
            email_found: raw.emails && raw.emails.length > 0,
            email: raw.emails && raw.emails.length > 0 ? raw.emails[0] : null,
            clay_enriched_at: null,
            detailed_profile_fetched_at: null,
            detailed_profile_data: null
        };
        const docRef = await firebase_admin_1.db.collection('creators').add({
            ...creatorData,
            created_at: now,
            updated_at: now,
        });
        const newDoc = await docRef.get();
        return this.docToCreator(newDoc);
    }
    /**
     * Enrich batch of creators with YouTube extraction first, then Clay fallback
     */
    async bulkEnrichWithClay(creators, userId, campaignId) {
        const { findCreatorEmail } = await Promise.resolve().then(() => __importStar(require('./youtube-email-extractor')));
        // Track stats
        let youtubeSuccesses = 0;
        let clayFallbacks = 0;
        let totalFailures = 0;
        // Use Promise.all for parallel enrichment, but keep it robust
        const enrichmentPromises = creators.map(async (creator) => {
            try {
                // Update status to processing
                await firebase_admin_1.db.collection('creators').doc(String(creator.id)).update({
                    enrichment_status: 'processing',
                    updated_at: firestore_1.Timestamp.now()
                });
                // STEP 1: Try YouTube extraction first (FREE)
                let emailResult = null;
                let emailSource = 'none';
                let usedClay = false;
                if (creator.platform === 'youtube') {
                    console.log(`[Enrichment] Trying YouTube extraction for ${creator.handle}...`);
                    const youtubeResult = await findCreatorEmail({
                        channelId: creator.verality_id || String(creator.id),
                        channelHandle: creator.handle,
                        platform: 'youtube',
                        useClayFallback: false // Don't use Clay yet
                    });
                    if (youtubeResult.email) {
                        emailResult = youtubeResult.email;
                        emailSource = youtubeResult.source;
                        youtubeSuccesses++;
                        console.log(`[Enrichment] ✅ Found email via YouTube: ${emailResult}`);
                    }
                }
                // STEP 2: If YouTube failed, fallback to Clay (PAID)
                if (!emailResult) {
                    console.log(`[Enrichment] YouTube failed for ${creator.handle}, using Clay...`);
                    const clayResult = await clay_client_1.clayClient.enrichCreator({
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
                    emailResult = clayResult.email || null;
                    emailSource = 'clay';
                    usedClay = true;
                    clayFallbacks++;
                    // Update with all Clay data
                    const updateData = {
                        email: clayResult.email || null,
                        email_found: !!clayResult.email,
                        phone: clayResult.phone || null,
                        bio: clayResult.bio || creator.bio || null,
                        website: clayResult.website || creator.website || null,
                        enrichment_status: clayResult.is_pending ? 'processing' : 'enriched',
                        clay_enriched_at: new Date().toISOString(),
                        email_source: emailSource,
                        updated_at: new Date().toISOString(),
                    };
                    await firebase_admin_1.db.collection('creators').doc(String(creator.id)).update(updateData);
                    return { ...creator, ...updateData };
                }
                // STEP 3: YouTube found email - update with YouTube data only
                const updateData = {
                    email: emailResult,
                    email_found: true,
                    enrichment_status: 'enriched',
                    email_source: emailSource,
                    updated_at: new Date().toISOString(),
                };
                await firebase_admin_1.db.collection('creators').doc(String(creator.id)).update(updateData);
                return { ...creator, ...updateData };
            }
            catch (error) {
                console.error(`Enrichment failed for ${creator.handle}:`, error);
                totalFailures++;
                // Fail gracefully: update status but return the discovery data
                await firebase_admin_1.db.collection('creators').doc(String(creator.id)).update({
                    enrichment_status: 'failed',
                    updated_at: firestore_1.Timestamp.now()
                });
                return { ...creator, enrichment_status: 'failed' };
            }
        });
        const results = await Promise.all(enrichmentPromises);
        // Log stats
        console.log(`[Enrichment Stats] YouTube: ${youtubeSuccesses}, Clay: ${clayFallbacks}, Failed: ${totalFailures}`);
        console.log(`[Enrichment Stats] 💰 Saved ${youtubeSuccesses} Clay API calls!`);
        return results;
    }
    /**
     * Helper to convert Firestore doc to Creator type
     */
    docToCreator(doc) {
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
        };
    }
}
exports.DiscoveryPipeline = DiscoveryPipeline;
exports.discoveryPipeline = new DiscoveryPipeline();
