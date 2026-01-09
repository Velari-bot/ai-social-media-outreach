import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { seedAvailability } from '@/lib/booking-service';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        console.log("Starting seed process...");

        // 1. Seed Availability Slots (existing)
        await seedAvailability();

        // 2. Seed Users (for Total Users and MRR)
        console.log("Seeding users...");
        const userPlans = ['free', 'basic', 'pro', 'growth', 'enterprise'];
        const userRoles = ['user', 'user', 'user', 'affiliate', 'admin'];

        const usersBatch = db.batch();
        // Create 25 dummy users
        for (let i = 0; i < 25; i++) {
            const userRef = db.collection('users').doc(`seed_user_${i}`);
            const plan = userPlans[Math.floor(Math.random() * userPlans.length)];
            const role = userRoles[Math.floor(Math.random() * userRoles.length)];

            usersBatch.set(userRef, {
                email: `user${i}@example.com`,
                displayName: `User ${i}`,
                photoURL: null,
                createdAt: new Date().toISOString(),
                plan: plan,
                role: role,
                stripeCustomerId: `cus_seed_${i}`,
                email_quota_daily: 100,
                email_used_today: Math.floor(Math.random() * 50)
            });
        }
        await usersBatch.commit();

        // 3. Seed Bookings (for Booked Calls Week)
        console.log("Seeding bookings...");
        const bookingsBatch = db.batch();
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday

        // Create 15 dummy bookings for this week and next
        for (let i = 0; i < 15; i++) {
            const bookingRef = db.collection('bookings').doc(`seed_booking_${i}`);
            const bookingDate = new Date(startOfWeek);
            bookingDate.setDate(bookingDate.getDate() + Math.floor(Math.random() * 14)); // Random day in next 2 weeks

            bookingsBatch.set(bookingRef, {
                name: `Lead ${i}`,
                email: `lead${i}@company.com`,
                company: `Company ${i}`,
                date: bookingDate.toISOString().split('T')[0],
                time: "10:00",
                status: i % 3 === 0 ? 'completed' : 'scheduled',
                createdAt: new Date().toISOString()
            });
        }
        await bookingsBatch.commit();

        return NextResponse.json({ success: true, message: "Database seeded successfully with Users, Bookings, and Slots." });
    } catch (error: any) {
        console.error("Seeding error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
