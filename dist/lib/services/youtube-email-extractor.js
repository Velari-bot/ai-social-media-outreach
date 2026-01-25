"use strict";
/**
 * YouTube Email Extractor
 * Attempts to find creator emails from YouTube data before using Clay
 */
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
exports.extractEmailFromYouTube = extractEmailFromYouTube;
exports.findCreatorEmail = findCreatorEmail;
exports.discoverCreatorsViaYouTube = discoverCreatorsViaYouTube;
exports.batchVerifyYoutubeViews = batchVerifyYoutubeViews;
/**
 * Extract email from YouTube channel data
 * This runs BEFORE Clay enrichment to save API costs
 */
async function extractEmailFromYouTube(channelId, channelHandle) {
    // Try multiple sources in order of reliability
    // 1. Check YouTube Data API for business email (most reliable)
    const aboutEmail = await getEmailFromChannelAbout(channelId);
    if (aboutEmail) {
        return {
            email: aboutEmail,
            source: 'youtube_about',
            confidence: 'high'
        };
    }
    // 2. Check recent video descriptions
    const descriptionEmail = await getEmailFromVideoDescriptions(channelId);
    if (descriptionEmail) {
        return {
            email: descriptionEmail,
            source: 'youtube_description',
            confidence: 'medium'
        };
    }
    // 3. Check for website links and scrape them
    const linkEmail = await getEmailFromChannelLinks(channelId);
    if (linkEmail) {
        return {
            email: linkEmail,
            source: 'youtube_links',
            confidence: 'medium'
        };
    }
    return {
        source: 'not_found',
        confidence: 'low'
    };
}
/**
 * Get email from YouTube Channel "About" page
 * Uses YouTube Data API v3
 */
async function getEmailFromChannelAbout(channelId) {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY) {
        console.warn('[YouTube Email] No YouTube API key configured');
        return null;
    }
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&id=${channelId}&key=${YOUTUBE_API_KEY}`);
        if (!response.ok) {
            console.error('[YouTube Email] API error:', response.status);
            return null;
        }
        const data = await response.json();
        if (!data.items || data.items.length === 0) {
            return null;
        }
        const channel = data.items[0];
        // Check for business email in channel description
        const description = channel.snippet?.description || '';
        const email = extractEmailFromText(description);
        if (email) {
            console.log(`[YouTube Email] Found email in channel about: ${email}`);
            return email;
        }
        return null;
    }
    catch (error) {
        console.error('[YouTube Email] Error fetching channel:', error);
        return null;
    }
}
/**
 * Get email from recent video descriptions
 */
async function getEmailFromVideoDescriptions(channelId) {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY)
        return null;
    try {
        // Get recent videos
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelId}&maxResults=5&order=date&type=video&key=${YOUTUBE_API_KEY}`);
        if (!response.ok)
            return null;
        const data = await response.json();
        const videoIds = data.items?.map((item) => item.id.videoId).join(',');
        if (!videoIds)
            return null;
        // Get video details
        const videosResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`);
        if (!videosResponse.ok)
            return null;
        const videosData = await videosResponse.json();
        // Check each video description for emails
        for (const video of videosData.items || []) {
            const description = video.snippet?.description || '';
            const email = extractEmailFromText(description);
            if (email) {
                console.log(`[YouTube Email] Found email in video description: ${email}`);
                return email;
            }
        }
        return null;
    }
    catch (error) {
        console.error('[YouTube Email] Error fetching videos:', error);
        return null;
    }
}
/**
 * Get email from channel links (website scraping)
 */
async function getEmailFromChannelLinks(channelId) {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY)
        return null;
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`);
        if (!response.ok)
            return null;
        const data = await response.json();
        const description = data.items?.[0]?.snippet?.description || '';
        // Extract URLs from description
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = description.match(urlRegex) || [];
        // Try to scrape emails from linked websites
        for (const url of urls.slice(0, 3)) { // Limit to first 3 URLs
            try {
                const email = await scrapeEmailFromWebsite(url);
                if (email) {
                    console.log(`[YouTube Email] Found email on linked website: ${email}`);
                    return email;
                }
            }
            catch (err) {
                // Continue to next URL
                continue;
            }
        }
        return null;
    }
    catch (error) {
        console.error('[YouTube Email] Error checking links:', error);
        return null;
    }
}
/**
 * Scrape email from a website (simple version)
 */
async function scrapeEmailFromWebsite(url) {
    try {
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Verality/1.0; +https://verality.io)'
            }
        });
        clearTimeout(timeout);
        if (!response.ok)
            return null;
        const html = await response.text();
        const email = extractEmailFromText(html);
        return email;
    }
    catch (error) {
        return null;
    }
}
/**
 * Extract email address from text using regex
 */
