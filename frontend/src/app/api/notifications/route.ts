import { NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { appwriteServer, DB_ID, NOTIFICATIONS_ID, CLIENTS_ID } from '@/lib/appwriteServer';
import type { Notification, Client } from '@/types';

// Helper to map
function mapDocumentToNotification(doc: any, clientsMap: Record<string, Partial<Client>>): Notification {
    const { $id, $createdAt, $updatedAt, $collectionId, $databaseId, $permissions, ...rest } = doc;
    return {
        id: $id,
        ...rest,
        createdAt: doc.createdAt || $createdAt,
        client: doc.clientId ? clientsMap[doc.clientId] : null
    } as Notification;
}

export async function GET(request: Request) {
    try {
        const searchParams = new URL(request.url).searchParams;
        const type = searchParams.get('type');
        const read = searchParams.get('read');

        const queries = [
            Query.orderAsc('read'),
            Query.orderDesc('createdAt'),
            Query.limit(100) // safety limit
        ];

        if (type) queries.push(Query.equal('type', type));
        if (read !== null) queries.push(Query.equal('read', read === 'true'));

        const response = await appwriteServer.databases.listDocuments(
            DB_ID, 
            NOTIFICATIONS_ID, 
            queries
        );

        // Fetch related clients
        const clientIds = [...new Set(
            response.documents
                .map(n => n.clientId)
                .filter(id => id && typeof id === 'string')
        )];

        let clientsMap: Record<string, Partial<Client>> = {};
        if (clientIds.length > 0) {
            const cRes = await appwriteServer.databases.listDocuments(DB_ID, CLIENTS_ID, [
                Query.equal('$id', clientIds)
            ]);
            cRes.documents.forEach(c => {
                clientsMap[c.$id] = { id: c.$id, name: c.name, cpf: c.cpf };
            });
        }

        const data = response.documents.map(doc => mapDocumentToNotification(doc, clientsMap));

        return NextResponse.json(data);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}
