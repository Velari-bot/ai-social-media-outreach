# Creator Discovery and Outreach Service Layer

This service layer implements a production-safe creator discovery and outreach system with aggressive caching and API limit enforcement.

## Architecture

### Core Services

1. **Usage Counter Service** (`usage-counter.ts`)
   - Tracks monthly API usage
   - Enforces safety limits (140,000 discoveries/month, 1,400 reports/month)
   - Prevents quota overruns

2. **Modash Client** (`modash-client.ts`)
   - Wraps Modash Discovery API (high-volume)
   - Wraps Modash Detailed Profile API (low-volume)
   - Automatic quota checking before each call
   - Automatic counter incrementation after successful calls

3. **Clay Client** (`clay-client.ts`)
   - Email/contact enrichment
   - Only called after detailed profile is available
   - Never triggers Modash calls

4. **Creator Service** (`creator-service.ts`)
   - Main orchestrator for creator operations
   - Implements the 5-step flow
   - Handles caching logic

5. **API Logger** (`api-logger.ts`)
   - Logs all API calls for tracking and debugging
   - Non-blocking (failures don't break the flow)

## System Flow

### Step 1: Creator Search
```typescript
import { searchCreators } from '@/lib/services/creator-service';

const creators = await searchCreators({
  userId: 'user-123',
  platform: 'instagram',
  filters: { minFollowers: 10000 },
  requestedCount: 50,
});
```

- Checks local database first
- Only calls Modash Discovery if cache is insufficient
- Stores results with `has_basic_profile = true`
- Never calls detailed profile endpoint

### Step 2: Display Search Results
```typescript
import { getBasicProfile } from '@/lib/services/creator-service';

const creator = await getBasicProfile(creatorId);
```

- Shows only basic profile fields
- No emails or deep analytics
- No API calls

### Step 3: Creator Selection for Outreach
```typescript
import { selectCreatorForOutreach } from '@/lib/services/creator-service';

const creator = await selectCreatorForOutreach({
  creatorId: 123,
  userId: 'user-123',
});
```

- Checks if detailed profile exists
- Fetches from Modash if needed
- Updates `has_detailed_profile = true`
- Increments report counter

### Step 4: Clay Enrichment
```typescript
import { enrichCreatorWithClay } from '@/lib/services/creator-service';

const creator = await enrichCreatorWithClay({
  creatorId: 123,
  userId: 'user-123',
});
```

- Only called after detailed profile is available
- Enriches email/contact data
- Updates `clay_enriched_at`

### Step 5: Outreach
```typescript
import { getCreatorForOutreach } from '@/lib/services/creator-service';

const creator = await getCreatorForOutreach(creatorId);
```

- Uses cached data only
- No API calls

## Safety Guards

### Monthly Limits
- **Discovery**: 140,000/month
- **Detailed Reports**: 1,400/month

### Caching Rules
- Detailed profiles are cached for 30 days
- Never refetch if already cached and recent
- Always check database before API calls

### Error Handling
- Quota exceeded errors return 429 status
- Failed API calls return cached data when available
- All API calls are logged for debugging

## API Routes

### POST `/api/creators/search`
Search for creators with caching.

### GET `/api/creators/[id]`
Get basic profile (no API calls).

### POST `/api/creators/[id]/select`
Select creator for outreach (fetches detailed profile if needed).

### POST `/api/creators/[id]/enrich`
Enrich creator with Clay (after detailed profile).

### GET `/api/usage/quota`
Get current usage and remaining quotas.

## Environment Variables

```env
MODASH_API_KEY=your_modash_api_key
CLAY_API_KEY=your_clay_api_key
```

## Database Schema

See `supabase-schema.sql` for:
- `creators` table
- `search_requests` table
- `usage_counters` table
- `api_call_logs` table

## Important Notes

1. **Never auto-fetch**: Only fetch data after explicit user action
2. **Always check cache first**: Database queries before API calls
3. **Respect quotas**: Safety guards prevent overruns
4. **Log everything**: All API calls are logged for tracking
5. **Fail gracefully**: Return cached data when API calls fail

