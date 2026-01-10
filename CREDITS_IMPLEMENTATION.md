# Credits Display Implementation

## Overview
Added comprehensive credits tracking and display throughout the application to help users understand their credit balance and usage.

## Credits System
- **1 Credit = 1 Creator** (50 creators = 50 credits)
- Credits are stored in `email_quota_daily` field
- Usage tracked in `email_used_today` field
- Resets daily based on `quota_reset_date`

## Changes Made

### 1. Dashboard Credits Display

#### Header Badge
Added prominent credits display in dashboard header:
```
┌─────────────┐
│  Credits    │
│  450 / 500  │
└─────────────┘
```

**Location:** Top right, next to "New Campaign" button

**Features:**
- Shows remaining credits / total credits
- Large, easy-to-read numbers
- Updates in real-time when account data refreshes

#### State Management
Added to `DashboardMetrics` interface:
- `totalCredits`: Total daily quota (e.g., 500)
- `creditsUsed`: Credits used today
- `creditsRemaining`: Calculated (total - used)

### 2. Creator Request Page

#### Cost Display Enhancement
Updated the cost summary to show:
```
Cost: 1 Credit
      499 remaining
```

**Features:**
- Shows cost for current search
- Shows remaining credits after search
- Helps users plan their searches

### 3. Files Modified

#### `app/dashboard/page.tsx`
- Added credits fields to `DashboardMetrics` interface
- Fetch credits from `userAccount` data
- Display credits badge in header
- Calculate `creditsRemaining = totalCredits - creditsUsed`

#### `app/creator-request/page.tsx`
- Added "remaining" text under cost display
- Uses existing `remainingQuota` calculation

## User Experience Improvements

### Before
- ❌ No visibility into credit balance
- ❌ Users didn't know how many searches they could run
- ❌ Confusing when quota exceeded

### After
- ✅ Clear credits display on dashboard
- ✅ See remaining credits before searching
- ✅ Understand cost vs. available credits
- ✅ Better planning for multiple searches

## Example User Flow

1. **User logs into dashboard**
   - Sees "450 / 500 Credits" in header
   - Knows they have 450 credits available

2. **User goes to Creator Request page**
   - Sets up search for 50 creators
   - Sees "Cost: 1 Credit (450 remaining)"
   - Understands they'll have 449 left after search

3. **User submits search**
   - Credits deducted: 450 → 449
   - Dashboard updates automatically
   - Can see updated balance immediately

## Technical Details

### Credit Calculation
```typescript
const totalCredits = account.email_quota_daily || 0;
const creditsUsed = account.email_used_today || 0;
const creditsRemaining = totalCredits - creditsUsed;
```

### Cost Calculation
```typescript
const callsNeeded = Math.ceil(requestedCreators / 50);
const creditsCost = callsNeeded;
```

**Examples:**
- 50 creators = 1 credit
- 100 creators = 2 credits
- 150 creators = 3 credits

### Quota Exceeded Check
```typescript
const isQuotaExceeded = creditsCost > remainingQuota;
```

When quota exceeded:
- Submit button disabled
- Shows "Quota Exceeded" message
- Prevents wasting API calls

## Future Enhancements

### Potential Additions:
1. **Credit History**
   - Show daily/weekly/monthly usage
   - Track which searches used how many credits

2. **Credit Alerts**
   - Warn when credits running low
   - Suggest upgrading plan

3. **Credit Packages**
   - Allow purchasing additional credits
   - Show pricing per credit

4. **Usage Analytics**
   - Average credits per search
   - Most expensive searches
   - Optimization suggestions

## Testing Checklist

- [x] Dashboard shows correct total credits
- [x] Dashboard shows correct used credits
- [x] Dashboard shows correct remaining credits
- [x] Creator request shows cost correctly
- [x] Creator request shows remaining correctly
- [x] Credits update after search
- [x] Quota exceeded prevents submission
- [x] Credits display formats numbers with commas
