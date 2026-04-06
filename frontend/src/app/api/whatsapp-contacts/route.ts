import { NextResponse } from 'next/server';
import { Query, ID } from 'node-appwrite';
import { appwriteServer, DB_ID, CONTACTS_ID } from '@/lib/appwriteServer';

export async function GET() {
    try {
        const response = await appwriteServer.databases.listDocuments(
            DB_ID,
            CONTACTS_ID,
            [
                Query.orderDesc('createdAt'),
                Query.limit(50)
            ]
        );

        const data = response.documents.map(doc => ({
            id: doc.$id,
            name: doc.name,
            number: doc.number,
            createdAt: doc.createdAt || doc.$createdAt,
            updatedAt: doc.updatedAt || doc.$updatedAt
        }));

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching WhatsApp contacts:', error);
        return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, number } = body;

        if (!name || !number) {
            return NextResponse.json({ error: 'Name and number are required' }, { status: 400 });
        }

        const now = new Date().toISOString();
        const doc = await appwriteServer.databases.createDocument(
            DB_ID,
            CONTACTS_ID,
            ID.unique(),
            {
                name,
                number,
                createdAt: now,
                updatedAt: now
            }
        );

        return NextResponse.json({
            id: doc.$id,
            name: doc.name,
            number: doc.number,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating WhatsApp contact:', error);
        return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
    }
}
