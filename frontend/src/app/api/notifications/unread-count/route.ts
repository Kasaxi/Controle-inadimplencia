import { NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { appwriteServer, DB_ID, NOTIFICATIONS_ID } from '@/lib/appwriteServer';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const response = await appwriteServer.databases.listDocuments(
            DB_ID,
            NOTIFICATIONS_ID,
            [
                Query.equal('read', false),
                Query.limit(1) // Only limit 1 to get total efficiency
            ]
        );

        return NextResponse.json({ count: response.total ?? 0 });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return NextResponse.json({ error: 'Failed to get count' }, { status: 500 });
    }
}
