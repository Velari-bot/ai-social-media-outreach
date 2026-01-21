# YouTube-First Email Extraction Strategy

## 🎯 Overview

Your system now implements a **cost-saving email extraction strategy** that tries to find creator emails from YouTube **for FREE** before falling back to Clay API (paid).

## 💰 Cost Savings

- **YouTube Extraction**: FREE (uses YouTube Data API)
- **Clay API**: PAID (~$0.10-0.50 per enrichment)

**Potential Savings**: If 30% of emails are found via YouTube, you save ~$150-750 per 1,000 creators!

---

## 🔄 How It Works

### Step 1: YouTube Extraction (FREE)
The system attempts to find emails from:

1. **Channel "About" Page** → Business email (if public)
2. **Video Descriptions** → Checks last 5 videos for emails
3. **Linked Websites** → Scrapes up to 3 linked websites for contact info

### Step 2: Clay Fallback (PAID)
If YouTube extraction fails, the system falls back to Clay API which:
- Searches LinkedIn, company websites, social media
- Uses multiple data sources for higher accuracy
- Costs money per enrichment

---

## 📊 Tracking & Analytics

The system tracks where each email came from:

```typescript
email_source: 'youtube_about' | 'youtube_description' | 'youtube_links' | 'clay' | 'none'
```

**Console Logs Show**:
```
[Enrichment Stats] YouTube: 15, Clay: 35, Failed: 0
[Enrichment Stats] 💰 Saved 15 Clay API calls!
```

---

## ⚙️ Configuration

### Required: YouTube Data API Key

Add to your `.env` file:
```bash
YOUTUBE_API_KEY=your_youtube_api_key_here
```

**Get API Key**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable "YouTube Data API v3"
4. Create credentials → API Key
5. Copy the key to your `.env`

**Free Quota**: 10,000 units/day (enough for ~1,000-2,000 creators)

---

## 📈 Expected Results

Based on typical YouTube creator behavior:

| Source | Success Rate | Notes |
|--------|--------------|-------|
| YouTube About | 10-15% | Only if creator made email public |
| Video Descriptions | 5-10% | Common for business inquiries |
| Linked Websites | 10-20% | If they have a website with contact page |
| **Total YouTube** | **25-45%** | **FREE** |
| Clay Fallback | 40-60% | **PAID** but higher accuracy |

---

## 🎛️ How to Disable (Use Clay Only)

If you want to use Clay for everything (no YouTube extraction):

In `/lib/services/discovery-pipeline.ts`, change line 335:

```typescript
// Current (YouTube first, then Clay)
useClayFallback: false

// Change to (Clay only)
useClayFallback: true
```

Or comment out the YouTube extraction block entirely.

---

## 🔍 Files Modified

1. **`/lib/services/youtube-email-extractor.ts`** (NEW)
   - YouTube email extraction logic
   - Website scraping
   - Email validation

2. **`/lib/services/discovery-pipeline.ts`** (UPDATED)
   - `bulkEnrichWithClay()` now tries YouTube first
   - Tracks stats and logs savings

3. **`/lib/types.ts`** (UPDATED)
   - Added `email_source` field to `Creator` interface

---

## 🚀 Next Steps

1. **Add YouTube API Key** to `.env`
2. **Test the system** - Run a creator search
3. **Check logs** - See how many emails YouTube finds
4. **Monitor costs** - Compare Clay usage before/after

---

## ⚠️ Important Notes

- **YouTube API has rate limits** (10,000 units/day free)
- **Scraping websites** may be slow (5s timeout per site)
- **Email accuracy** from YouTube is lower than Clay
- **Clay is still used** for non-YouTube platforms (Instagram, TikTok)

---

## 💡 Future Improvements

1. **Cache YouTube results** to avoid re-checking same channels
2. **Add more sources**: Instagram bio, TikTok bio, etc.
3. **Parallel processing** for faster extraction
4. **Email verification** to check if emails are valid before saving
