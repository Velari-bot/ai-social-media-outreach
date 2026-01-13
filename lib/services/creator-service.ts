import { db } from '../firebase-admin';
import { Creator, CreatorSearchFilters, Platform } from '../types';
import { modashClient } from './modash-client';
import { influencerClubClient } from './influencer-club-client';
import { clayClient } from './clay-client';
import { logApiCall } from './api-logger';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Hash search filters to create a cache key
 */
function hashFilters(filters: CreatorSearchFilters): string {
  // Create a deterministic hash of the filters
  const sortedFilters = Object.keys(filters)
    .sort()
    .reduce((acc, key) => {
      acc[key] = filters[key];
      return acc;
    }, {} as Record<string, any>);

  return JSON.stringify(sortedFilters);
}

/**
 * Convert Firestore document to Creator
 */
function docToCreator(doc: any): Creator {
  const data = doc.data ? doc.data() : doc;
  return {
    id: parseInt(doc.id) || doc.id,
    platform: data.platform,
    handle: data.handle,
    modash_creator_id: data.modash_creator_id || null,
    has_basic_profile: data.has_basic_profile || false,
    has_detailed_profile: data.has_detailed_profile || false,
    detailed_profile_fetched_at: data.detailed_profile_fetched_at?.toDate?.()?.toISOString() || data.detailed_profile_fetched_at || null,
    email_found: data.email_found || false,
    clay_enriched_at: data.clay_enriched_at?.toDate?.()?.toISOString() || data.clay_enriched_at || null,
    basic_profile_data: data.basic_profile_data || null,
    detailed_profile_data: data.detailed_profile_data || null,
    email: data.email || null,
    created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString(),
    updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at || new Date().toISOString(),
  };
}

/**
 * Find creators in cache matching the search filters
 * First checks if we've done a similar search before, then returns cached creators
 */
async function findCachedCreators(
  platform: Platform,
  filtersHash: string,
  limit: number
): Promise<Creator[]> {
  try {
    // Check if we've done a similar search before
    const previousSearches = await db.collection('search_requests')
      .where('platform', '==', platform)
      .where('filters_hash', '==', filtersHash)
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();

    // If we have a previous search with the same filters, we can use cached creators
    // For now, we'll return creators that match the platform and have basic profiles
    const snapshot = await db.collection('creators')
      .where('platform', '==', platform)
      .where('has_basic_profile', '==', true)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => docToCreator(doc));
  } catch (error) {
    console.error('Error finding cached creators:', error);
    return [];
  }
}

/**
 * Store creators from Modash discovery results
 */
async function storeCreators(
  discoveryResults: Array<{
    creator_id: string;
    handle: string;
    platform: string;
    [key: string]: any;
  }>
): Promise<Creator[]> {
  const now = Timestamp.now();
  const creators: Creator[] = [];

  for (const result of discoveryResults) {
    // Map Influencer Club fields to our schema
    const safePlatform = (result.platform || 'instagram').toLowerCase() as Platform;
    const safeHandle = result.username || result.handle || result.id; // Fallback to ID if no handle

    const creatorData = {
      platform: safePlatform,
      handle: safeHandle,
      modash_creator_id: result.user_id || result.id || safeHandle, // Use their ID as "modash_creator_id" for now to maintain schema compatibility
      has_basic_profile: true,
      has_detailed_profile: false,
      // Store raw data for debugging/future use, but ensure key fields are top-level
      basic_profile_data: {
        ...result,
        followers: result.followers_count || result.followers,
        engagement_rate: result.engagement_rate,
        fullname: result.full_name,
        picture: result.profile_pic_url,
      },
      created_at: now,
      updated_at: now,
    };

    // Check if creator already exists (using platform + handle as unique key)
    const existingQuery = await db.collection('creators')
      .where('platform', '==', safePlatform)
      .where('handle', '==', safeHandle)
      .limit(1)
      .get();

    if (existingQuery.empty) {
      // Create new creator
      const docRef = await db.collection('creators').add(creatorData);
      const doc = await docRef.get();
      creators.push(docToCreator(doc));
    } else {
      // Update existing creator
      const doc = existingQuery.docs[0];
      await doc.ref.update({
        ...creatorData,
        updated_at: now,
      });
      creators.push(docToCreator(doc));

      // AUTO-PUSH TO CLAY (Fire and Forget)
      // This ensures 24/7 automation: As soon as a creator is found/stored, they go to Clay.
      const savedCreator = docToCreator(doc);
      clayClient.enrichCreator({
        creatorId: savedCreator.id,
        handle: savedCreator.handle,
        platform: savedCreator.platform,
        name: creatorData.basic_profile_data.fullname || savedCreator.handle,
        profileUrl: result.profile_url || result.url || undefined, // Pass URL if available from source
        followers: Number(creatorData.basic_profile_data.followers || 0),
        bio: (creatorData.basic_profile_data as any).biography || (creatorData.basic_profile_data as any).bio || "",
        website: (creatorData.basic_profile_data as any).external_url || (creatorData.basic_profile_data as any).website || "",
        niche: "", // Niche is usually filter-level, not per-creator in raw data
      }).catch(err => console.error(`Failed to auto-push creator ${savedCreator.id} to Clay:`, err));
    }
  }

  return creators;
}

/**
 * Store search request for tracking
 */
