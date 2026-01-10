# Creator Discovery & Enrichment Pipeline

This document explains the flow of the hybrid creator discovery system.

## Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User / Frontend
    participant API as Discovery API
    participant DB as Internal Database (Firestore)
    participant IC as Influencers.club API
    participant C as Clay Enrichment API

    U->>API: Request N creators (Filters: Category, Platform, etc.)
    
    API->>DB: Query existing creators matching filters (Limit N)
    DB-->>API: Return [Found Creators]
    
    Note over API: Calculate remaining = N - count(Found)
    
    ALT if remaining > 0
        API->>IC: Fetch 'remaining' creators (Discovery only, 0.01 credits)
        IC-->>API: Return [Raw Discovery Data]
        
        Note over API: Deduplicate vs DB & Session
        
        API->>DB: Bulk Insert new creators (Status: 'pending')
        DB-->>API: Success
        
        API->>C: Enrich new creators with Contact Data (Email, Phone)
        C-->>API: Return [Enriched Data]
        
        API->>DB: Update creators with contact info (Status: 'enriched')
        DB-->>API: Success
    END
    
    API-->>U: Return exactly N creators (Uniform Schema)
```

## Logic Highlights

1.  **Cost Optimized**: 
    - Queries internal database first to avoid API costs.
    - Only requests discovery fields from Influencers.club (0.01 credits).
    - Only enriches unique, newly discovered creators via Clay.

2.  **Deduplication**: 
    - Prevents duplicate entries using `platform` + `handle` as a unique key.
    - Rejects duplicates before they reach the expensive Clay enrichment step.

3.  **Resilience**: 
    - If Clay enrichment fails, the system still returns the discovery data with a `failed` or `pending` status, ensuring the user gets results regardless of partial outages.

4.  **Uniformity**: 
    - Database creators and new results are mapped to the same TypeScript `Creator` model before reaching the frontend.