function extractEmailFromText(text) {
    // Email regex pattern
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = text.match(emailRegex);
    if (!matches || matches.length === 0)
        return null;
    // Filter out common spam/placeholder emails
    const filtered = matches.filter(email => {
        const lower = email.toLowerCase();
        return !lower.includes('example.com') &&
            !lower.includes('test.com') &&
            !lower.includes('noreply') &&
            !lower.includes('donotreply') &&
            !lower.includes('no-reply');
    });
    // Return the first valid email
    return filtered[0] || null;
}
/**
 * Main function: Try YouTube first, fallback to Clay
 */
async function findCreatorEmail(params) {
    const { channelId, channelHandle, platform, useClayFallback = true } = params;
    // Only works for YouTube
    if (platform !== 'youtube') {
        if (useClayFallback) {
            // Use Clay for non-YouTube platforms
            const { clayClient } = await Promise.resolve().then(() => __importStar(require('./clay-client')));
            const clayResult = await clayClient.enrichCreator({
                handle: channelHandle || channelId,
                platform: platform,
                creatorId: channelId,
                userId: 'system'
            });
            return {
                email: clayResult.email || null,
                source: 'clay',
                usedClay: true
            };
        }
        return { email: null, source: 'none', usedClay: false };
    }
    // Step 1: Try YouTube extraction (FREE)
    console.log(`[Email Finder] Trying YouTube extraction for ${channelId}...`);
    const youtubeResult = await extractEmailFromYouTube(channelId, channelHandle);
    if (youtubeResult.email) {
        console.log(`[Email Finder] ✅ Found via YouTube (${youtubeResult.source})`);
        return {
            email: youtubeResult.email,
            source: youtubeResult.source,
            usedClay: false
        };
    }
    // Step 2: Fallback to Clay (PAID)
    if (useClayFallback) {
        console.log(`[Email Finder] YouTube failed, falling back to Clay...`);
        const { clayClient } = await Promise.resolve().then(() => __importStar(require('./clay-client')));
        try {
            const clayResult = await clayClient.enrichCreator({
                handle: channelHandle || channelId,
                platform: 'youtube',
                creatorId: channelId,
                userId: 'system'
            });
            if (clayResult.email) {
                console.log(`[Email Finder] ✅ Found via Clay`);
                return {
                    email: clayResult.email,
                    source: 'clay',
                    usedClay: true
                };
            }
        }
        catch (error) {
            console.error('[Email Finder] Clay error:', error);
        }
    }
    console.log(`[Email Finder] ❌ No email found`);
    return { email: null, source: 'none', usedClay: false };
}
/**
 * Discover creators using the YouTube Data API
 */
async function discoverCreatorsViaYouTube(params) {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY) {
        console.error('[YouTube Discovery] ❌ YOUTUBE_API_KEY is missing from .env.local');
        return { creators: [] };
    }
    const { query, limit = 50, pageToken, location } = params;
    try {
        // 1. Search for channels
        let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=${limit}&key=${YOUTUBE_API_KEY}`;
        // Add region filtering if location provided
        if (location) {
            const regionCode = getRegionCode(location);
            if (regionCode) {
                url += `&regionCode=${regionCode}`;
            }
        }
        if (pageToken) {
            url += `&pageToken=${pageToken}`;
        }
        const searchResponse = await fetch(url);
        if (!searchResponse.ok) {
            const err = await searchResponse.text();
            throw new Error(`YouTube Search API failed: ${err}`);
        }
        const searchData = await searchResponse.json();
        const items = searchData.items || [];
        if (items.length === 0)
            return { creators: [] };
        const channelIds = items.map((item) => item.snippet.channelId).join(',');
        // 2. Get detailed stats for these channels (subscriber counts)
        const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds}&key=${YOUTUBE_API_KEY}`);
        if (!statsResponse.ok)
            return { creators: [] };
        const statsData = await statsResponse.json();
        const channels = statsData.items || [];
        // 3. Map to our discovery format
        const creators = channels.map((c) => ({
            creator_id: c.id,
            handle: c.snippet.customUrl?.replace('@', '') || c.id,
            platform: 'youtube',
            name: c.snippet.title,
            followers: parseInt(c.statistics.subscriberCount || '0'),
            picture: c.snippet.thumbnails?.high?.url || c.snippet.thumbnails?.default?.url,
            location: c.snippet.country || 'Global',
            niche: query // Use the search query as the niche for ranking
        }));
        return {
            creators,
            nextPageToken: searchData.nextPageToken
        };
    }
    catch (error) {
        console.error('[YouTube Discovery] Error:', error);
        return { creators: [] };
    }
}
/**
 * Batch verify YouTube average views for a list of channel IDs.
 * Filters out Shorts (duration < 60s) and calculates a real average.
 */
