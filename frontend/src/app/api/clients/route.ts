import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('Client')
            .select('*')
            .order('createdAt', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching clients:', error);
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            name,
            cpf,
            contactNumber,
            overdueInstallments,
            address,
            responsible,
            observation,
            fileUrl,
            consultationDate,
        } = body;

        const now = new Date().toISOString();
        const generatedId = crypto.randomUUID();
        console.log('--- INSERTING CLIENT ---');
        console.log('Generated ID:', generatedId, typeof generatedId);

        const { data, error } = await supabase
            .from('Client')
            .insert([{
                "id": generatedId,
                "name": name,
                "cpf": cpf,
                "contactNumber": contactNumber,
                "overdueInstallments": overdueInstallments ? Number(overdueInstallments) : 0,
                "address": address,
                "responsible": responsible,
                "observation": observation,
                "fileUrl": fileUrl,
                "consultationDate": consultationDate || null,
                "createdAt": now,
                "updatedAt": now,
            }])
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        console.error('Error creating client:');
        console.dir(error, { depth: null });
        return NextResponse.json({ error: error?.message || 'Failed to create client', details: error }, { status: 500 });
    }
}
