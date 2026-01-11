/**
 * Stripe Setup Verification Script
 * Run this to check if your Stripe integration is properly configured
 * 
 * Usage: node verify-stripe-setup.js
 */

require('dotenv').config({ path: '.env.local' });

const checks = {
    passed: [],
    failed: [],
    warnings: []
};

console.log('\n🔍 Verifying Stripe Payment Setup...\n');

// Check 1: Stripe Secret Key
if (process.env.STRIPE_SECRET_KEY) {
    if (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
        checks.passed.push('✅ STRIPE_SECRET_KEY is set (TEST MODE)');
    } else if (process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
        checks.warnings.push('⚠️  STRIPE_SECRET_KEY is LIVE - be careful!');
    } else {
        checks.failed.push('❌ STRIPE_SECRET_KEY has invalid format');
    }
} else {
    checks.failed.push('❌ STRIPE_SECRET_KEY is missing');
}

// Check 2: Webhook Secret
if (process.env.STRIPE_WEBHOOK_SECRET) {
    if (process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
        checks.passed.push('✅ STRIPE_WEBHOOK_SECRET is set');
    } else {
        checks.failed.push('❌ STRIPE_WEBHOOK_SECRET has invalid format (should start with whsec_)');
    }
} else {
    checks.warnings.push('⚠️  STRIPE_WEBHOOK_SECRET is missing (required for webhooks)');
}

// Check 3: Price IDs
const priceIds = {
    'NEXT_PUBLIC_STRIPE_PRICE_BASIC': 'Basic Plan',
    'NEXT_PUBLIC_STRIPE_PRICE_PRO': 'Pro Plan',
    'NEXT_PUBLIC_STRIPE_PRICE_GROWTH': 'Growth Plan',
    'NEXT_PUBLIC_STRIPE_PRICE_SCALE': 'Scale Plan'
};

let priceIdCount = 0;
for (const [envVar, planName] of Object.entries(priceIds)) {
    if (process.env[envVar]) {
        if (process.env[envVar].startsWith('price_')) {
            checks.passed.push(`✅ ${planName} price ID is set`);
            priceIdCount++;
        } else {
            checks.failed.push(`❌ ${planName} price ID has invalid format`);
        }
    } else {
        checks.warnings.push(`⚠️  ${planName} price ID is missing`);
    }
}

// Check 4: Test Stripe Connection
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    console.log('\n📡 Testing Stripe API connection...\n');

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    stripe.products.list({ limit: 1 })
        .then(() => {
            checks.passed.push('✅ Stripe API connection successful');
            printResults();
        })
        .catch((error) => {
            checks.failed.push(`❌ Stripe API connection failed: ${error.message}`);
            printResults();
        });
} else {
    printResults();
}

function printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION RESULTS');
    console.log('='.repeat(60) + '\n');

    if (checks.passed.length > 0) {
        console.log('✅ PASSED:\n');
        checks.passed.forEach(msg => console.log('  ' + msg));
        console.log('');
    }

    if (checks.warnings.length > 0) {
        console.log('⚠️  WARNINGS:\n');
        checks.warnings.forEach(msg => console.log('  ' + msg));
        console.log('');
    }

    if (checks.failed.length > 0) {
        console.log('❌ FAILED:\n');
        checks.failed.forEach(msg => console.log('  ' + msg));
        console.log('');
    }

    console.log('='.repeat(60));

    const total = checks.passed.length + checks.warnings.length + checks.failed.length;
    const score = Math.round((checks.passed.length / total) * 100);

    console.log(`\nScore: ${checks.passed.length}/${total} checks passed (${score}%)\n`);

    if (checks.failed.length === 0 && checks.warnings.length === 0) {
        console.log('🎉 Perfect! Your Stripe integration is fully configured!\n');
        console.log('Next steps:');
        console.log('  1. Start dev server: npm run dev');
        console.log('  2. Start webhook listener: stripe listen --forward-to localhost:3000/api/webhooks/stripe');
        console.log('  3. Test payment: http://localhost:3000/pricing\n');
    } else if (checks.failed.length === 0) {
        console.log('✅ Good! Your Stripe integration is working.\n');
        console.log('Warnings are optional features. Review them if needed.\n');
    } else {
        console.log('⚠️  Action Required: Fix the failed checks above.\n');
        console.log('See PAYMENT_SETUP_COMPLETE.md for detailed setup instructions.\n');
    }
}
