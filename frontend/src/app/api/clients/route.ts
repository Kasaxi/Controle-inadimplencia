import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { ClientCreateInput, Client } from '@/types';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('Client')
            .select('*')
            .order('createdAt', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data as Client[]);
    } catch (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json() as ClientCreateInput;
        const now = new Date().toISOString();
        const generatedId = crypto.randomUUID();

        const { data, error } = await supabase
            .from('Client')
            .insert([{
                "id": generatedId,
                "name": body.name,
                "cpf": body.cpf,
                "contactNumber": body.contactNumber,
                "overdueInstallments": body.overdueInstallments ? Number(body.overdueInstallments) : 0,
                "address": body.address,
                "responsible": body.responsible,
                "observation": body.observation,
                "fileUrl": body.fileUrl,
                "consultationDate": body.consultationDate || null,
                "createdAt": now,
                "updatedAt": now,
            }])
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data as Client, { status: 201 });
    } catch (error) {
        const err = error as Error;
        console.error('Error creating client:', err.message);
        return NextResponse.json({ error: err.message || 'Failed to create client' }, { status: 500 });
    }
}
