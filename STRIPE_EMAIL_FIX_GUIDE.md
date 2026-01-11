# Stripe Email Connection Fix - Testing Guide

## What Was Fixed

### Issue 1: ENHANCED_CREATOR_CARD.tsx Errors
- **Problem**: The file was a code snippet, not a complete component, causing TypeScript errors
- **Solution**: Removed the snippet file as the functionality is already implemented in the dashboard

### Issue 2: Email Not Connected to Stripe with Google OAuth
- **Problem**: When users sign up with Google OAuth, their email wasn't being linked to Stripe customers
- **Solution**: Implemented a three-part fix:
  1. **Checkout Enhancement**: Added `customer_email` to Stripe checkout sessions
  2. **Pricing Page Update**: Now passes user email to checkout API
  3. **Automatic Linking**: Created `/api/user/link-stripe` endpoint that automatically links existing Stripe customers by email

## How It Works Now

### For New Users (Going Forward)
1. User signs up with Google OAuth
2. User goes to pricing page and selects a plan
3. Checkout session is created with their email pre-filled
4. Stripe creates customer with correct email
5. Webhook updates user account with Stripe customer ID

### For Existing Users (Retroactive Fix)
1. User logs in with Google OAuth
2. Dashboard loads and checks if user has `stripeCustomerId`
3. If not, calls `/api/user/link-stripe` in the background
4. API searches Stripe for customer with matching email
5. If found, links customer to user account
6. If customer has active subscription, updates user's plan and quota

## Testing Instructions

### Test 1: New User Flow
1. **Create a new account** with Google OAuth
2. **Go to pricing page** (`/pricing`)
3. **Select a plan** (use Stripe test mode)
4. **Complete checkout** with test card: `4242 4242 4242 4242`
5. **Verify**:
   - User is redirected to dashboard
   - Credits show correct quota for selected plan
   - Check Firestore: user document should have `stripeCustomerId` and `stripeSubscriptionId`

### Test 2: Existing User Linking
1. **Find a user** who has a Stripe subscription but no `stripeCustomerId` in Firestore
2. **Log in** as that user
3. **Go to dashboard**
4. **Check console** for "Stripe customer linked: cus_xxxxx" message
5. **Verify**:
   - User's plan and quota are updated
   - Firestore document now has `stripeCustomerId`
   - Credits display correctly

### Test 3: Google OAuth Email Matching
1. **Create Stripe customer** manually with email `test@example.com`
2. **Sign up** with Google using `test@example.com`
3. **Navigate to dashboard**
4. **Verify**:
   - Console shows successful linking
   - User account is connected to Stripe customer

## Checking Stripe Customer Linking

### In Stripe Dashboard
1. Go to Stripe Dashboard → Customers
2. Search for customer by email
3. Check "Metadata" section - should have `userId` field

### In Firestore
1. Go to Firebase Console → Firestore
2. Navigate to `user_accounts` collection
3. Find user document
4. Check for these fields:
   - `stripeCustomerId`: Should be `cus_xxxxx`
   - `stripeSubscriptionId`: Should be `sub_xxxxx` (if subscribed)
   - `plan`: Should match subscription plan
   - `email_quota_daily`: Should match plan quota

## API Endpoints

### `/api/checkout` (Updated)
**Request:**
```json
{
  "priceId": "price_xxxxx",
  "planName": "Pro",
  "userId": "firebase_uid",
  "userEmail": "user@example.com"  // NEW
}
```

### `/api/user/link-stripe` (New)
**Request:**
```
POST /api/user/link-stripe
Authorization: Bearer <firebase_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Stripe customer linked and subscription activated",
  "customerId": "cus_xxxxx",
  "plan": "pro",
  "quota": 100
}
```

## Troubleshooting

### User Not Getting Linked
1. Check that user's email in Firebase Auth matches Stripe customer email exactly
2. Verify Stripe API key is correct in `.env.local`
3. Check browser console for errors
4. Check server logs for API errors

### Quota Not Updating
1. Verify webhook is properly configured
2. Check that `STRIPE_WEBHOOK_SECRET` is set correctly
3. Test webhook manually in Stripe Dashboard
4. Check Firestore rules allow updates to `user_accounts`

### Email Not Pre-filled in Checkout
1. Verify user is logged in before clicking "Get Started"
2. Check that `userEmail` state is populated in pricing page
3. Verify Firebase Auth has email for the user

## Files Modified

1. `app/api/checkout/route.ts` - Added customer_email support
2. `app/pricing/page.tsx` - Captures and passes user email
3. `app/dashboard/page.tsx` - Automatic Stripe linking on load
4. `app/api/user/link-stripe/route.ts` - New endpoint for linking

## Next Steps

1. **Test thoroughly** with both new and existing users
2. **Monitor logs** for any linking errors
3. **Consider adding** a manual "Link Stripe Account" button in settings
4. **Add analytics** to track how many users are successfully linked
