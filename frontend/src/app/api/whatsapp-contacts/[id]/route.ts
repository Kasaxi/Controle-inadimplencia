import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: RouteParams) {
    try {
        const { id } = await context.params;
        const { error } = await supabase
            .from('WhatsAppContact')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ message: 'Contact deleted successfully' });
    } catch (error) {
        console.error('Error deleting WhatsApp contact:', error);
        return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
    }
}
