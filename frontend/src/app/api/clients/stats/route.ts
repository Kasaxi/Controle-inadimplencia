import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';

        // Get total count
        let countQuery = supabase
            .from('Client')
            .select('*', { count: 'exact', head: true });

        if (search) {
            const searchLower = search.toLowerCase();
            countQuery = countQuery.or(`name.ilike.%${searchLower}%,cpf.ilike.%${searchLower}%,responsible.ilike.%${searchLower}%`);
        }

        const { count: total, error: totalError } = await countQuery;
        if (totalError) throw totalError;

        // Get overdue count
        let overdueQuery = supabase
            .from('Client')
            .select('*', { count: 'exact', head: true })
            .gt('overdueInstallments', 0);

        if (search) {
            const searchLower = search.toLowerCase();
            overdueQuery = overdueQuery.or(`name.ilike.%${searchLower}%,cpf.ilike.%${searchLower}%,responsible.ilike.%${searchLower}%`);
        }

        const { count: totalOverdue, error: overdueError } = await overdueQuery;
        if (overdueError) throw overdueError;

        // Get current count (no overdue)
        let currentQuery = supabase
            .from('Client')
            .select('*', { count: 'exact', head: true })
            .eq('overdueInstallments', 0);

        if (search) {
            const searchLower = search.toLowerCase();
            currentQuery = currentQuery.or(`name.ilike.%${searchLower}%,cpf.ilike.%${searchLower}%,responsible.ilike.%${searchLower}%`);
        }

        const { count: totalCurrent, error: currentError } = await currentQuery;
        if (currentError) throw currentError;

        // Get critical count (>= 2 installments)
        let criticalQuery = supabase
            .from('Client')
            .select('*', { count: 'exact', head: true })
            .gte('overdueInstallments', 2);

        if (search) {
            const searchLower = search.toLowerCase();
            criticalQuery = criticalQuery.or(`name.ilike.%${searchLower}%,cpf.ilike.%${searchLower}%,responsible.ilike.%${searchLower}%`);
        }

        const { count: totalCritical, error: criticalError } = await criticalQuery;
        if (criticalError) throw criticalError;

        // Get total installments sum
        let sumQuery = supabase
            .from('Client')
            .select('overdueInstallments');

        if (search) {
            const searchLower = search.toLowerCase();
            sumQuery = sumQuery.or(`name.ilike.%${searchLower}%,cpf.ilike.%${searchLower}%,responsible.ilike.%${searchLower}%`);
        }

        const { data: installmentData, error: sumError } = await sumQuery;
        if (sumError) throw sumError;

        const totalInstallments = installmentData?.reduce((acc, c) => acc + (c.overdueInstallments || 0), 0) || 0;

        return NextResponse.json({
            total: total || 0,
            totalOverdue: totalOverdue || 0,
            totalCurrent: totalCurrent || 0,
            totalCritical: totalCritical || 0,
            totalInstallments
        });
    } catch (error) {
        console.error('Error fetching client stats:', error);
        return NextResponse.json({ error: 'Failed to fetch client stats' }, { status: 500 });
    }
}
