import { NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { appwriteServer, DB_ID, CLIENTS_ID } from '@/lib/appwriteServer';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const criticalThreshold = parseInt(searchParams.get('criticalThreshold') || '2');

        const baseQueries = [Query.limit(1)]; // Limit 1 to only get the total count efficiently

        if (search) {
            baseQueries.push(Query.or([
                Query.contains('name', search),
                Query.contains('cpf', search),
                Query.contains('responsible', search)
            ]));
        }

        const getCount = async (additionalQueries: string[] = []) => {
            const res = await appwriteServer.databases.listDocuments(DB_ID, CLIENTS_ID, [...baseQueries, ...additionalQueries]);
            return res.total;
        };

        const totalP = getCount();
        const totalOverdueP = getCount([Query.greaterThan('overdueInstallments', 0)]);
        const totalCurrentP = getCount([Query.equal('overdueInstallments', 0)]);
        const totalCriticalP = getCount([Query.greaterThanEqual('overdueInstallments', criticalThreshold)]);
        const totalNewClientsP = getCount([Query.equal('isNewClient', true)]);

        // For total installments we need all records to sum them up. 
        // If there are many records, we should use pagination. For stats assuming reasonable dataset size for now.
        const sumQueries = [Query.limit(5000), Query.select(['overdueInstallments'])];
        if (search) {
             sumQueries.push(baseQueries[1]); // The search query
        }

        const installmentDataP = appwriteServer.databases.listDocuments(DB_ID, CLIENTS_ID, sumQueries);

        const [total, totalOverdue, totalCurrent, totalCritical, totalNewClients, installmentData] = await Promise.all([
            totalP, totalOverdueP, totalCurrentP, totalCriticalP, totalNewClientsP, installmentDataP
        ]);

        const totalInstallments = installmentData.documents.reduce((acc, c) => acc + (c.overdueInstallments || 0), 0);

        return NextResponse.json({
            total: total || 0,
            totalOverdue: totalOverdue || 0,
            totalCurrent: totalCurrent || 0,
            totalCritical: totalCritical || 0,
            totalNewClients: totalNewClients || 0,
            totalInstallments
        });
    } catch (error) {
        console.error('Error fetching client stats:', error);
        return NextResponse.json({ error: 'Failed to fetch client stats' }, { status: 500 });
    }
}
