import { NextResponse } from 'next/server';
import { appwriteServer, DB_ID, CLIENTS_ID } from '@/lib/appwriteServer';
import type { ClientUpdateInput, Client } from '@/types';

interface RouteParams {
    params: Promise<{ id: string }>;
}

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
            updatedAt: new Date().toISOString()
        };
        
        const validKeys: (keyof ClientUpdateInput)[] = ['name', 'cpf', 'contactNumber', 'overdueInstallments', 'address', 'responsible', 'observation', 'fileUrl', 'consultationDate', 'alertStatus', 'isNewClient'];
        
        validKeys.forEach(key => {
            if (updateData[key] !== undefined) {
                mappedUpdate[key] = updateData[key];
            }
        });

        const doc = await appwriteServer.databases.updateDocument(
            DB_ID,
            CLIENTS_ID,
            id,
            mappedUpdate
        );

        return NextResponse.json(mapDocumentToClient(doc));
    } catch (error) {
        const err = error as Error;
        console.error('Error updating client:', err.message);
        return NextResponse.json({ error: err.message || 'Failed to update client' }, { status: 500 });
    }
}

export async function DELETE(_request: Request, context: RouteParams) {
    try {
        const { id } = await context.params;
        await appwriteServer.databases.deleteDocument(
            DB_ID,
            CLIENTS_ID,
            id
        );

        return NextResponse.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Error deleting client:', error);
        return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
    }
}
