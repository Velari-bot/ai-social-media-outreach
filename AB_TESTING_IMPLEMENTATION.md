# A/B Testing Implementation

## 🧪 Priority #2: Lightweight A/B Testing (COMPLETE)

This implementation adds **simple, effective A/B testing** to Verality campaigns without overbuilding.

---

## ✅ What Was Implemented

### 1. **One Toggle Per Campaign**

Users can enable A/B testing when creating a campaign with:
- **Variant A** - Subject line + CTA
- **Variant B** - Subject line + CTA

That's it. No complex experiment engine needed.

---

### 2. **Randomization at Send-Time**

When an email is sent:
1. Check if campaign has A/B test enabled
2. Randomly assign variant A or B (50/50 split)
3. Use variant's subject line and CTA
4. Store `ab_test_variant: 'A' | 'B'` in outreach_queue

**This is automatic.** Users don't need to do anything after setup.

---

### 3. **Performance Tracking**

For each campaign with A/B testing, we track:

**Variant A:**
- Emails sent
- Replies received
- Reply rate %
- Interested leads
- Interest rate %

**Variant B:**
- Emails sent
- Replies received
- Reply rate %
- Interested leads
- Interest rate %

---

### 4. **Results Dashboard**

Beautiful side-by-side comparison showing:
- Which variant is winning (highlighted with trophy icon)
- Exact performance metrics
- "AI Learning Your Best Outreach" messaging
- Live updates every 30 seconds

---

## 📁 Files Created

### Type Definitions
1. **`lib/types.ts`** (updated)
   - `ABTestVariant` - Subject line, CTA, optional body
   - `ABTestConfig` - Full A/B test configuration with results
   - Added `ab_test` field to `SearchRequest`

### Backend Services
2. **`lib/services/ab-test-service.ts`**
   - `assignVariant()` - Random A or B assignment
   - `getVariantContent()` - Get variant's subject/CTA/body
   - `calculateABTestResults()` - Compute performance metrics
   - `updateCampaignABTestResults()` - Save results to Firestore

### Email Sender Integration
3. **`lib/services/outreach-sender.ts`** (updated)
   - Checks for A/B test on campaign
   - Assigns variant at send time
   - Applies variant content to email
   - Stores variant in outreach_queue

### API Routes
4. **`app/api/user/campaigns/ab-test-results/route.ts`**
   - GET endpoint for fetching A/B test results
   - Returns calculated metrics for both variants

### Frontend Components
5. **`components/ABTestToggle.tsx`**
   - Toggle to enable/disable A/B testing
   - Input fields for variant A and B
   - Subject line + CTA for each variant
   - Beautiful gradient UI with icons

6. **`components/ABTestResults.tsx`**
   - Side-by-side variant comparison
   - Winner highlighting with trophy icon
   - Performance metrics (sent, replies, reply rate, interested, interest rate)
   - "AI Learning" messaging
   - Auto-refresh every 30 seconds

---

## 🎨 Design Highlights

### ABTestToggle Component
- **Gradient background**: Indigo-to-purple
- **Flask icon**: Science/experimentation theme
- **Toggle switch**: Smooth animation
- **Variant cards**: Blue (A) and Purple (B)
- **Info box**: Indigo gradient with Sparkles icon
- **Messaging**: "AI will learn your best outreach"

### ABTestResults Component
- **Gradient background**: Indigo-to-purple with white
- **Winner highlighting**: Green border + shadow + trophy icon
- **Side-by-side layout**: Easy comparison
- **Color coding**: Blue for replies, Green for interested
- **Insights banner**: Purple gradient with TrendingUp icon
- **Live indicator**: Pulsing dot + "Active" badge

---

## 🔄 How It Works

### Campaign Creation
1. User creates campaign
2. Toggles "A/B Testing" on
3. Enters subject line + CTA for variant A
4. Enters subject line + CTA for variant B
5. Saves campaign with `ab_test` config

### Email Sending
1. Outreach sender picks email to send
2. Checks if campaign has A/B test enabled
3. If yes:
   - Randomly assigns variant A or B
   - Gets variant's subject line and CTA
   - Generates email with variant content
   - Stores variant in `outreach_queue.ab_test_variant`
4. Sends email normally

### Results Tracking
1. User views campaign
2. ABTestResults component loads
3. Fetches results from API
4. API calculates:
   - Sent count per variant (from outreach_queue)
   - Reply count per variant (from email_threads)
   - Interest count per variant (from email_threads where status='interested' or deal_started=true)
