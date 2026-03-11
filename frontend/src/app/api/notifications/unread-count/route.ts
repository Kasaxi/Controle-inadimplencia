import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { count, error } = await supabase
            .from('Notification')
            .select('*', { count: 'exact', head: true })
            .eq('read', false);

        if (error) throw error;
        return NextResponse.json({ count: count ?? 0 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to get count' }, { status: 500 });
    }
}
