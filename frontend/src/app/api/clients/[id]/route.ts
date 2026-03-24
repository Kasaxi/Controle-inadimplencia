import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { ClientUpdateInput, Client } from '@/types';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteParams) {
    try {
        const { id } = await context.params;
        const updateData = await request.json() as ClientUpdateInput;

        if (updateData.overdueInstallments !== undefined) {
            updateData.overdueInstallments = Number(updateData.overdueInstallments);
        }

        if (updateData.consultationDate) {
            updateData.consultationDate = new Date(updateData.consultationDate).toISOString();
        }

        const mappedUpdate: Record<string, unknown> = {
            "updatedAt": new Date().toISOString()
        };
        
        const validKeys: (keyof ClientUpdateInput)[] = ['name', 'cpf', 'contactNumber', 'overdueInstallments', 'address', 'responsible', 'observation', 'fileUrl', 'consultationDate', 'alertStatus'];
        
        validKeys.forEach(key => {
            if (updateData[key] !== undefined) {
                mappedUpdate[key] = updateData[key];
            }
        });

        const { data, error } = await supabase
            .from('Client')
            .update(mappedUpdate)
            .eq('id', String(id))
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data as Client);
    } catch (error) {
        const err = error as Error;
        console.error('Error updating client:', err.message);
        return NextResponse.json({ error: err.message || 'Failed to update client' }, { status: 500 });
    }
}

export async function DELETE(_request: Request, context: RouteParams) {
    try {
        const { id } = await context.params;
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
