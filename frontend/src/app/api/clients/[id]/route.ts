import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function PUT(request: Request, context: any) {
    try {
        const { id } = context.params;
        const updateData = await request.json();

        if (updateData.overdueInstallments !== undefined) {
            updateData.overdueInstallments = Number(updateData.overdueInstallments);
        }

        const { data, error } = await supabase
            .from('Client')
            .update({
                ...updateData,
                updatedAt: new Date().toISOString()
            })
            .eq('id', String(id))
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error updating client:', error);
        return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: any) {
    try {
        const { id } = context.params;
        const { error } = await supabase
            .from('Client')
            .delete()
            .eq('id', String(id));

        if (error) throw error;
        return NextResponse.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Error deleting client:', error);
        return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
    }
}