5. Displays side-by-side comparison
6. Highlights winner
7. Auto-refreshes every 30 seconds

---

## 💾 Database Schema

### creator_requests Collection
```typescript
{
  // ... existing fields
  ab_test?: {
    enabled: boolean;
    variant_a: {
      subject_line?: string;
      cta_text?: string;
      email_body?: string; // Future: full body override
    };
    variant_b: {
      subject_line?: string;
      cta_text?: string;
      email_body?: string;
    };
    // Results (calculated, not stored initially)
    variant_a_sent?: number;
    variant_b_sent?: number;
    variant_a_replies?: number;
    variant_b_replies?: number;
    variant_a_interested?: number;
    variant_b_interested?: number;
  }
}
```

### outreach_queue Collection
```typescript
{
  // ... existing fields
  ab_test_variant?: 'A' | 'B'; // Assigned at send time
}
```

---

## 📊 Metrics Calculated

### Reply Rate
```
Reply Rate = (Replies / Sent) × 100
```

### Interest Rate
```
Interest Rate = (Interested / Replies) × 100
```

### Winner Determination
- **Reply Rate Winner**: Variant with higher reply %
- **Interest Rate Winner**: Variant with higher interest %
- **Highlighted**: Green border + shadow + trophy icon

---

## 🎯 Why This Matters

### Before
- Users send same email to everyone
- No idea what works better
- Can't optimize over time

### After
- Users test 2 variants automatically
- See which performs better
- **"AI learns your best outreach"** messaging
- Retention: Users come back to tweak and improve

---

## 🚀 User Experience

### Setup (30 seconds)
1. Create campaign
2. Toggle "A/B Testing" on
3. Enter 2 subject lines
4. (Optional) Enter 2 CTAs
5. Launch campaign

### Monitoring (Passive)
- Results update automatically
- No manual tracking needed
- Clear winner highlighted
- "AI Learning" messaging builds trust

### Optimization (Ongoing)
- See which variant wins
- Create new campaign with winning variant
- Test new variations
- Continuous improvement

---

## 💡 Future Enhancements (Not Built Yet)

1. **Auto-apply winner** - Automatically switch all future emails to winning variant
2. **Multi-variate testing** - Test 3+ variants
3. **Full body testing** - Test entire email body, not just subject/CTA
4. **Statistical significance** - Show confidence levels
5. **Historical trends** - Chart performance over time
6. **ML optimization** - AI automatically generates and tests variants

---

## 🧪 Testing

### Manual Testing Steps
1. Create a campaign with A/B testing enabled
2. Set variant A subject: "Quick collaboration"
3. Set variant B subject: "Partnership opportunity"
4. Send at least 20 emails
5. Check outreach_queue - should see mix of variant A and B
6. Have some creators reply (or simulate in Firestore)
7. View campaign results
8. Verify ABTestResults component shows correct metrics
9. Verify winner is highlighted

### Expected Results
- ~50/50 split between variants
- Reply rates: 15-30% typical
- Interest rates: 10-20% of replies typical
- Winner highlighted if difference >2%

---

## 🔧 Technical Notes

- **Randomization**: Uses `Math.random() < 0.5` for 50/50 split
- **Storage**: Variant stored in outreach_queue, not email_threads
- **Calculation**: Results calculated on-demand, not pre-computed
- **Firestore limit**: Can only check 10 threads at once (Firestore `in` query limit)
- **Auto-refresh**: Results update every 30 seconds
- **No caching**: Always fresh data

---

## 📝 Integration Points

### Campaign Creation Page
Add `<ABTestToggle />` component to campaign form:
```tsx
<ABTestToggle 
  value={abTestConfig} 
  onChange={setAbTestConfig} 
/>
```

### Campaign Results Page
Add `<ABTestResults />` component to show performance:
```tsx
<ABTestResults campaignId={campaign.id} />
```

---

## 🎉 Summary

**You now have lightweight A/B testing that:**
- ✅ Takes 30 seconds to set up
- ✅ Runs automatically
- ✅ Shows clear winners
- ✅ Drives retention ("come back to optimize")
- ✅ Enables "AI learns your best outreach" messaging
- ✅ Sets foundation for future ML optimization

**This is exactly what you asked for: simple, effective, not overbuilt.**

Users can now:
1. Test 2 variants per campaign
2. See which performs better
3. Optimize over time
4. Build trust in "AI learning"

**Next step**: Integrate `<ABTestToggle />` into campaign creation UI.
