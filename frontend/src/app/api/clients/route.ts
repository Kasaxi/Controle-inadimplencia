import { NextResponse } from 'next/server';
import { Query, ID } from 'node-appwrite';
import { appwriteServer, DB_ID, CLIENTS_ID } from '@/lib/appwriteServer';
import type { ClientCreateInput, Client } from '@/types';

const DEFAULT_PAGE_SIZE = 20;

// Helper to map Appwrite document to Client type matching frontend expectations
function mapDocumentToClient(doc: any): Client {
    const { $id, $createdAt, $updatedAt, $collectionId, $databaseId, $permissions, ...rest } = doc;
    return {
        id: $id,
        ...rest,
        createdAt: doc.createdAt || $createdAt,
        updatedAt: doc.updatedAt || $updatedAt,
    } as Client;
}

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

        const queries = [
            Query.limit(limit),
            Query.offset(from)
        ];

        if (sortOrder === 'desc') {
            queries.push(Query.orderDesc(sortBy));
        } else {
            queries.push(Query.orderAsc(sortBy));
        }

        // Apply search filter (Appwrite requires indexes for full text search, using contains/equal or simple search if needed)
        // Using multiple contains within OR:
        if (search) {
            queries.push(Query.or([
                Query.contains('name', search),
                Query.contains('cpf', search),
                Query.contains('responsible', search)
            ]));
        }

        // Apply status filter
        if (status === 'overdue') {
            queries.push(Query.greaterThan('overdueInstallments', 0));
        } else if (status === 'current') {
            queries.push(Query.equal('overdueInstallments', 0));
        } else if (status === 'critical') {
            queries.push(Query.greaterThanEqual('overdueInstallments', criticalThreshold));
        } else if (status === 'new') {
            queries.push(Query.equal('isNewClient', true));
        }

        const response = await appwriteServer.databases.listDocuments(DB_ID, CLIENTS_ID, queries);
        
        const clients = response.documents.map(mapDocumentToClient);

        return NextResponse.json({
            data: clients,
            pagination: {
                page,
                limit,
                total: response.total,
                totalPages: Math.ceil(response.total / limit)
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
        
        const docData = {
            name: body.name,
            cpf: body.cpf,
            contactNumber: body.contactNumber || null,
            overdueInstallments: body.overdueInstallments ? Number(body.overdueInstallments) : 0,
            address: body.address || null,
            responsible: body.responsible || null,
            observation: body.observation || null,
            fileUrl: body.fileUrl || null,
            consultationDate: body.consultationDate || null,
            isNewClient: body.isNewClient === true,
            p1Paid: body.p1Paid === true,
            p2Paid: body.p2Paid === true,
            p3Paid: body.p3Paid === true,
            createdAt: now,
            updatedAt: now,
        };

        const doc = await appwriteServer.databases.createDocument(
            DB_ID, 
            CLIENTS_ID, 
            ID.unique(), 
            docData
        );

        return NextResponse.json(mapDocumentToClient(doc), { status: 201 });
    } catch (error) {
        const err = error as Error;
        console.error('Error creating client:', err.message);
        return NextResponse.json({ error: err.message || 'Failed to create client' }, { status: 500 });
    }
}
