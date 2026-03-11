import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function DELETE(request: Request, context: any) {
    try {
        const { id } = context.params;
        const { error } = await supabase
            .from('Notification')
            .delete()
            .eq('id', String(id));

        if (error) throw error;
        return NextResponse.json({ message: 'Notification deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }
}
