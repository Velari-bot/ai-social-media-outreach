/**
 * UTM Parameter Injection Service
 * Auto-injects UTM parameters into email links for conversion attribution
 */

/**
 * UTM parameters for tracking
 */
export interface UTMParams {
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_content?: string;
    utm_term?: string;
}

/**
 * Generate UTM parameters for a campaign
 */
export function generateCampaignUTMs(
    campaignId: string,
    campaignName?: string,
    creatorId?: string
): UTMParams {
    const params: UTMParams = {
        utm_source: 'verality',
        utm_medium: 'email',
        utm_campaign: campaignId
    };

    // Optional: Add campaign name as content
    if (campaignName) {
        params.utm_content = campaignName.toLowerCase().replace(/\s+/g, '_');
    }

    // Optional: Add creator-specific tracking (for future per-creator attribution)
    if (creatorId) {
        params.utm_term = creatorId;
    }

    return params;
}

/**
 * Inject UTM parameters into a URL
 */
export function injectUTMParams(url: string, utmParams: UTMParams): string {
    try {
        const urlObj = new URL(url);

        // Add UTM parameters
        Object.entries(utmParams).forEach(([key, value]) => {
            if (value) {
                urlObj.searchParams.set(key, value);
            }
        });

        return urlObj.toString();
    } catch (error) {
        // If URL parsing fails, return original
        console.warn('[UTM Injection] Invalid URL:', url);
        return url;
    }
}

/**
 * Find and inject UTM parameters into all links in email body
 */
export function injectUTMsIntoEmailBody(
    emailBody: string,
    utmParams: UTMParams
): string {
    // Regular expression to match URLs in text
    // Matches http://, https://, and www. URLs
    const urlRegex = /(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)/gi;

    return emailBody.replace(urlRegex, (match) => {
        // Ensure URL has protocol
        let url = match;
        if (url.startsWith('www.')) {
            url = 'https://' + url;
        }

        return injectUTMParams(url, utmParams);
    });
}

/**
 * Find and inject UTM parameters into HTML email links
 */
export function injectUTMsIntoHTMLEmail(
    htmlBody: string,
    utmParams: UTMParams
): string {
    // Regular expression to match href attributes in HTML
    const hrefRegex = /href=["']([^"']+)["']/gi;

    return htmlBody.replace(hrefRegex, (match, url) => {
        // Skip mailto: and tel: links
        if (url.startsWith('mailto:') || url.startsWith('tel:')) {
            return match;
        }

        // Skip anchor links
        if (url.startsWith('#')) {
            return match;
        }

        const injectedUrl = injectUTMParams(url, utmParams);
        return `href="${injectedUrl}"`;
    });
}

/**
 * Extract all links from email body for tracking
 */
export function extractLinksFromEmail(emailBody: string): string[] {
    const urlRegex = /(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)/gi;
    const matches = emailBody.match(urlRegex) || [];

    return matches.map(url => {
        if (url.startsWith('www.')) {
            return 'https://' + url;
        }
        return url;
    });
}

/**
 * Main function: Process email body and inject UTMs
 */
export function processEmailForUTMs(
    emailBody: string,
    campaignId: string,
    campaignName?: string,
    creatorId?: string,
    isHTML: boolean = false
): {
    processedBody: string;
    utmParams: UTMParams;
    linksFound: string[];
} {
    const utmParams = generateCampaignUTMs(campaignId, campaignName, creatorId);
    const linksFound = extractLinksFromEmail(emailBody);

    const processedBody = isHTML
        ? injectUTMsIntoHTMLEmail(emailBody, utmParams)
        : injectUTMsIntoEmailBody(emailBody, utmParams);

    return {
        processedBody,
        utmParams,
        linksFound
    };
}
