
import { NextRequest, NextResponse } from 'next/server';
import { getAvailability } from '@/lib/booking-service';
import { addDays, format } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const today = new Date();

        // Default to today and 14 days ahead if not specified
        const startDate = searchParams.get('startDate') || format(today, 'yyyy-MM-dd');
        const endDate = searchParams.get('endDate') || format(addDays(today, 14), 'yyyy-MM-dd');

        const slots = await getAvailability(startDate, endDate);

        return NextResponse.json({ slots });
    } catch (error: any) {
        console.error('Error fetching availability:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
