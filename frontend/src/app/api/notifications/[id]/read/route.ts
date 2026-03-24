import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { Notification } from '@/types';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function PUT(_request: Request, context: RouteParams) {
    try {
        const { id } = await context.params;
        const { data, error } = await supabase
            .from('Notification')
            .update({ read: true })
            .eq('"id"', String(id))
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data as Notification);
    } catch {
        return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
    }
}