async function batchVerifyYoutubeViews(channelIds) {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY || channelIds.length === 0)
        return {};
    const results = {};
    try {
        // 1. Get Upload Playlist IDs for all channels
        const channelsResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelIds.join(',')}&key=${YOUTUBE_API_KEY}`);
        if (!channelsResponse.ok)
            return {};
        const channelsData = await channelsResponse.json();
        const uploadPlaylists = {}; // channelId -> playlistId
        channelsData.items?.forEach((c) => {
            const playlistId = c.contentDetails?.relatedPlaylists?.uploads;
            if (playlistId)
                uploadPlaylists[c.id] = playlistId;
        });
        // 2. For each channel, get the last 5 video IDs
        const allVideoIds = [];
        const channelToVideos = {};
        await Promise.all(Object.entries(uploadPlaylists).map(async ([channelId, playlistId]) => {
            try {
                const playlistResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=5&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}`);
                if (playlistResponse.ok) {
                    const playlistData = await playlistResponse.json();
                    const videoIds = playlistData.items?.map((item) => item.contentDetails.videoId) || [];
                    channelToVideos[channelId] = videoIds;
                    allVideoIds.push(...videoIds);
                }
            }
            catch (e) {
                console.error(`Error fetching playlist for ${channelId}:`, e);
            }
        }));
        if (allVideoIds.length === 0)
            return {};
        // 3. Get Video details (Duration and Views) in batches of 50
        const videoStats = {};
        for (let i = 0; i < allVideoIds.length; i += 50) {
            const batch = allVideoIds.slice(i, i + 50);
            const videosResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${batch.join(',')}&key=${YOUTUBE_API_KEY}`);
            if (videosResponse.ok) {
                const videosData = await videosResponse.json();
                videosData.items?.forEach((v) => {
                    const duration = v.contentDetails?.duration || ''; // ISO 8601 duration
                    const views = parseInt(v.statistics?.viewCount || '0');
                    // Simple Short Detection: If duration contains only seconds/small minutes
                    // PT15S, PT59S, etc. or if it's less than 60 seconds.
                    // ISO 8601 duration parsing (rough but effective for Shorts)
                    let isShort = false;
                    if (duration.startsWith('PT')) {
                        const secondsMatch = duration.match(/(\d+)S/);
                        const minutesMatch = duration.match(/(\d+)M/);
                        const hoursMatch = duration.match(/(\d+)H/);
                        const totalSeconds = (parseInt(hoursMatch?.[1] || '0') * 3600) +
                            (parseInt(minutesMatch?.[1] || '0') * 60) +
                            parseInt(secondsMatch?.[1] || '0');
                        if (totalSeconds > 0 && totalSeconds < 60) {
                            isShort = true;
                        }
                    }
                    videoStats[v.id] = { views, isShort };
                });
            }
        }
        // 4. Calculate average for each channel, EXCLUDING Shorts
        Object.entries(channelToVideos).forEach(([channelId, videoIds]) => {
            const longformViews = videoIds
                .map(vid => videoStats[vid])
                .filter(stats => stats && !stats.isShort)
                .map(stats => stats.views);
            if (longformViews.length > 0) {
                const avg = Math.floor(longformViews.reduce((a, b) => a + b, 0) / longformViews.length);
                results[channelId] = avg;
            }
            else {
                // If they ONLY have shorts, maybe the views ARE from shorts
                // But we'll mark it as 0 if we want strictly longform
                results[channelId] = 0;
            }
        });
    }
    catch (error) {
        console.error('[YouTube Views] Batch verification failed:', error);
    }
    return results;
}
/**
 * Helper to map full country names to ISO 3166-1 alpha-2 region codes
 */
function getRegionCode(location) {
    if (!location)
        return undefined;
    // Normalize
    const norm = location.trim().toLowerCase();
    const map = {
        'united states': 'US',
        'usa': 'US',
        'us': 'US',
        'united kingdom': 'GB',
        'uk': 'GB',
        'britain': 'GB',
        'great britain': 'GB',
        'canada': 'CA',
        'australia': 'AU',
        'germany': 'DE',
        'france': 'FR',
        'india': 'IN',
        'brazil': 'BR',
        'japan': 'JP',
        'spain': 'ES',
        'italy': 'IT',
        'mexico': 'MX',
        'netherlands': 'NL',
        'russia': 'RU',
        'south korea': 'KR',
        'turkey': 'TR',
        'sweden': 'SE',
        'switzerland': 'CH',
        'united arab emirates': 'AE',
        'uae': 'AE',
        'belgium': 'BE',
        'austria': 'AT',
        'norway': 'NO',
        'denmark': 'DK',
        'finland': 'FI',
        'ireland': 'IE',
        'new zealand': 'NZ',
        'singapore': 'SG',
        'south africa': 'ZA',
        'poland': 'PL',
        'portugal': 'PT'
    };
    return map[norm];
}
