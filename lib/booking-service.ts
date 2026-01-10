import { db } from './firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { addDays, format, parse, set, startOfDay } from 'date-fns';
import { AvailabilitySlot, BookingDetails } from './types';

const COLLECTION_AVAILABILITY = 'availability';
const COLLECTION_BOOKINGS = 'bookings';

// Helper to generate slots (seeded for demo purposes if empty)
export async function seedAvailability(daysToSeed = 14) {
    if (!db) {
        console.warn('Skipping availability seeding: Database not initialized.');
        return;
    }
    const snapshot = await db.collection(COLLECTION_AVAILABILITY).limit(1).get();

    if (!snapshot.empty) return; // Already seeded or has data

    console.log('Seeding availability...');
    const batch = db.batch();
    const today = new Date();

    for (let i = 0; i < daysToSeed; i++) {
        const currentDate = addDays(today, i);

        // Generate slots for every day including weekends

        const dateStr = format(currentDate, 'yyyy-MM-dd');

        // Create 30-minute slots from 9 AM to 5 PM
        for (let hour = 9; hour < 17; hour++) {
            // Slot 1: 00-30
            const start1 = set(currentDate, { hours: hour, minutes: 0, seconds: 0, milliseconds: 0 });
            const end1 = set(currentDate, { hours: hour, minutes: 30, seconds: 0, milliseconds: 0 });

            const docRef1 = db.collection(COLLECTION_AVAILABILITY).doc();
            batch.set(docRef1, {
                date: dateStr,
                startTime: start1.toISOString(),
                endTime: end1.toISOString(),
                isBooked: false,
                createdAt: FieldValue.serverTimestamp(),
            });

            // Slot 2: 30-60
            const start2 = set(currentDate, { hours: hour, minutes: 30, seconds: 0, milliseconds: 0 });
            const end2 = set(currentDate, { hours: hour + 1, minutes: 0, seconds: 0, milliseconds: 0 });

            const docRef2 = db.collection(COLLECTION_AVAILABILITY).doc();
            batch.set(docRef2, {
                date: dateStr,
                startTime: start2.toISOString(),
                endTime: end2.toISOString(),
                isBooked: false,
                createdAt: FieldValue.serverTimestamp(),
            });
        }
    }

    await batch.commit();
    console.log('Availability seeded.');
}

export async function getAvailability(startDate: string, endDate: string) {
    if (!db) {
        // Fallback for development if Firebase is not configured
        if (process.env.NODE_ENV === 'development') {
            console.warn('Firebase not initialized. Returning mock availability data for development.');
            const mockSlots: AvailabilitySlot[] = [];
            const today = new Date();

            // Create 3 days of mock slots
            for (let i = 0; i < 3; i++) {
                const date = addDays(today, i + 1);
                const dateStr = format(date, 'yyyy-MM-dd');

                for (let hour = 10; hour < 15; hour++) {
                    const startTime = set(date, { hours: hour, minutes: 0 }).toISOString();
                    const endTime = set(date, { hours: hour, minutes: 30 }).toISOString();

                    mockSlots.push({
                        id: `mock-${dateStr}-${hour}`,
                        date: dateStr,
                        startTime,
                        endTime,
                        isBooked: false
                    });
                }
            }
            return mockSlots;
        }
        throw new Error('Database not initialized. Check FIREBASE_SERVICE_ACCOUNT environment variable.');
    }
    // Ensure seeded - REMOVED to prevent "zombie slots" when admin deletes all slots.
    // await seedAvailability();

    // Query without 'isBooked' filter to avoid composite index requirement
    const snapshot = await db.collection(COLLECTION_AVAILABILITY)
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .orderBy('date')
        // .orderBy('startTime') // Removed to avoid composite index error
        .get();

    const slots: AvailabilitySlot[] = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        // Filter in memory
        if (data.isBooked === false) {
            slots.push({
                id: doc.id,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                isBooked: data.isBooked,
            });
        }
    });

    slots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    return slots;
}

export async function bookSlot(slotId: string, details: BookingDetails) {
    // Run as transaction to prevent double booking
    return await db.runTransaction(async (transaction) => {
        const slotRef = db.collection(COLLECTION_AVAILABILITY).doc(slotId);
        const slotDoc = await transaction.get(slotRef);

        if (!slotDoc.exists) {
            throw new Error('Slot not found');
        }

        const slotData = slotDoc.data();
        if (slotData?.isBooked) {
            throw new Error('Slot already booked');
        }

        // Create booking
        const bookingRef = db.collection(COLLECTION_BOOKINGS).doc();
        const bookingData = {
            ...details,
            slotId,
            status: 'confirmed',
            createdAt: FieldValue.serverTimestamp(),
        };

        transaction.set(bookingRef, bookingData);
        transaction.update(slotRef, { isBooked: true });

        return { bookingId: bookingRef.id, ...bookingData };
    });
}
