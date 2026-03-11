import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type');
        const read = searchParams.get('read');

        let query = supabase
            .from('Notification')
            .select('*, client:Client(id, name, cpf)')
            .order('read', { ascending: true })
            .order('createdAt', { ascending: false });

        if (type) query = query.eq('type', type);
        if (read !== null) query = query.eq('read', read === 'true');

        const { data, error } = await query;

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}
