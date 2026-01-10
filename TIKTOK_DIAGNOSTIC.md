# TikTok Creator Search - Diagnostic Summary

## Issue
TikTok creator searches return 0 results despite the API returning a raw count of 17.5M matches.

## Root Cause Analysis

### What's Working ✅
1. **API Connectivity**: Successfully connecting to Influencer Club API
2. **Authentication**: API key is valid (504 credits remaining)
3. **TikTok Data Availability**: API returns 17.5M total matches for "Lifestyle" category
4. **API Response**: Returns 50 accounts per request with valid profile data
5. **Data Normalization**: Correctly extracting followers and engagement_percent from API response

### What's NOT Working ❌
1. **API-Level Filtering**: The `followers_min` filter does NOT work at the API level
   - Tested with `followers_min: "10000"` - same results as without filter
   - API ignores this parameter completely
   
2. **Potential Local Filtering Issue**: Need to verify if local filtering is too strict

## API Response Structure (Confirmed)
```json
{
  "total": 17512257,
  "limit": 50,
  "accounts": [
    {
      "user_id": "SM2qMYsBosWpkmUN62hV",
      "profile": {
        "full_name": "ESPN MMA",
        "username": "espnmma",
        "followers": 6515151,
        "engagement_percent": 7.285580048328828,
        "picture": "https://..."
      }
    }
  ],
  "credits_left": 504.41
}
```

## Current Implementation

### Discovery Pipeline Flow
1. **Internal DB Query** - Checks existing creators first
2. **External API Call** - Fetches from Influencer Club if needed
   - For TikTok: Fetches 3x requested amount (up to 150) to account for strict filtering
3. **Normalization** - Converts API response to standard format
   - `engagement_percent` (7.28) → `engagement_rate` (0.0728)
   - Handles multiple field name variations
4. **Local Filtering** - Applies follower and engagement filters
   - Lenient: Allows creators with 0 followers/engagement (missing data)
   - Filters out creators below thresholds

### Filter Mapping
```typescript
// Sent to API (currently ignored by API)
filters.followers_min = String(minFollowers);
filters.min_followers = Number(minFollowers);
filters.followers = { min: Number(minFollowers) };

// Applied locally after API returns
if (minFollowers && followers > 0 && followers < minFollowers) return false;
```

## Next Steps to Resolve

### 1. Verify Local Filtering Logic
- Added debug logging to show:
  - Sample creators BEFORE filtering (first 3)
  - Filter thresholds being applied
  - Number of creators AFTER filtering
  
### 2. Test with Real User Criteria
Run a search with:
- Platform: TikTok
- Category: Lifestyle  
- Min Followers: 1000
- Min Engagement: 1%
- Results: 50

### 3. Monitor Console Logs
Look for:
```
[InfluencerClub] Official API Query: {...}
[InfluencerClub] Debug Sample: espnmma - followers: 6515151, ER: 7.29%
[InfluencerClub] Raw Return: 50 / Total Matches: 17512257
[InfluencerClub] Sample creators BEFORE filtering:
  1. espnmma - Followers: 6515151, ER: 7.29%
  2. ...
[InfluencerClub] Filtering locally: minFollowers=1000, minEngagement=1%
[InfluencerClub] Post-Filter Return: X (from 50)
```

## Improvements Made

### 1. Enhanced TikTok Discovery
- Increased fetch limit for TikTok to 3x requested (max 150)
- Prevents local filtering from eliminating all results

### 2. Robust Data Normalization
- Handles multiple field name variations:
  - `followers` / `followers_count` / `p.followers`
  - `engagement_percent` / `engagement_rate` / `p.engagement_rate`
  - `full_name` / `name` / `fullname` / `username`

### 3. Lenient Filtering
- Allows creators with 0 followers (likely missing data)
- Allows creators with 0 engagement (likely missing data)
- Prevents zero results from incomplete API data

### 4. Comprehensive Logging
- API request/response details
- Sample creator data
- Filter thresholds
- Pre/post-filter counts

## UI Improvements

### Creator Request Page
- Added "Any Engagement (Recommended)" option (0%)
- Improved form contrast (black labels)
- Better warning for keyword + category combination
- Changed "Results" label to "Num Results"

### Dashboard
- Fixed "View Results" overlap on campaign cards
- Improved text contrast (black instead of gray)
- Personalized greeting with user's name
- Green status indicator for active outreach

## Files Modified
1. `lib/services/influencer-club-client.ts` - Enhanced normalization & logging
2. `lib/services/discovery-pipeline.ts` - Increased TikTok fetch limit
3. `app/creator-request/page.tsx` - UI improvements
4. `app/dashboard/page.tsx` - UI polish
5. `scripts/debug-tiktok.js` - Diagnostic tool

## Expected Outcome
With these changes, TikTok searches should now:
1. Fetch 150 creators from API (instead of 50)
2. Apply lenient local filtering
3. Return 50+ valid creators matching user criteria
4. Provide detailed console logs for debugging
