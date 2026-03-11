import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function PUT(request: Request, context: any) {
    try {
        const { id } = await context.params;
        const { data, error } = await supabase
            .from('Notification')
            .update({ read: true })
            .eq('"id"', String(id))
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
    }
}
