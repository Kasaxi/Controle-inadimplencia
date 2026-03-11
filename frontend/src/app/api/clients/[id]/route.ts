import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function PUT(request: Request, context: any) {
    try {
        const { id } = context.params;
        const updateData = await request.json();

        if (updateData.overdueInstallments !== undefined) {
            updateData.overdueInstallments = Number(updateData.overdueInstallments);
        }

        if (updateData.consultationDate) {
            updateData.consultationDate = new Date(updateData.consultationDate).toISOString();
        }

        // Map the payload to strictly quoted keys for Prisma-created SQL column compatibility
        const mappedUpdate: any = {
            "updatedAt": new Date().toISOString()
        };
        
        const validKeys = ['name', 'cpf', 'contactNumber', 'overdueInstallments', 'address', 'responsible', 'observation', 'fileUrl', 'consultationDate', 'alertStatus'];
        
        validKeys.forEach(key => {
            if (updateData[key] !== undefined) {
                mappedUpdate[String(key)] = updateData[key];
            }
        });

        const { data, error } = await supabase
            .from('Client')
            .update(mappedUpdate)
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
