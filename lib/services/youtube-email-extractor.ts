/**
 * YouTube Email Extractor
 * Attempts to find creator emails from YouTube data before using Clay
 */

interface YouTubeEmailResult {
    email?: string;
    source: 'youtube_about' | 'youtube_description' | 'youtube_links' | 'not_found';
    confidence: 'high' | 'medium' | 'low';
}

export interface YouTubeDiscoveryResult {
    creator_id: string;
    handle: string;
    platform: 'youtube';
    name: string;
    followers: number;
    picture: string;
    location: string;
    niche?: string;
}

/**
 * Extract email from YouTube channel data
 * This runs BEFORE Clay enrichment to save API costs
 */
export async function extractEmailFromYouTube(
    channelId: string,
    channelHandle?: string
): Promise<YouTubeEmailResult> {

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
async function getEmailFromChannelAbout(channelId: string): Promise<string | null> {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

    if (!YOUTUBE_API_KEY) {
        console.warn('[YouTube Email] No YouTube API key configured');
        return null;
    }

    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&id=${channelId}&key=${YOUTUBE_API_KEY}`
        );

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
    } catch (error) {
        console.error('[YouTube Email] Error fetching channel:', error);
        return null;
    }
}

/**
 * Get email from recent video descriptions
 */
async function getEmailFromVideoDescriptions(channelId: string): Promise<string | null> {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

    if (!YOUTUBE_API_KEY) return null;

    try {
        // Get recent videos
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelId}&maxResults=5&order=date&type=video&key=${YOUTUBE_API_KEY}`
        );

        if (!response.ok) return null;

        const data = await response.json();
        const videoIds = data.items?.map((item: any) => item.id.videoId).join(',');

        if (!videoIds) return null;

        // Get video details
        const videosResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`
        );

        if (!videosResponse.ok) return null;

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
    } catch (error) {
        console.error('[YouTube Email] Error fetching videos:', error);
        return null;
    }
}

/**
 * Get email from channel links (website scraping)
 */
async function getEmailFromChannelLinks(channelId: string): Promise<string | null> {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

    if (!YOUTUBE_API_KEY) return null;

    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`
        );

        if (!response.ok) return null;

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
            } catch (err) {
                // Continue to next URL
                continue;
            }
        }

        return null;
    } catch (error) {
        console.error('[YouTube Email] Error checking links:', error);
        return null;
    }
}

/**
 * Scrape email from a website (simple version)
 */
async function scrapeEmailFromWebsite(url: string): Promise<string | null> {
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

        if (!response.ok) return null;

        const html = await response.text();
        const email = extractEmailFromText(html);

        return email;
    } catch (error) {
        return null;
    }
}

/**
 * Extract email address from text using regex
 */
function extractEmailFromText(text: string): string | null {
    // Email regex pattern
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = text.match(emailRegex);

    if (!matches || matches.length === 0) return null;

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
export async function findCreatorEmail(params: {
    channelId: string;
    channelHandle?: string;
    platform: string;
    useClayFallback?: boolean;
}): Promise<{
    email: string | null;
    source: string;
    usedClay: boolean;
}> {
    const { channelId, channelHandle, platform, useClayFallback = true } = params;

    // Only works for YouTube
    if (platform !== 'youtube') {
        if (useClayFallback) {
            // Use Clay for non-YouTube platforms
            const { clayClient } = await import('./clay-client');
            const clayResult = await clayClient.enrichCreator({
                handle: channelHandle || channelId,
                platform: platform as any,
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
        const { clayClient } = await import('./clay-client');

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
        } catch (error) {
            console.error('[Email Finder] Clay error:', error);
        }
    }

    console.log(`[Email Finder] ❌ No email found`);
    return { email: null, source: 'none', usedClay: false };
}

/**
 * Discover creators using the YouTube Data API
 */
export async function discoverCreatorsViaYouTube(params: {
    query: string;
    limit: number;
}): Promise<YouTubeDiscoveryResult[]> {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY) {
        console.error('[YouTube Discovery] ❌ YOUTUBE_API_KEY is missing from .env.local');
        return [];
    }

    const { query, limit = 50 } = params;

    try {
        // 1. Search for channels
        const searchResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=${limit}&key=${YOUTUBE_API_KEY}`
        );

        if (!searchResponse.ok) {
            const err = await searchResponse.text();
            throw new Error(`YouTube Search API failed: ${err}`);
        }

        const searchData = await searchResponse.json();
        const items = searchData.items || [];

        if (items.length === 0) return [];

        const channelIds = items.map((item: any) => item.snippet.channelId).join(',');

        // 2. Get detailed stats for these channels (subscriber counts)
        const statsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds}&key=${YOUTUBE_API_KEY}`
        );

        if (!statsResponse.ok) return [];

        const statsData = await statsResponse.json();
        const channels = statsData.items || [];

        // 3. Map to our discovery format
        return channels.map((c: any) => ({
            creator_id: c.id,
            handle: c.snippet.customUrl?.replace('@', '') || c.id,
            platform: 'youtube',
            name: c.snippet.title,
            followers: parseInt(c.statistics.subscriberCount || '0'),
            picture: c.snippet.thumbnails?.high?.url || c.snippet.thumbnails?.default?.url,
            location: c.snippet.country || 'Global',
            niche: query // Use the search query as the niche for ranking
        }));

    } catch (error) {
        console.error('[YouTube Discovery] Error:', error);
        return [];
    }
}