async function storeSearchRequest(params: {
  userId: string;
  platform: Platform;
  filters: CreatorSearchFilters;
  requestedCount: number;
}): Promise<void> {
  const filtersHash = hashFilters(params.filters);

  try {
    await db.collection('search_requests').add({
      user_id: params.userId,
      platform: params.platform,
      filters_json: params.filters,
      filters_hash: filtersHash,
      requested_count: params.requestedCount,
      created_at: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error storing search request:', error);
    // Don't throw - this is just for tracking
  }
}

/**
 * Handle creator search - Step 1 of the flow
 * Checks cache first, only calls Modash if needed
 */
export async function searchCreators(params: {
  userId: string;
  platform: Platform;
  filters: CreatorSearchFilters;
  requestedCount: number;
}): Promise<Creator[]> {
  const filtersHash = hashFilters(params.filters);

  // Store search request for tracking
  await storeSearchRequest({
    userId: params.userId,
    platform: params.platform,
    filters: params.filters,
    requestedCount: params.requestedCount,
  });

  // Step 1: Check cache
  const cachedCreators = await findCachedCreators(
    params.platform,
    filtersHash,
    params.requestedCount
  );

  // If we have enough cached creators, return them
  if (cachedCreators.length >= params.requestedCount) {
    return cachedCreators.slice(0, params.requestedCount);
  }

  // Step 2: Calculate delta and fetch from Modash
  const delta = params.requestedCount - cachedCreators.length;

  try {
    // Call Influencer Club Discovery API (replacing Modash)
    const discoveryResults = await influencerClubClient.discoverCreators({
      platform: params.platform,
      filters: params.filters,
      limit: delta,
    });

    // Store new creators
    const newCreators = await storeCreators(discoveryResults);

    // Combine cached and new creators
    return [...cachedCreators, ...newCreators].slice(0, params.requestedCount);
  } catch (error) {
    console.error('Error in creation search:', error);

    // If API fails, return cached results if available
    if (cachedCreators.length > 0) {
      return cachedCreators;
    }

    throw error;
  }
}

/**
 * Get basic profile data for display
 * Step 2 of the flow - Display search results
 * No API calls allowed here
 */
export async function getBasicProfile(creatorId: number | string): Promise<Creator | null> {
  try {
    // Try to find by numeric ID first (if stored as document ID)
    const doc = await db.collection('creators').doc(String(creatorId)).get();

    if (doc.exists) {
      return docToCreator(doc);
    }

    // If not found by ID, try to find by querying (for legacy data)
    const query = await db.collection('creators')
      .where('id', '==', creatorId)
      .limit(1)
      .get();

    if (!query.empty) {
      return docToCreator(query.docs[0]);
    }

    return null;
  } catch (error) {
    console.error('Error fetching basic profile:', error);
    return null;
  }
}

/**
 * Check if detailed profile was fetched recently (within 30 days)
 */
function isDetailedProfileRecent(fetchedAt: string | null): boolean {
  if (!fetchedAt) return false;

  const fetchedDate = new Date(fetchedAt);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return fetchedDate > thirtyDaysAgo;
}

/**
 * Handle creator selection for outreach - Step 3 of the flow
 * Fetches detailed profile if not already cached
 */
export async function selectCreatorForOutreach(params: {
  creatorId: number | string;
  userId: string;
}): Promise<Creator> {
  // Get creator from database
  const creator = await getBasicProfile(params.creatorId);
  if (!creator) {
    throw new Error('Creator not found');
  }

  // Check if detailed profile already exists and is recent
  if (creator.has_detailed_profile && isDetailedProfileRecent(creator.detailed_profile_fetched_at)) {
    // Already have recent detailed profile, return it
    return creator;
  }

  // Need to fetch detailed profile
  if (!creator.modash_creator_id) {
    throw new Error('Creator does not have Modash ID. Cannot fetch detailed profile.');
  }

  try {
    // Call Modash Detailed Profile API
    const detailedProfile = await modashClient.getDetailedProfile(creator.modash_creator_id);

    // Update creator with detailed profile data
    const docRef = db.collection('creators').doc(String(creator.id));
    await docRef.update({
      has_detailed_profile: true,
      detailed_profile_fetched_at: Timestamp.now(),
      detailed_profile_data: detailedProfile,
      email_found: !!detailedProfile.email,
      email: detailedProfile.email || null,
      updated_at: Timestamp.now(),
    });

    const updatedDoc = await docRef.get();
    return docToCreator(updatedDoc);
  } catch (error) {
    console.error('Error fetching detailed profile:', error);
    throw error;
  }
}

/**
 * Enrich creator with Clay - Step 4 of the flow
 * Only called after detailed profile is available
 */
export async function enrichCreatorWithClay(params: {
  creatorId: number | string;
  userId: string;
}): Promise<Creator> {
  // Get creator from database
  const creator = await getBasicProfile(params.creatorId);
  if (!creator) {
    throw new Error('Creator not found');
  }

  // Check if detailed profile exists
  if (!creator.has_detailed_profile) {
    throw new Error('Detailed profile must be fetched before Clay enrichment');
  }

  // Check if already enriched
  if (creator.email_found && creator.clay_enriched_at) {
    return creator;
  }

  try {
    // Call Clay enrichment API
    const enrichmentResult = await clayClient.enrichCreator({
      handle: creator.handle,
      platform: creator.platform,
      creatorId: typeof params.creatorId === 'number' ? params.creatorId : parseInt(params.creatorId),
      userId: params.userId,
    });

    // Update creator with email data
    const docRef = db.collection('creators').doc(String(creator.id));
    await docRef.update({
      email_found: !!enrichmentResult.email,
      email: enrichmentResult.email || creator.email || null,
      clay_enriched_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });

    const updatedDoc = await docRef.get();
    return docToCreator(updatedDoc);
  } catch (error) {
    console.error('Error enriching creator with Clay:', error);
    throw error;
  }
}

/**
 * Get creator for outreach - Step 5 of the flow
 * Uses cached data only, no API calls
 */
export async function getCreatorForOutreach(creatorId: number | string): Promise<Creator | null> {
  return getBasicProfile(creatorId);
}
