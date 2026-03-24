import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: RouteParams) {
    try {
        const { id } = await context.params;
        const { error } = await supabase
            .from('Notification')
            .delete()
            .eq('"id"', String(id));

        if (error) throw error;
        return NextResponse.json({ message: 'Notification deleted' });
    } catch {
        return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }
}
