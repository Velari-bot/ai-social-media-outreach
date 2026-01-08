
import { NextRequest, NextResponse } from 'next/server';
import { seedAvailability } from '@/lib/booking-service';

export async function POST(request: NextRequest) {
    try {
        // You might want to add auth check here
        await seedAvailability();
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
