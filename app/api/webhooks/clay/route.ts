import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { verality_id, email, status, clay_row_id } = body;

        // Validate secret if we decide to add one later
        // const secret = request.nextUrl.searchParams.get('secret');
        // if (secret !== process.env.CLAY_WEBHOOK_SECRET) return NextResponse.json({error: 'Unauthorized'}, {status: 401});

        if (!verality_id) {
            return NextResponse.json({ error: 'Missing verality_id' }, { status: 400 });
        }

        console.log(`[Clay Webhook] Received update for creator ${verality_id}:`, { email, status });

        // Update the creator in the database
        // We assume verality_id maps to our 'id' column in 'creators'

        // 2. Perform Update
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://huyhnvklogmrfbctoihf.supabase.co';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseServiceKey) {
            console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
            // Return dummy success to not block Clay, but log heavily
            // Or return 500
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }

        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Prepare update data
        const updateData: any = {
            clay_enriched_at: new Date().toISOString(),
        };

        if (email) {
            updateData.email = email;
            updateData.email_found = true;
        }

        // 2. Perform Update
        // Note: You need to ensure you have a Supabase client that can perform this update.
        // Assuming standard supabase client is available or you use the admin client.

        const { error } = await supabase
            .from('creators')
            .update(updateData)
            .eq('id', verality_id);

        if (error) {
            console.error('[Clay Webhook] Db Update Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Clay Webhook] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
