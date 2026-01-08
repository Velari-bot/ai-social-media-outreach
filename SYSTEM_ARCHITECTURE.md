# Creator Discovery System - Architecture Overview

## System Design Principles

1. **Cache-First Approach**: Always check database before making API calls
2. **Explicit User Actions**: Never auto-fetch data; only fetch on user request
3. **Quota Protection**: Enforce monthly limits before every API call
4. **Comprehensive Logging**: Track all API calls for debugging and analytics
5. **Graceful Degradation**: Return cached data when API calls fail

## Database Schema

### `creators` Table
Stores creator profiles with caching metadata:
- Basic profile data (from Modash Discovery)
- Detailed profile data (from Modash Detailed Profile)
- Email data (from Clay enrichment)
- Flags: `has_basic_profile`, `has_detailed_profile`, `email_found`
- Timestamps: `detailed_profile_fetched_at`, `clay_enriched_at`

### `search_requests` Table
Tracks user searches for analytics and cache optimization:
- User ID, platform, filters (JSON), filters hash
- Requested count

### `usage_counters` Table
Monthly API usage tracking:
- Month (YYYY-MM format)
- `modash_discoveries_used` (limit: 140,000/month)
- `modash_reports_used` (limit: 1,400/month)

### `api_call_logs` Table
Audit trail for all API calls:
- Provider (modash/clay)
- Action type
- Reason/context
- Creator ID, User ID
- Timestamp

## Service Layer Structure

```
lib/services/
├── index.ts              # Main exports
├── usage-counter.ts      # Quota management
├── api-logger.ts         # API call logging
├── modash-client.ts      # Modash API wrapper
├── clay-client.ts        # Clay API wrapper
└── creator-service.ts    # Main orchestrator
```

## API Routes

```
app/api/
├── creators/
│   ├── search/route.ts           # Step 1: Search creators
│   ├── [id]/route.ts             # Step 2: Get basic profile
│   ├── [id]/select/route.ts      # Step 3: Select for outreach
│   └── [id]/enrich/route.ts      # Step 4: Clay enrichment
└── usage/
    └── quota/route.ts            # Check usage quotas
```

## Flow Diagram

```
User Search Request
    ↓
[Step 1] Check Cache
    ├─ Cache Hit → Return cached creators
    └─ Cache Miss → Call Modash Discovery
                    ↓
                    Store results
                    ↓
                    Return combined results
    ↓
[Step 2] Display Results (Basic Profile Only)
    ↓
User Selects Creator
    ↓
[Step 3] Check has_detailed_profile
    ├─ True → Return cached detailed profile
    └─ False → Call Modash Detailed Profile
                ↓
                Store detailed profile
                ↓
                Return detailed profile
    ↓
[Step 4] Check email_found
    ├─ True → Return email
    └─ False → Call Clay Enrichment
                ↓
                Store email
                ↓
                Return enriched data
    ↓
[Step 5] Outreach (Use Cached Data Only)
```

## Safety Mechanisms

### Pre-Call Checks
- ✅ Quota validation before every Modash call
- ✅ Cache existence check before API calls
- ✅ 30-day recency check for detailed profiles

### Post-Call Actions
- ✅ Automatic counter incrementation
- ✅ API call logging
- ✅ Error handling with fallback to cache

### Error Handling
- Quota exceeded → 429 status
- API failure → Return cached data if available
- Validation errors → 400 status
- Not found → 404 status

## Caching Strategy

### Level 1: Search Cache
- Check `search_requests` for similar searches
- Use `filters_hash` for matching

### Level 2: Creator Cache
- Check `creators` table for existing profiles
- Match by platform and handle

### Level 3: Profile Cache
- Basic profiles: Always cached after discovery
- Detailed profiles: Cached for 30 days
- Email data: Cached after Clay enrichment

## API Integration Points

### Modash API
**Discovery Endpoint:**
- High volume (up to 140,000/month)
- Called only when cache is insufficient
- Returns basic creator data

**Detailed Profile Endpoint:**
- Low volume (up to 1,400/month)
- Called only on explicit user selection
- Returns full profile + analytics

### Clay API
**Enrichment Endpoint:**
- Called only after detailed profile exists
- Enriches email/contact data
- Never triggers Modash calls

## Monitoring & Observability

### Usage Tracking
- Monthly counters in `usage_counters` table
- Real-time quota checking via `/api/usage/quota`

### API Call Logging
- All calls logged to `api_call_logs`
- Includes provider, action, reason, timestamps

### Error Tracking
- Errors logged to console
- API errors return appropriate HTTP status codes
- Quota errors return 429 with descriptive message

## Performance Optimizations

1. **Database Indexes**
   - `creators(platform, handle)` - Fast lookups
   - `creators(modash_creator_id)` - Profile fetching
   - `search_requests(filters_hash)` - Cache matching

2. **Query Optimization**
   - Limit queries to requested count
   - Use upsert to avoid duplicates
   - Order by creation date for relevance

3. **Caching Strategy**
   - Aggressive caching at every level
   - 30-day TTL for detailed profiles
   - Permanent cache for basic profiles

## Security Considerations

1. **Row Level Security (RLS)**
   - Users can only see their own search requests
   - Creators are publicly readable (for sharing)
   - Usage counters are readable by all

2. **API Key Management**
   - Store keys in environment variables
   - Never expose keys in client code
   - Use server-side only for API calls

3. **Input Validation**
   - Validate platform enum
   - Validate filter structure
   - Validate requested count limits

## Scalability Considerations

1. **Database**
   - Indexes on frequently queried columns
   - Partition `api_call_logs` by month if needed
   - Consider read replicas for heavy read workloads

2. **API Rate Limiting**
   - Current: Monthly limits enforced
   - Future: Add per-user rate limiting
   - Future: Add per-endpoint rate limiting

3. **Caching**
   - Current: Database-level caching
   - Future: Add Redis for hot data
   - Future: Add CDN for static profile data

## Future Enhancements

1. **Advanced Caching**
   - Redis for hot data
   - CDN for profile images
   - In-memory cache for frequently accessed creators

2. **Analytics**
   - Track search patterns
   - Analyze cache hit rates
   - Monitor API usage trends

3. **Optimization**
   - Batch API calls where possible
   - Parallel processing for multiple creators
   - Background jobs for enrichment

4. **Features**
   - Search result ranking
   - Filter-based matching for cache
   - Bulk operations support

