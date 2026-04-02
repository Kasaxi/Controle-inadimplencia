import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { ClientCreateInput, Client } from '@/types';

const DEFAULT_PAGE_SIZE = 20;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE)), 100);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status');
        const criticalThreshold = parseInt(searchParams.get('criticalThreshold') || '2');
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';
        
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('Client')
            .select('*', { count: 'exact' });

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            query = query.or(`name.ilike.%${searchLower}%,cpf.ilike.%${searchLower}%,responsible.ilike.%${searchLower}%`);
        }

        // Apply status filter
        if (status === 'overdue') {
            query = query.gt('overdueInstallments', 0);
        } else if (status === 'current') {
            query = query.eq('overdueInstallments', 0);
        } else if (status === 'critical') {
            query = query.gte('overdueInstallments', criticalThreshold);
        } else if (status === 'new') {
            query = query.eq('isNewClient', true);
        }

        const { data, error, count } = await query
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(from, to);

        if (error) throw error;

        return NextResponse.json({
            data: data as Client[],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });
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
                "isNewClient": body.isNewClient === true,
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
