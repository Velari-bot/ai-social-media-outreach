# Creator Discovery System - Implementation Guide

## Overview

This system implements a production-safe creator discovery and outreach backend with aggressive caching and strict API limit enforcement. The system follows a 5-step flow that ensures data is only fetched when explicitly needed.

## Database Setup

### 1. Run the Schema Migration

Execute the SQL in `supabase-schema.sql` to create the required tables:

- `creators` - Stores creator profiles with caching flags
- `search_requests` - Tracks user searches for analytics
- `usage_counters` - Tracks monthly API usage
- `api_call_logs` - Logs all API calls for debugging

### 2. Environment Variables

Create a `.env.local` file with:

```env
MODASH_API_KEY=your_modash_api_key_here
CLAY_API_KEY=your_clay_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## System Flow

### Step 1: Creator Search (`POST /api/creators/search`)

**What it does:**
- Checks local database for cached creators
- Only calls Modash Discovery API if cache is insufficient
- Stores results with `has_basic_profile = true`
- Never calls detailed profile endpoint

**Example Request:**
```typescript
POST /api/creators/search
{
  "platform": "instagram",
  "filters": {
    "minFollowers": 10000,
    "maxFollowers": 100000,
    "minEngagementRate": 2.0
  },
  "requestedCount": 50
}
```

**Example Response:**
```json
{
  "success": true,
  "creators": [...],
  "count": 50
}
```

### Step 2: Display Search Results (`GET /api/creators/[id]`)

**What it does:**
- Returns basic profile data only
- No emails or deep analytics
- No API calls

**Example Request:**
```
GET /api/creators/123
```

**Example Response:**
```json
{
  "success": true,
  "creator": {
    "id": 123,
    "platform": "instagram",
    "handle": "@creator",
    "has_basic_profile": true,
    "has_detailed_profile": false,
    "basic_profile_data": {...}
  }
}
```

### Step 3: Creator Selection for Outreach (`POST /api/creators/[id]/select`)

**What it does:**
- Checks if detailed profile exists
- Fetches from Modash Detailed Profile API if needed
- Updates `has_detailed_profile = true`
- Increments report counter

**Example Request:**
```
POST /api/creators/123/select
```

**Example Response:**
```json
{
  "success": true,
  "creator": {
    "id": 123,
    "platform": "instagram",
    "handle": "@creator",
    "has_detailed_profile": true,
    "detailed_profile_fetched_at": "2024-01-15T10:00:00Z",
    "detailed_profile_data": {...},
    "email_found": false,
    "email": null
  }
}
```

### Step 4: Clay Enrichment (`POST /api/creators/[id]/enrich`)

**What it does:**
- Only called after detailed profile is available
- Enriches email/contact data via Clay
- Updates `clay_enriched_at`

**Example Request:**
```
POST /api/creators/123/enrich
```

**Example Response:**
```json
{
  "success": true,
  "creator": {
    "id": 123,
    "platform": "instagram",
    "handle": "@creator",
    "email_found": true,
    "email": "creator@example.com",
    "clay_enriched_at": "2024-01-15T10:05:00Z"
  }
}
```

### Step 5: Outreach

Uses cached creator data. No API calls allowed.

## Safety Guards

### Monthly Limits
- **Modash Discovery**: 140,000/month
- **Modash Detailed Reports**: 1,400/month

### Caching Rules
- Detailed profiles cached for 30 days
- Never refetch if already cached and recent
- Always check database before API calls

### Quota Checking
The system automatically:
- Checks quota before each API call
- Blocks calls if quota exceeded
- Returns 429 status on quota errors
- Logs all API calls

## Usage Monitoring

### Check Quota Status

```typescript
GET /api/usage/quota
```

**Response:**
```json
{
  "success": true,
  "usage": {
    "month": "2024-01",
    "modash_discoveries_used": 50000,
    "modash_reports_used": 200,
    "remaining_discoveries": 90000,
    "remaining_reports": 1200,
    "discovery_limit": 140000,
    "report_limit": 1400
  }
}
```

## Authentication

The API routes currently use placeholder authentication. You need to implement proper auth:

1. **Option 1: Supabase Auth**
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const supabase = createRouteHandlerClient({ cookies });
const { data: { user } } = await supabase.auth.getUser();
const userId = user?.id;
```

2. **Option 2: JWT Tokens**
Extract user ID from JWT token in Authorization header.

3. **Option 3: Session-based**
Use your existing session management.

Update the API routes in `app/api/creators/**/route.ts` to use your auth method.

## Error Handling

### Quota Exceeded
```json
{
  "error": "Monthly discovery quota exceeded. Cannot make discovery call."
}
```
Status: 429

### Creator Not Found
```json
{
  "error": "Creator not found"
}
```
Status: 404

### Validation Errors
```json
{
  "error": "Invalid platform. Must be instagram, tiktok, or youtube"
}
```
Status: 400

## Service Layer Architecture

### Core Services

1. **`lib/services/usage-counter.ts`**
   - Tracks monthly API usage
   - Enforces safety limits
   - Prevents quota overruns

2. **`lib/services/modash-client.ts`**
   - Wraps Modash Discovery API
   - Wraps Modash Detailed Profile API
   - Automatic quota checking

3. **`lib/services/clay-client.ts`**
   - Email/contact enrichment
   - Only called after detailed profile

4. **`lib/services/creator-service.ts`**
   - Main orchestrator
   - Implements 5-step flow
   - Handles caching logic

5. **`lib/services/api-logger.ts`**
   - Logs all API calls
   - Non-blocking

## Testing the System

### 1. Test Creator Search
```bash
curl -X POST http://localhost:3000/api/creators/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "platform": "instagram",
    "filters": {"minFollowers": 10000},
    "requestedCount": 10
  }'
```

### 2. Test Creator Selection
```bash
curl -X POST http://localhost:3000/api/creators/1/select \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Clay Enrichment
```bash
curl -X POST http://localhost:3000/api/creators/1/enrich \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Check Quota
```bash
curl http://localhost:3000/api/usage/quota
```

## Important Notes

1. **Never auto-fetch**: Only fetch data after explicit user action
2. **Always check cache first**: Database queries before API calls
3. **Respect quotas**: Safety guards prevent overruns
4. **Log everything**: All API calls are logged for tracking
5. **Fail gracefully**: Return cached data when API calls fail

## Modash API Integration

The Modash client expects the following API structure:

### Discovery Endpoint
```
GET /v1/creators/discover?platform={platform}&limit={limit}&...
```

### Detailed Profile Endpoint
```
GET /v1/creators/{creator_id}/profile
```

**Note:** Adjust the endpoints in `lib/services/modash-client.ts` to match your actual Modash API structure.

## Clay API Integration

The Clay client expects the following API structure:

### Enrichment Endpoint
```
POST /v1/people/enrich
Body: { "handle": "...", "platform": "..." }
```

**Note:** Adjust the endpoints in `lib/services/clay-client.ts` to match your actual Clay API structure.

## Next Steps

1. ✅ Database schema created
2. ✅ Service layer implemented
3. ✅ API routes created
4. ⏳ Implement authentication
5. ⏳ Test with real Modash/Clay APIs
6. ⏳ Add error monitoring
7. ⏳ Add rate limiting middleware
8. ⏳ Add request validation middleware

