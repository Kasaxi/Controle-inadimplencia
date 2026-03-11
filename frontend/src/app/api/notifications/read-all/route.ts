import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function PUT() {
    try {
        const { error } = await supabase
            .from('Notification')
            .update({ read: true })
            .eq('read', false);

        if (error) throw error;
        return NextResponse.json({ message: 'All notifications marked as read' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 500 });
    }
}
