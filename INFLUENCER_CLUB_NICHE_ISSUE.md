# Influencer Club API - Niche Filtering Issue

## Problem
The Influencer Club Discovery API (`POST /public/v1/discovery/`) is **not respecting niche/category/keyword filters**.

## Evidence
Tested multiple payload variations with niche="Baseball", category="Sports", keyword="baseball", etc.
All requests return the same random influencers (@alexconsani, @bhagyabro, @kay.dudley) who are fashion/lifestyle creators, NOT baseball-related.

## Tested Payloads
1. ✅ API returns 200 OK
2. ❌ Niche filter ignored - returns random creators
3. ❌ Category filter ignored
4. ❌ Keyword filter ignored  
5. ❌ Search parameter ignored

## Current Status
- API Key: Valid (returns 200 OK)
- Follower filters: Working correctly
- Platform filter: Working correctly
- **Niche/Category/Keyword filters: NOT WORKING**

## Next Steps
1. Contact Influencer Club support for correct niche filtering syntax
2. Ask for updated API documentation
3. Verify if niche filtering requires a different endpoint or premium tier

## Workaround Options
1. Fetch broad results and filter client-side (wastes API credits)
2. Use a different discovery API that respects niche filters
3. Wait for Influencer Club to fix their API

## Test File
Run `node test-niche-variations.js` to reproduce the issue.

---
**Date:** 2026-01-13  
**API Endpoint:** https://api-dashboard.influencers.club/public/v1/discovery/  
**API Key Status:** Valid
